"use client";

import { useEffect, useRef, useCallback } from 'react';

// プリフェッチ設定の型定義
interface PrefetchConfig {
  enabled: boolean;
  delay: number; // ホバー後の遅延時間（ミリ秒）
  maxConcurrent: number; // 最大同時プリフェッチ数
  priority: 'high' | 'medium' | 'low';
}

// プリフェッチタスクの型定義
interface PrefetchTask {
  id: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  status: 'pending' | 'loading' | 'completed' | 'failed';
  promise?: Promise<any>;
}

// デフォルト設定
const DEFAULT_CONFIG: PrefetchConfig = {
  enabled: true,
  delay: 100, // 100ms
  maxConcurrent: 3,
  priority: 'medium',
};

// プリフェッチングフック
export function usePrefetch(config: Partial<PrefetchConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const tasksRef = useRef<Map<string, PrefetchTask>>(new Map());
  const activeTasksRef = useRef<Set<string>>(new Set());
  const hoverTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // プリフェッチタスクを実行
  const executePrefetch = useCallback(async (task: PrefetchTask) => {
    if (activeTasksRef.current.size >= finalConfig.maxConcurrent) {
      return; // 最大同時実行数を超えている
    }

    activeTasksRef.current.add(task.id);
    task.status = 'loading';

    try {
      const response = await fetch(task.url, {
        method: 'GET',
        headers: {
          'X-Prefetch': 'true',
        },
      });

      if (response.ok) {
        task.status = 'completed';
        console.log(`Prefetch completed: ${task.url}`);
      } else {
        task.status = 'failed';
        console.warn(`Prefetch failed: ${task.url} - ${response.status}`);
      }
    } catch (error) {
      task.status = 'failed';
      console.error(`Prefetch error: ${task.url}`, error);
    } finally {
      activeTasksRef.current.delete(task.id);
      // 完了したタスクを一定時間後に削除
      setTimeout(() => {
        tasksRef.current.delete(task.id);
      }, 60000); // 1分後に削除
    }
  }, [finalConfig.maxConcurrent]);

  // プリフェッチタスクをキューに追加
  const queuePrefetch = useCallback((url: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    if (!finalConfig.enabled) return;

    const taskId = `prefetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task: PrefetchTask = {
      id: taskId,
      url,
      priority,
      timestamp: Date.now(),
      status: 'pending',
    };

    tasksRef.current.set(taskId, task);

    // 優先度に基づいて実行
    if (priority === 'high') {
      // 高優先度は即座に実行
      executePrefetch(task);
    } else {
      // 中・低優先度はキューで管理
      setTimeout(() => {
        if (tasksRef.current.has(taskId)) {
          executePrefetch(task);
        }
      }, priority === 'medium' ? 100 : 500);
    }
  }, [finalConfig.enabled, executePrefetch]);

  // ホバー時のプリフェッチ
  const prefetchOnHover = useCallback((url: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    if (!finalConfig.enabled) return;

    // 既存のタイマーをクリア
    const existingTimer = hoverTimersRef.current.get(url);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 遅延後にプリフェッチを実行
    const timer = setTimeout(() => {
      queuePrefetch(url, priority);
      hoverTimersRef.current.delete(url);
    }, finalConfig.delay);

    hoverTimersRef.current.set(url, timer);
  }, [finalConfig.enabled, finalConfig.delay, queuePrefetch]);

  // ホバーキャンセル時の処理
  const cancelPrefetchOnHover = useCallback((url: string) => {
    const timer = hoverTimersRef.current.get(url);
    if (timer) {
      clearTimeout(timer);
      hoverTimersRef.current.delete(url);
    }
  }, []);

  // 即座にプリフェッチ
  const prefetchImmediate = useCallback((url: string, priority: 'high' | 'medium' | 'low' = 'high') => {
    if (!finalConfig.enabled) return;
    queuePrefetch(url, priority);
  }, [finalConfig.enabled, queuePrefetch]);

  // プリフェッチをキャンセル
  const cancelPrefetch = useCallback((url: string) => {
    // 該当するタスクを検索してキャンセル
    for (const [taskId, task] of tasksRef.current.entries()) {
      if (task.url === url && task.status === 'pending') {
        tasksRef.current.delete(taskId);
        break;
      }
    }

    // ホバータイマーもキャンセル
    cancelPrefetchOnHover(url);
  }, [cancelPrefetchOnHover]);

  // プリフェッチの状態を取得
  const getPrefetchStatus = useCallback((url: string) => {
    for (const task of tasksRef.current.values()) {
      if (task.url === url) {
        return task.status;
      }
    }
    return 'none';
  }, []);

  // プリフェッチ統計を取得
  const getPrefetchStats = useCallback(() => {
    const stats = {
      totalTasks: tasksRef.current.size,
      activeTasks: activeTasksRef.current.size,
      pendingTasks: 0,
      loadingTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      hoverTimers: hoverTimersRef.current.size,
    };

    for (const task of tasksRef.current.values()) {
      switch (task.status) {
        case 'pending':
          stats.pendingTasks++;
          break;
        case 'loading':
          stats.loadingTasks++;
          break;
        case 'completed':
          stats.completedTasks++;
          break;
        case 'failed':
          stats.failedTasks++;
          break;
      }
    }

    return stats;
  }, []);

  // プリフェッチをクリア
  const clearPrefetch = useCallback(() => {
    // ホバータイマーをクリア
    for (const timer of hoverTimersRef.current.values()) {
      clearTimeout(timer);
    }
    hoverTimersRef.current.clear();

    // タスクをクリア
    tasksRef.current.clear();
    activeTasksRef.current.clear();
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      clearPrefetch();
    };
  }, [clearPrefetch]);

  return {
    // プリフェッチ実行
    prefetchOnHover,
    prefetchImmediate,
    
    // キャンセル
    cancelPrefetch,
    cancelPrefetchOnHover,
    
    // 状態確認
    getStatus: getPrefetchStatus,
    getStats: getPrefetchStats,
    
    // 管理
    clear: clearPrefetch,
    
    // 設定
    config: finalConfig,
  };
}
