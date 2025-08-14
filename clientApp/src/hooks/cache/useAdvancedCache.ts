"use client";

import { useCallback, useMemo } from 'react';
import { useIntelligentCache } from './useIntelligentCache';
import { usePrefetch } from './usePrefetch';
import { useCacheInvalidation } from './useCacheInvalidation';

// 高度なキャッシュ設定の型定義
interface AdvancedCacheConfig {
  // インテリジェントキャッシュ設定
  cache: {
    maxSize: number;
    defaultTTL: number;
    cleanupInterval: number;
    priorityWeights: {
      high: number;
      medium: number;
      low: number;
    };
  };
  
  // プリフェッチ設定
  prefetch: {
    enabled: boolean;
    delay: number;
    maxConcurrent: number;
    priority: 'high' | 'medium' | 'low';
  };
  
  // 無効化設定
  invalidation: {
    rules: Array<{
      pattern: string;
      strategy: 'immediate' | 'delayed' | 'conditional';
      delay?: number;
      condition?: (url: string, data: any) => boolean;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
}

// デフォルト設定
const DEFAULT_CONFIG: AdvancedCacheConfig = {
  cache: {
    maxSize: 100,
    defaultTTL: 5 * 60 * 1000, // 5分
    cleanupInterval: 60 * 1000, // 1分
    priorityWeights: {
      high: 3,
      medium: 2,
      low: 1,
    },
  },
  prefetch: {
    enabled: true,
    delay: 100,
    maxConcurrent: 3,
    priority: 'medium',
  },
  invalidation: {
    rules: [
      {
        pattern: '/api/posts/*',
        strategy: 'delayed',
        delay: 5000,
        priority: 'high',
      },
      {
        pattern: '/api/users/*',
        strategy: 'conditional',
        condition: (url, data) => data?.updatedAt > Date.now() - 300000,
        priority: 'medium',
      },
      {
        pattern: '/api/search/*',
        strategy: 'immediate',
        priority: 'low',
      },
    ],
  },
};

// 高度なキャッシュフック
export function useAdvancedCache<T>(
  key: string,
  config: Partial<AdvancedCacheConfig> = {}
) {
  const finalConfig = useMemo(() => {
    const merged = { ...DEFAULT_CONFIG, ...config };
    return {
      cache: { ...DEFAULT_CONFIG.cache, ...config.cache },
      prefetch: { ...DEFAULT_CONFIG.prefetch, ...config.prefetch },
      invalidation: { ...DEFAULT_CONFIG.invalidation, ...config.invalidation },
    };
  }, [config]);

  // 各キャッシュ機能を初期化
  const intelligentCache = useIntelligentCache<T>(key, finalConfig.cache);
  const prefetch = usePrefetch(finalConfig.prefetch);
  const invalidation = useCacheInvalidation(intelligentCache, finalConfig.invalidation.rules);

  // 統合されたキャッシュ操作
  const get = useCallback((cacheKey: string): T | null => {
    return intelligentCache.get(cacheKey);
  }, [intelligentCache]);

  const set = useCallback((cacheKey: string, data: T, ttl?: number, priority?: 'high' | 'medium' | 'low') => {
    intelligentCache.set(cacheKey, data, ttl, priority);
  }, [intelligentCache]);

  const remove = useCallback((cacheKey: string) => {
    intelligentCache.remove(cacheKey);
  }, [intelligentCache]);

  const clear = useCallback(() => {
    intelligentCache.clear();
    prefetch.clear();
    invalidation.clear();
  }, [intelligentCache, prefetch, invalidation]);

  // プリフェッチ付きのデータ取得
  const getWithPrefetch = useCallback((cacheKey: string, prefetchUrl?: string): T | null => {
    const data = get(cacheKey);
    
    // プリフェッチURLが指定されている場合、ホバー時にプリフェッチ
    if (prefetchUrl && !data) {
      prefetch.prefetchImmediate(prefetchUrl, 'medium');
    }
    
    return data;
  }, [get, prefetch]);

  // データ更新時のキャッシュ無効化
  const setAndInvalidate = useCallback((
    cacheKey: string, 
    data: T, 
    ttl?: number, 
    priority?: 'high' | 'medium' | 'low',
    invalidatePatterns?: string[]
  ) => {
    // キャッシュに保存
    set(cacheKey, data, ttl, priority);
    
    // 指定されたパターンのキャッシュを無効化
    if (invalidatePatterns) {
      invalidatePatterns.forEach(pattern => {
        invalidation.invalidateByPattern(pattern);
      });
    }
  }, [set, invalidation]);

  // バッチ操作
  const batchSet = useCallback((items: Array<{ key: string; data: T; ttl?: number; priority?: 'high' | 'medium' | 'low' }>) => {
    items.forEach(({ key, data, ttl, priority }) => {
      set(key, data, ttl, priority);
    });
  }, [set]);

  const batchRemove = useCallback((keys: string[]) => {
    keys.forEach(key => remove(key));
  }, [remove]);

  // キャッシュの状態を取得
  const getCacheState = useCallback(() => {
    return {
      intelligent: intelligentCache.getState(),
      prefetch: prefetch.getStats(),
      invalidation: invalidation.getStats(),
    };
  }, [intelligentCache, prefetch, invalidation]);

  // パフォーマンス統計
  const getPerformanceStats = useCallback(() => {
    const cacheState = intelligentCache.getStats();
    const prefetchStats = prefetch.getStats();
    const invalidationStats = invalidation.getStats();
    
    return {
      cacheHitRate: cacheState.totalAccessCount > 0 
        ? (cacheState.size / cacheState.totalAccessCount) * 100 
        : 0,
      cacheEfficiency: cacheState.size / cacheState.maxSize,
      prefetchSuccessRate: prefetchStats.totalTasks > 0 
        ? (prefetchStats.completedTasks / prefetchStats.totalTasks) * 100 
        : 0,
      invalidationEfficiency: invalidationStats.completedEvents / Math.max(invalidationStats.totalEvents, 1),
      memoryUsage: cacheState.size,
      activePrefetchTasks: prefetchStats.activeTasks,
      pendingInvalidations: invalidationStats.pendingEvents,
    };
  }, [intelligentCache, prefetch, invalidation]);

  // キャッシュの最適化
  const optimizeCache = useCallback(() => {
    // 優先度の低いアイテムを削除
    const cacheState = intelligentCache.getState();
    const lowPriorityItems = cacheState.items
      .filter(item => item.priority === 'low' && item.score < 0.3)
      .map(item => item.key);
    
    if (lowPriorityItems.length > 0) {
      batchRemove(lowPriorityItems);
      console.log(`Optimized cache: removed ${lowPriorityItems.length} low-priority items`);
    }
  }, [intelligentCache, batchRemove]);

  return {
    // 基本操作
    get,
    set,
    remove,
    clear,
    
    // 高度な操作
    getWithPrefetch,
    setAndInvalidate,
    batchSet,
    batchRemove,
    
    // プリフェッチ
    prefetchOnHover: prefetch.prefetchOnHover,
    prefetchImmediate: prefetch.prefetchImmediate,
    cancelPrefetch: prefetch.cancelPrefetch,
    
    // 無効化
    invalidateURL: invalidation.invalidateURL,
    invalidateMultiple: invalidation.invalidateMultiple,
    invalidateByPattern: invalidation.invalidateByPattern,
    cancelInvalidation: invalidation.cancelInvalidation,
    
    // 状態・統計
    getState: getCacheState,
    getPerformanceStats,
    
    // 最適化
    optimize: optimizeCache,
    
    // 設定
    config: finalConfig,
    
    // 個別フックへのアクセス（高度なカスタマイズ用）
    intelligentCache,
    prefetch,
    invalidation,
  };
}
