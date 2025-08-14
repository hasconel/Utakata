"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOfflineStorage } from './useOfflineStorage';
import { useOfflineQueue } from './useOfflineQueue';

// オフライン状態の型定義
interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  lastOnline: number | null;
  offlineDuration: number;
}

// オフライン設定の型定義
interface OfflineConfig {
  storage: {
    dbName: string;
    maxSize: number;
    defaultTTL: number;
  };
  queue: {
    maxSize: number;
    maxRetries: number;
    batchSize: number;
    syncInterval: number;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number;
    retryInterval: number;
  };
}

// デフォルト設定
const DEFAULT_CONFIG: OfflineConfig = {
  storage: {
    dbName: 'UtakataOfflineDB',
    maxSize: 1000,
    defaultTTL: 24 * 60 * 60 * 1000, // 24時間
  },
  queue: {
    maxSize: 100,
    maxRetries: 3,
    batchSize: 5,
    syncInterval: 10000, // 10秒
  },
  sync: {
    autoSync: true,
    syncInterval: 30000, // 30秒
    retryInterval: 60000, // 1分
  },
};

// オフライン管理フック
export function useOfflineManager(
  config: Partial<OfflineConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    connectionType: 'unknown',
    connectionQuality: 'unknown',
    lastOnline: navigator.onLine ? Date.now() : null,
    offlineDuration: navigator.onLine ? 0 : Date.now() - (localStorage.getItem('lastOnline') ? parseInt(localStorage.getItem('lastOnline')!) : Date.now()),
  });

  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // オフラインストレージとキューの初期化
  const offlineStorage = useOfflineStorage('offlineManager', finalConfig.storage);
  const offlineQueue = useOfflineQueue(finalConfig.queue);

  // 接続状態の監視
  useEffect(() => {
    const handleOnline = () => {
      const now = Date.now();
      setOfflineState(prev => ({
        ...prev,
        isOnline: true,
        isOffline: false,
        lastOnline: now,
        offlineDuration: 0,
      }));
      
      localStorage.setItem('lastOnline', now.toString());
      console.log('Network connection restored');
      
      // オンライン復帰時の自動同期
      if (finalConfig.sync.autoSync) {
        startSync();
      }
    };

    const handleOffline = () => {
      const now = Date.now();
      setOfflineState(prev => ({
        ...prev,
        isOnline: false,
        isOffline: true,
        offlineDuration: 0,
      }));
      
      console.log('Network connection lost');
      
      // オフライン時の処理を停止
      stopSync();
    };

    // 接続品質の監視
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const connectionType = connection.effectiveType || 'unknown';
        const connectionQuality = getConnectionQuality(connectionType);
        
        setOfflineState(prev => ({
          ...prev,
          connectionType: connectionType as any,
          connectionQuality,
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [finalConfig.sync.autoSync]);

  // 接続品質を判定
  const getConnectionQuality = (connectionType: string): OfflineState['connectionQuality'] => {
    switch (connectionType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
      case 'slow-2g':
        return 'poor';
      default:
        return 'unknown';
    }
  };

  // オフライン時間の更新
  useEffect(() => {
    if (offlineState.isOffline) {
      const interval = setInterval(() => {
        setOfflineState(prev => ({
          ...prev,
          offlineDuration: Date.now() - (prev.lastOnline || Date.now()),
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [offlineState.isOffline, offlineState.lastOnline]);

  // 同期処理の開始
  const startSync = useCallback(async () => {
    if (isSyncing || !offlineState.isOnline) {
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    console.log('Starting offline sync...');

    try {
      // キューの処理
      setSyncProgress(25);
      await offlineQueue.process();
      
      // ストレージの同期
      setSyncProgress(50);
      const pendingItems = await offlineStorage.getPendingSync();
      
      if (pendingItems.length > 0) {
        setSyncProgress(75);
        // 実際の実装では、ここでサーバーとの同期を行う
        console.log(`Syncing ${pendingItems.length} pending items`);
      }
      
      setSyncProgress(100);
      setLastSyncTime(Date.now());
      console.log('Offline sync completed');
      
    } catch (error) {
      console.error('Offline sync failed:', error);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [isSyncing, offlineState.isOnline, offlineQueue, offlineStorage]);

  // 同期処理の停止
  const stopSync = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setIsSyncing(false);
    setSyncProgress(0);
  }, []);

  // 定期的な同期
  useEffect(() => {
    if (finalConfig.sync.autoSync && offlineState.isOnline) {
      syncTimerRef.current = setInterval(() => {
        if (offlineQueue.stats.total > 0) {
          startSync();
        }
      }, finalConfig.sync.syncInterval);
    }

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, [finalConfig.sync.autoSync, finalConfig.sync.syncInterval, offlineState.isOnline, offlineQueue.stats.total, startSync]);

  // 手動同期
  const manualSync = useCallback(async () => {
    if (offlineState.isOnline) {
      await startSync();
    } else {
      console.log('Cannot sync while offline');
    }
  }, [offlineState.isOnline, startSync]);

  // オフライン操作の追加
  const addOfflineOperation = useCallback((
    type: 'post' | 'like' | 'follow' | 'comment' | 'search' | 'custom',
    action: string,
    payload: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ) => {
    try {
      const queueId = offlineQueue.add(type, action, payload, priority);
      console.log(`Offline operation queued: ${action}`);
      return queueId;
    } catch (error) {
      console.error('Failed to queue offline operation:', error);
      throw error;
    }
  }, [offlineQueue]);

  // オフラインデータの保存
  const saveOfflineData = useCallback(async <T>(
    key: string,
    data: T,
    ttl?: number,
    priority: 'high' | 'medium' | 'low' = 'medium',
    syncStatus: 'synced' | 'pending' | 'failed' = 'pending'
  ) => {
    try {
      await offlineStorage.set(key, data, ttl, priority, syncStatus);
      console.log(`Data saved offline: ${key}`);
    } catch (error) {
      console.error('Failed to save offline data:', error);
      throw error;
    }
  }, [offlineStorage]);

  // オフラインデータの取得
  const getOfflineData = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      return await offlineStorage.get<T>(key);
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }, [offlineStorage]);

  // オフライン状態の統計
  const getOfflineStats = useCallback(() => {
    return {
      connection: offlineState,
      storage: offlineStorage.getStats(),
      queue: offlineQueue.stats,
      sync: {
        isSyncing,
        syncProgress,
        lastSyncTime,
        autoSync: finalConfig.sync.autoSync,
      },
    };
  }, [offlineState, offlineStorage, offlineQueue.stats, isSyncing, syncProgress, lastSyncTime, finalConfig.sync.autoSync]);

  // オフライン機能の有効化/無効化
  const toggleOfflineMode = useCallback((enabled: boolean) => {
    if (enabled) {
      console.log('Offline mode enabled');
      // オフライン機能を有効化
    } else {
      console.log('Offline mode disabled');
      // オフライン機能を無効化
    }
  }, []);

  // オフラインストレージのクリア
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineStorage.clear();
      offlineQueue.clear();
      console.log('Offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, [offlineStorage, offlineQueue]);

  return {
    // 状態管理
    offlineState,
    isSyncing,
    syncProgress,
    lastSyncTime,
    
    // 同期制御
    startSync,
    stopSync,
    manualSync,
    
    // オフライン操作
    addOfflineOperation,
    saveOfflineData,
    getOfflineData,
    
    // 統計・情報
    getOfflineStats,
    
    // 設定・制御
    toggleOfflineMode,
    clearOfflineData,
    
    // 個別フックへのアクセス
    offlineStorage,
    offlineQueue,
    
    // 設定
    config: finalConfig,
  };
}
