/**
 * APIフック！✨
 * APIの呼び出しをキラキラに管理するよ！💖
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/lib/api/client';


// キャッシュの型定義
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// グローバルキャッシュ
const cache = new Map<string, CacheEntry<any>>();

// APIフックのオプション！✨
interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  enabled?: boolean;
  cacheKey?: string;
  cacheTTL?: number; // キャッシュの有効期限（ミリ秒）
}

// APIフックの戻り値！✨
interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * キャッシュからデータを取得
 */
function getFromCache<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * キャッシュにデータを保存
 */
function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

/**
 * APIを呼び出すフック！✨
 * @param fetcher APIを呼び出す関数
 * @param options オプション
 * @returns APIの結果
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (useCache: boolean = true) => {
    // 前のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    try {
      setIsLoading(true);
      setError(null);
      
      // キャッシュから取得を試行
      if (useCache && options.cacheKey) {
        const cachedData = getFromCache<T>(options.cacheKey, options.cacheTTL || 30000);
        if (cachedData) {
          setData(cachedData);
          options.onSuccess?.(cachedData);
          return;
        }
      }
      
      const result = await fetcher();
      
      // キャッシュに保存
      if (options.cacheKey) {
        setCache(options.cacheKey, result, options.cacheTTL || 30000);
      }
      
      setData(result);
      options.onSuccess?.(result);  
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // キャンセルされた場合は何もしない
      }
      
      const apiError = err instanceof ApiError ? err : new ApiError('エラーが発生したよ！💦');
      setError(apiError);
      options.onError?.(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, options.onSuccess, options.onError, options.cacheKey, options.cacheTTL]);

  useEffect(() => {
    if (options.enabled !== false) {
      fetchData();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, options.enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(false), // キャッシュを無視して再取得
  };
}

/**
 * 投稿を取得するフック！✨
 * @param postId 投稿ID
 * @returns 投稿の結果
 */
export function usePost(postId: string) {
  return useApi(() => fetch(`/api/posts/${postId}`).then(res => res.json()));
}


/**
 * ユーザー情報を取得するフック！✨
 * @param userId ユーザーID
 * @returns ユーザー情報の結果
 */
export function useUser(userId: string) {
  return useApi(() => fetch(`/api/users/${userId}`,
    {
      method: "GET",
      headers: {
        "Accept": "application/activity+json"
      }
    }
  ).then(res => res.json()));
}
