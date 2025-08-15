"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// キューアイテムの型定義
interface QueueItem {
  id: string;
  type: 'post' | 'like' | 'follow' | 'comment' | 'search' | 'custom';
  action: string;
  payload: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// キュー設定の型定義
interface QueueConfig {
  maxSize: number;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  syncInterval: number;
  priorityWeights: {
    high: number;
    medium: number;
    low: number;
  };
}

// デフォルト設定
const DEFAULT_CONFIG: QueueConfig = {
  maxSize: 100,
  maxRetries: 3,
  retryDelay: 5000, // 5秒
  batchSize: 5,
  syncInterval: 10000, // 10秒
  priorityWeights: {
    high: 3,
    medium: 2,
    low: 1,
  },
};

// オフラインキューフック
export function useOfflineQueue(
  config: Partial<QueueConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const queueRef = useRef<Map<string, QueueItem>>(new Map());
  const isOnlineRef = useRef<boolean>(navigator.onLine);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      //console.log('Network is online, starting sync...');
      processQueue();
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      //console.log('Network is offline, operations will be queued');
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // キューにアイテムを追加
  const addToQueue = useCallback((
    type: QueueItem['type'],
    action: string,
    payload: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): string => {
    if (queueRef.current.size >= finalConfig.maxSize) {
      throw new Error('Queue is full');
    }

    const id = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item: QueueItem = {
      id,
      type,
      action,
      payload,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries: finalConfig.maxRetries,
      status: 'pending',
    };

    queueRef.current.set(id, item);
    updateStats();
    //console.log(`Added to offline queue: ${action}`);

    // オンラインの場合は即座に処理を試行
    if (isOnlineRef.current) {
      processQueue();
    }

    return id;
  }, [finalConfig.maxSize, finalConfig.maxRetries]);

  // キューからアイテムを削除
  const removeFromQueue = useCallback((id: string) => {
    if (queueRef.current.delete(id)) {
      updateStats();
      //console.log(`Removed from queue: ${id}`);
    }
  }, []);

  // キューをクリア
  const clearQueue = useCallback(() => {
    queueRef.current.clear();
    updateStats();
    //console.log('Queue cleared');
  }, []);

  // キューアイテムの状態を更新
  const updateItemStatus = useCallback((id: string, status: QueueItem['status'], error?: string) => {
    const item = queueRef.current.get(id);
    if (item) {
      item.status = status;
      if (error) {
        item.error = error;
      }
      updateStats();
    }
  }, []);

  // キューアイテムのリトライ回数を増加
  const incrementRetryCount = useCallback((id: string) => {
    const item = queueRef.current.get(id);
    if (item) {
      item.retryCount++;
      if (item.retryCount >= item.maxRetries) {
        item.status = 'failed';
        item.error = 'Max retries exceeded';
      }
      updateStats();
    }
  }, []);

  // 統計情報を更新
  const updateStats = useCallback(() => {
    const items = Array.from(queueRef.current.values());
    setStats({
      total: items.length,
      pending: items.filter(item => item.status === 'pending').length,
      processing: items.filter(item => item.status === 'processing').length,
      completed: items.filter(item => item.status === 'completed').length,
      failed: items.filter(item => item.status === 'failed').length,
    });
  }, []);

  // キューアイテムを処理
  const processItem = useCallback(async (item: QueueItem): Promise<boolean> => {
    try {
      updateItemStatus(item.id, 'processing');
      
      // 実際のAPI呼び出しをシミュレート
      // 本実装では、ここで実際のAPIエンドポイントを呼び出す
      const success = await executeAction(item);
      
      if (success) {
        updateItemStatus(item.id, 'completed');
        //console.log(`Queue item processed successfully: ${item.action}`);
        return true;
      } else {
        throw new Error('Action execution failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      //console.error(`Failed to process queue item: ${item.action}`, error);
      
      if (item.retryCount < item.maxRetries) {
        incrementRetryCount(item.id);
        updateItemStatus(item.id, 'pending');
        return false;
      } else {
        updateItemStatus(item.id, 'failed', errorMessage);
        return false;
      }
    }
  }, [updateItemStatus, incrementRetryCount]);

  // アクションを実行
  const executeAction = useCallback(async (item: QueueItem): Promise<boolean> => {
    // 実際の実装では、ここでAPIエンドポイントを呼び出す
    // 現在はシミュレーション
    switch (item.type) {
      case 'post':
        return await simulatePostAction(item.payload);
      case 'like':
        return await simulateLikeAction(item.payload);
      case 'follow':
        return await simulateFollowAction(item.payload);
      case 'comment':
        return await simulateCommentAction(item.payload);
      case 'search':
        return await simulateSearchAction(item.payload);
      default:
        return await simulateCustomAction(item.payload);
    }
  }, []);

  // アクション実行のシミュレーション
  const simulatePostAction = async (payload: any): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    return Math.random() > 0.1; // 90%の成功率
  };

  const simulateLikeAction = async (payload: any): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    return Math.random() > 0.05; // 95%の成功率
  };

  const simulateFollowAction = async (payload: any): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
    return Math.random() > 0.08; // 92%の成功率
  };

  const simulateCommentAction = async (payload: any): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 2500));
    return Math.random() > 0.15; // 85%の成功率
  };

  const simulateSearchAction = async (payload: any): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 800));
    return Math.random() > 0.02; // 98%の成功率
  };

  const simulateCustomAction = async (payload: any): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1200));
    return Math.random() > 0.12; // 88%の成功率
  };

  // キューを処理
  const processQueue = useCallback(async () => {
    if (!isOnlineRef.current || isProcessing) {
      return;
    }

    setIsProcessing(true);
    //console.log('Processing offline queue...');

    try {
      const pendingItems = Array.from(queueRef.current.values())
        .filter(item => item.status === 'pending')
        .sort((a, b) => {
          // 優先度とタイムスタンプでソート
          const priorityDiff = finalConfig.priorityWeights[b.priority] - finalConfig.priorityWeights[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.timestamp - b.timestamp;
        });

      // バッチサイズ分ずつ処理
      for (let i = 0; i < pendingItems.length; i += finalConfig.batchSize) {
        const batch = pendingItems.slice(i, i + finalConfig.batchSize);
        
        await Promise.allSettled(
          batch.map(item => processItem(item))
        );

        // バッチ間で少し待機
        if (i + finalConfig.batchSize < pendingItems.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      //console.log('Queue processing completed');
    } catch (error) {
      //console.error('Queue processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, finalConfig.priorityWeights, finalConfig.batchSize, processItem]);

  // 定期的な同期
  useEffect(() => {
    if (isOnlineRef.current) {
      syncTimerRef.current = setInterval(() => {
        if (queueRef.current.size > 0) {
          processQueue();
        }
      }, finalConfig.syncInterval);
    }

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, [processQueue, finalConfig.syncInterval]);

  // キューアイテムを取得
  const getQueueItems = useCallback(() => {
    return Array.from(queueRef.current.values());
  }, []);

  // 特定のタイプのアイテムを取得
  const getItemsByType = useCallback((type: QueueItem['type']) => {
    return Array.from(queueRef.current.values()).filter(item => item.type === type);
  }, []);

  // 失敗したアイテムを再試行
  const retryFailedItems = useCallback(() => {
    const failedItems = Array.from(queueRef.current.values())
      .filter(item => item.status === 'failed');

    failedItems.forEach(item => {
      item.status = 'pending';
      item.retryCount = 0;
      item.error = undefined;
    });

    updateStats();
    //console.log(`Retrying ${failedItems.length} failed items`);

    if (isOnlineRef.current) {
      processQueue();
    }
  }, [processQueue, updateStats]);

  // キューアイテムの詳細を取得
  const getItemDetails = useCallback((id: string) => {
    return queueRef.current.get(id);
  }, []);

  return {
    // 基本操作
    add: addToQueue,
    remove: removeFromQueue,
    clear: clearQueue,
    
    // 状態管理
    isProcessing,
    stats,
    
    // キュー情報
    getItems: getQueueItems,
    getItemsByType,
    getItemDetails,
    
    // 処理制御
    process: processQueue,
    retryFailed: retryFailedItems,
    
    // 設定
    config: finalConfig,
  };
}
