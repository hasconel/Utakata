"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// ストレージアイテムの型定義
interface StorageItem<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  priority: 'high' | 'medium' | 'low';
  syncStatus: 'synced' | 'pending' | 'failed';
}

// ストレージ設定の型定義
interface StorageConfig {
  dbName: string;
  dbVersion: number;
  storeName: string;
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
}

// デフォルト設定
const DEFAULT_CONFIG: StorageConfig = {
  dbName: 'UtakataOfflineDB',
  dbVersion: 1,
  storeName: 'offlineStorage',
  maxSize: 1000,
  defaultTTL: 24 * 60 * 60 * 1000, // 24時間
  cleanupInterval: 5 * 60 * 1000, // 5分
};

// IndexedDBの管理クラス
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
      };
    });
  }

  async set<T>(item: StorageItem<T>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<StorageItem<T> | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(): Promise<StorageItem<T>[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSync<T>(): Promise<StorageItem<T>[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

// オフラインストレージフック
export function useOfflineStorage<T>(
  key: string,
  config: Partial<StorageConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const dbManagerRef = useRef<IndexedDBManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // IndexedDBの初期化
  const initDB = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!dbManagerRef.current) {
        dbManagerRef.current = new IndexedDBManager(finalConfig);
      }

      await dbManagerRef.current.init();
      setIsInitialized(true);
      console.log('IndexedDB initialized successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize IndexedDB');
      setError(error);
      console.error('IndexedDB initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [finalConfig]);

  // 初期化
  useEffect(() => {
    initDB();
  }, [initDB]);

  // データを保存
  const set = useCallback(async (
    storageKey: string, 
    data: T, 
    ttl?: number, 
    priority: 'high' | 'medium' | 'low' = 'medium',
    syncStatus: 'synced' | 'pending' | 'failed' = 'synced'
  ) => {
    if (!dbManagerRef.current || !isInitialized) {
      throw new Error('Storage not initialized');
    }

    try {
      const item: StorageItem<T> = {
        key: storageKey,
        data,
        timestamp: Date.now(),
        ttl: ttl || finalConfig.defaultTTL,
        priority,
        syncStatus,
      };

      await dbManagerRef.current.set(item);
      console.log(`Data stored offline: ${storageKey}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to store data');
      console.error('Failed to store data:', error);
      throw error;
    }
  }, [isInitialized, finalConfig.defaultTTL]);

  // データを取得
  const get = useCallback(async (storageKey: string): Promise<T | null> => {
    if (!dbManagerRef.current || !isInitialized) {
      return null;
    }

    try {
      const item = await dbManagerRef.current.get<T>(storageKey);
      
      if (!item) return null;

      // TTLチェック
      if (Date.now() - item.timestamp > item.ttl) {
        await dbManagerRef.current.remove(storageKey);
        return null;
      }

      return item.data;
    } catch (err) {
      console.error('Failed to retrieve data:', err);
      return null;
    }
  }, [isInitialized]);

  // データを削除
  const remove = useCallback(async (storageKey: string) => {
    if (!dbManagerRef.current || !isInitialized) {
      return;
    }

    try {
      await dbManagerRef.current.remove(storageKey);
      console.log(`Data removed from offline storage: ${storageKey}`);
    } catch (err) {
      console.error('Failed to remove data:', err);
    }
  }, [isInitialized]);

  // 全データを取得
  const getAll = useCallback(async (): Promise<StorageItem<T>[]> => {
    if (!dbManagerRef.current || !isInitialized) {
      return [];
    }

    try {
      return await dbManagerRef.current.getAll<T>();
    } catch (err) {
      console.error('Failed to retrieve all data:', err);
      return [];
    }
  }, [isInitialized]);

  // 同期待ちのデータを取得
  const getPendingSync = useCallback(async (): Promise<StorageItem<T>[]> => {
    if (!dbManagerRef.current || !isInitialized) {
      return [];
    }

    try {
      return await dbManagerRef.current.getPendingSync<T>();
    } catch (err) {
      console.error('Failed to retrieve pending sync data:', err);
      return [];
    }
  }, [isInitialized]);

  // ストレージをクリア
  const clear = useCallback(async () => {
    if (!dbManagerRef.current || !isInitialized) {
      return;
    }

    try {
      await dbManagerRef.current.clear();
      console.log('Offline storage cleared');
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  }, [isInitialized]);

  // データの有効性をチェック
  const isValid = useCallback(async (storageKey: string): Promise<boolean> => {
    const data = await get(storageKey);
    return data !== null;
  }, [get]);

  // ストレージの統計情報を取得
  const getStats = useCallback(async () => {
    if (!dbManagerRef.current || !isInitialized) {
      return null;
    }

    try {
      const allItems = await getAll();
      const now = Date.now();
      
      const stats = {
        totalItems: allItems.length,
        validItems: allItems.filter(item => now - item.timestamp <= item.ttl).length,
        expiredItems: allItems.filter(item => now - item.timestamp > item.ttl).length,
        pendingSync: allItems.filter(item => item.syncStatus === 'pending').length,
        failedSync: allItems.filter(item => item.syncStatus === 'failed').length,
        highPriority: allItems.filter(item => item.priority === 'high').length,
        mediumPriority: allItems.filter(item => item.priority === 'medium').length,
        lowPriority: allItems.filter(item => item.priority === 'low').length,
        storageSize: finalConfig.maxSize,
        usagePercentage: (allItems.length / finalConfig.maxSize) * 100,
      };

      return stats;
    } catch (err) {
      console.error('Failed to get storage stats:', err);
      return null;
    }
  }, [isInitialized, getAll, finalConfig.maxSize]);

  // 古いデータのクリーンアップ
  const cleanup = useCallback(async () => {
    if (!dbManagerRef.current || !isInitialized) {
      return;
    }

    try {
      const allItems = await getAll();
      const now = Date.now();
      const expiredItems = allItems.filter(item => now - item.timestamp > item.ttl);

      for (const item of expiredItems) {
        await remove(item.key);
      }

      if (expiredItems.length > 0) {
        console.log(`Cleaned up ${expiredItems.length} expired items`);
      }
    } catch (err) {
      console.error('Cleanup failed:', err);
    }
  }, [isInitialized, getAll, remove]);

  // 定期的なクリーンアップ
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(cleanup, finalConfig.cleanupInterval);
    return () => clearInterval(interval);
  }, [isInitialized, cleanup, finalConfig.cleanupInterval]);

  return {
    // 基本操作
    set,
    get,
    remove,
    getAll,
    clear,
    
    // 状態管理
    isInitialized,
    isLoading,
    error,
    
    // 高度な操作
    getPendingSync,
    isValid,
    getStats,
    cleanup,
    
    // 設定
    config: finalConfig,
  };
}
