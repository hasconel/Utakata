/**
 * APIフック！✨
 * APIの呼び出しをキラキラに管理するよ！💖
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import { Post } from '@/lib/appwrite/posts';

// APIフックのオプション！✨
interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  enabled?: boolean;
}

// APIフックの戻り値！✨
interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
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

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
      options.onSuccess?.(result);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('エラーが発生したよ！💦');
      setError(apiError);
      options.onError?.(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, options.onSuccess, options.onError]);

  useEffect(() => {
    if (options.enabled !== false) {
      fetchData();
    }
  }, [fetchData, options.enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
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
 * タイムラインを取得するフック！✨
 * @param limit 取得件数
 * @param offset オフセット
 * @param lastId 最後の投稿ID
 * @param firstId 最初の投稿ID
 * @returns タイムラインの結果
 */
export function useTimeline(limit: number = 10, offset: number | null = 0, lastId: string | null = null, firstId: string | null = null): UseApiResult<Post[]> {
  const offsetQuery = offset ? `&offset=${offset}` : "";
  const lastIdQuery = lastId ? `&lastId=${lastId}` : "";
  const firstIdQuery = firstId ? `&firstId=${firstId}` : "";
  const fetcher = useCallback(() => fetch(`/api/posts?limit=${limit}${offsetQuery}${lastIdQuery}${firstIdQuery}`,
    {
      method: "GET",
      headers: {
        "Accept": "application/activity+json"
      }
    }
  ).then(res => res.body?.getReader()).then((reader)=> {
    const decoder = new TextDecoder();
    return reader?.read().then((result)=> {
      const text = decoder.decode(result.value, { stream: true });
      return JSON.parse(text).postsAsPostArray;
    });
  }), [limit, offset, lastId, firstId]);
  return useApi<Post[]>(fetcher);
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
