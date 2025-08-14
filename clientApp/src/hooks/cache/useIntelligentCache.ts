"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// キャッシュアイテムの型定義
interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number; // Time to Live (ミリ秒)
  priority: 'high' | 'medium' | 'low';
}

// キャッシュ設定の型定義
interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  priorityWeights: {
    high: number;
    medium: number;
    low: number;
  };
}

// デフォルト設定
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5分
  cleanupInterval: 60 * 1000, // 1分
  priorityWeights: {
    high: 3,
    medium: 2,
    low: 1,
  },
};

// インテリジェントキャッシュフック
export function useIntelligentCache<T>(
  key: string,
  config: Partial<CacheConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const cacheRef = useRef<Map<string, CacheItem<T>>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // キャッシュの優先度を計算
  const calculatePriority = useCallback((accessCount: number, lastAccessed: number): 'high' | 'medium' | 'low' => {
    const timeSinceLastAccess = Date.now() - lastAccessed;
    const timeWeight = Math.max(0, 1 - timeSinceLastAccess / (24 * 60 * 60 * 1000)); // 24時間で正規化
    const accessWeight = Math.min(1, accessCount / 100); // 100回で正規化
    
    const score = (timeWeight + accessWeight) / 2;
    
    if (score > 0.7) return 'high';
    if (score > 0.3) return 'medium';
    return 'low';
  }, []);

  // キャッシュの有効性をチェック
  const isCacheValid = useCallback((item: CacheItem<T>): boolean => {
    return Date.now() - item.timestamp < item.ttl;
  }, []);

  // キャッシュの優先度スコアを計算
  const calculateCacheScore = useCallback((item: CacheItem<T>): number => {
    const priorityWeight = finalConfig.priorityWeights[item.priority];
    const timeWeight = Math.max(0, 1 - (Date.now() - item.lastAccessed) / item.ttl);
    const accessWeight = Math.min(1, item.accessCount / 50);
    
    return priorityWeight * timeWeight * accessWeight;
  }, [finalConfig.priorityWeights]);

  // キャッシュのクリーンアップ
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const validItems = new Map<string, CacheItem<T>>();
    
    // 有効なアイテムを保持
    for (const [key, item] of cacheRef.current.entries()) {
      if (isCacheValid(item)) {
        validItems.set(key, item);
      }
    }
    
    // サイズ制限を超える場合、優先度の低いアイテムを削除
    if (validItems.size > finalConfig.maxSize) {
      const sortedItems = Array.from(validItems.entries())
        .sort(([, a], [, b]) => calculateCacheScore(b) - calculateCacheScore(a))
        .slice(0, finalConfig.maxSize);
      
      cacheRef.current = new Map(sortedItems);
    } else {
      cacheRef.current = validItems;
    }
  }, [finalConfig.maxSize, isCacheValid, calculateCacheScore]);

  // 定期的なクリーンアップ
  useEffect(() => {
    const interval = setInterval(cleanupCache, finalConfig.cleanupInterval);
    return () => clearInterval(interval);
  }, [cleanupCache, finalConfig.cleanupInterval]);

  // キャッシュからデータを取得
  const getFromCache = useCallback((cacheKey: string): T | null => {
    const item = cacheRef.current.get(cacheKey);
    if (!item || !isCacheValid(item)) {
      return null;
    }
    
    // アクセス情報を更新
    item.accessCount++;
    item.lastAccessed = Date.now();
    item.priority = calculatePriority(item.accessCount, item.lastAccessed);
    
    return item.data;
  }, [isCacheValid, calculatePriority]);

  // キャッシュにデータを保存
  const setToCache = useCallback((cacheKey: string, data: T, ttl?: number, priority?: 'high' | 'medium' | 'low') => {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      ttl: ttl || finalConfig.defaultTTL,
      priority: priority || 'medium',
    };
    
    cacheRef.current.set(cacheKey, item);
    
    // サイズ制限チェック
    if (cacheRef.current.size > finalConfig.maxSize) {
      cleanupCache();
    }
  }, [finalConfig.defaultTTL, finalConfig.maxSize, cleanupCache]);

  // キャッシュからデータを削除
  const removeFromCache = useCallback((cacheKey: string) => {
    cacheRef.current.delete(cacheKey);
  }, []);

  // キャッシュをクリア
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // キャッシュの統計情報を取得
  const getCacheStats = useCallback(() => {
    const stats = {
      size: cacheRef.current.size,
      maxSize: finalConfig.maxSize,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      totalAccessCount: 0,
      averageTTL: 0,
    };
    
    let totalTTL = 0;
    
    for (const item of cacheRef.current.values()) {
      stats.totalAccessCount += item.accessCount;
      totalTTL += item.ttl;
      
      switch (item.priority) {
        case 'high':
          stats.highPriority++;
          break;
        case 'medium':
          stats.mediumPriority++;
          break;
        case 'low':
          stats.lowPriority++;
          break;
      }
    }
    
    stats.averageTTL = cacheRef.current.size > 0 ? totalTTL / cacheRef.current.size : 0;
    
    return stats;
  }, [finalConfig.maxSize]);

  // キャッシュの状態を取得
  const getCacheState = useCallback(() => {
    return {
      items: Array.from(cacheRef.current.entries()).map(([key, item]) => ({
        key,
        data: item.data,
        timestamp: item.timestamp,
        accessCount: item.accessCount,
        lastAccessed: item.lastAccessed,
        ttl: item.ttl,
        priority: item.priority,
        isValid: isCacheValid(item),
        score: calculateCacheScore(item),
      })),
      stats: getCacheStats(),
    };
  }, [isCacheValid, calculateCacheScore, getCacheStats]);

  return {
    // 基本操作
    get: getFromCache,
    set: setToCache,
    remove: removeFromCache,
    clear: clearCache,
    
    // 状態管理
    isLoading,
    error,
    setError,
    
    // 統計・情報
    getStats: getCacheStats,
    getState: getCacheState,
    
    // 設定
    config: finalConfig,
  };
}
