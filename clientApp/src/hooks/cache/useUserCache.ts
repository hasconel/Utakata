/**
 * ユーザーキャッシュフック！✨
 * ユーザー情報をキラキラにキャッシュしてパフォーマンスを向上させるよ！💖
 */

"use client";
import { useState, useEffect, useCallback } from "react";
import { Models } from "appwrite";

// キャッシュアイテムの型定義
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// キャッシュストアの型定義
interface CacheStore {
  [key: string]: CacheItem<any>;
}

// デフォルトのキャッシュ設定
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5分
const MAX_CACHE_SIZE = 100; // 最大キャッシュ数

// グローバルキャッシュストア
let cacheStore: CacheStore = {};

export function useUserCache() {
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    hits: 0,
    misses: 0,
  });

  // キャッシュからデータを取得
  const get = useCallback(<T>(key: string): T | null => {
    const item = cacheStore[key];
    if (!item) {
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    const now = Date.now();
    if (now > item.expiresAt) {
      // 期限切れのアイテムを削除
      delete cacheStore[key];
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    return item.data;
  }, []);

  // データをキャッシュに保存
  const set = useCallback(<T>(key: string, data: T, duration = DEFAULT_CACHE_DURATION) => {
    const now = Date.now();
    
    // キャッシュサイズをチェック
    const keys = Object.keys(cacheStore);
    if (keys.length >= MAX_CACHE_SIZE) {
      // 最も古いアイテムを削除
      const oldestKey = keys.reduce((oldest, current) => 
        cacheStore[current].timestamp < cacheStore[oldest].timestamp ? current : oldest
      );
      delete cacheStore[oldestKey];
    }

    cacheStore[key] = {
      data,
      timestamp: now,
      expiresAt: now + duration,
    };

    setCacheStats(prev => ({ ...prev, size: Object.keys(cacheStore).length }));
  }, []);

  // キャッシュからデータを削除
  const remove = useCallback((key: string) => {
    if (cacheStore[key]) {
      delete cacheStore[key];
      setCacheStats(prev => ({ ...prev, size: Object.keys(cacheStore).length }));
    }
  }, []);

  // キャッシュをクリア
  const clear = useCallback(() => {
    cacheStore = {};
    setCacheStats({ size: 0, hits: 0, misses: 0 });
  }, []);

  // 期限切れのアイテムをクリーンアップ
  const cleanup = useCallback(() => {
    const now = Date.now();
    const keys = Object.keys(cacheStore);
    
    keys.forEach(key => {
      if (now > cacheStore[key].expiresAt) {
        delete cacheStore[key];
      }
    });

    setCacheStats(prev => ({ ...prev, size: Object.keys(cacheStore).length }));
  }, []);

  // 定期的にクリーンアップを実行
  useEffect(() => {
    const interval = setInterval(cleanup, 60000); // 1分ごと
    return () => clearInterval(interval);
  }, [cleanup]);

  // ユーザー情報専用のキャッシュ関数
  const getUser = useCallback((userId: string): Models.User<Models.Preferences> | null => {
    return get(`user:${userId}`);
  }, [get]);

  const setUser = useCallback((userId: string, user: Models.User<Models.Preferences>) => {
    set(`user:${userId}`, user, DEFAULT_CACHE_DURATION);
  }, [set]);

  const removeUser = useCallback((userId: string) => {
    remove(`user:${userId}`);
  }, [remove]);

  return {
    // 汎用キャッシュ関数
    get,
    set,
    remove,
    clear,
    cleanup,
    
    // ユーザー専用関数
    getUser,
    setUser,
    removeUser,
    
    // キャッシュ統計
    stats: cacheStats,
  };
} 