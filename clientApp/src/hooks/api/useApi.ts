/**
 * APIフック！✨
 * APIの呼び出しをキラキラに管理するよ！💖
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/lib/api/client';
import { ActivityPubNoteInClient, ActivityPubNote, ActivityPubActor } from '@/types/activitypub';


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

  // optionsをrefで安定化
  const optionsRef = useRef(options);
  optionsRef.current = options;

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
      if (useCache && optionsRef.current.cacheKey) {
        const cachedData = getFromCache<T>(optionsRef.current.cacheKey, optionsRef.current.cacheTTL || 30000);
        if (cachedData) {
          setData(cachedData);
          optionsRef.current.onSuccess?.(cachedData);
          return;
        }
      }
      const result = await fetcher();
        //console.log("result", result);
      // キャッシュに保存
      if (optionsRef.current.cacheKey) {
        setCache(optionsRef.current.cacheKey, result, optionsRef.current.cacheTTL || 30000);
        //console.log("キャッシュに保存しました");
      }
      setData(result);
      optionsRef.current.onSuccess?.(result);  
    } catch (err) {
      //console.log("err", err);
      if (err instanceof Error && err.name === 'AbortError') {
        console.log("キャンセルされたよ");
        return; // キャンセルされた場合は何もしない
      }
      console.log("エラーが発生したよ", err);
      const apiError = err instanceof ApiError ? err : new ApiError('エラーが発生したよ！💦');
      setError(apiError);
      optionsRef.current.onError?.(apiError);
    } finally {
      setIsLoading(false);
    }
  }, []); 

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
 * @param postId 投稿ID https://example.com/posts/123
 * @returns 投稿の結果
 */
export function usePost(postId: string) : UseApiResult<ActivityPubNote> {
  try{  
return useApi(() =>{
  if(!postId){
    return Promise.resolve(null);
  }
  return fetch(postId,
    {
      method: "GET",
      headers: {
        "Accept": "application/activity+json"
      }
    }
  ).then(res => res.status === 200 ? res.json() : null);
  });
}catch(error){
  console.log("usePost error", error);
  return {
    data: null,
    isLoading: false,
    error: error as ApiError,
    refetch: () => Promise.resolve()
  };
}
}


/**
 * ユーザー情報を取得するフック！✨
 * @param userId ユーザーID https://example.com/users/123
 * @returns ユーザー情報の結果
 */
export function useUser(userId: string) : UseApiResult<ActivityPubActor> {
  try{
  return useApi(() => fetch(userId,
    {
      method: "GET",
      headers: {
        "Accept": "application/activity+json"
      }
    }
  ).then(res => res.json()));
  }catch(error){
    console.log("useUser error", error);
    return {
      data: null,
      isLoading: false,
      error: error as ApiError,
      refetch: () => Promise.resolve()
    };
  }
}


/**
 * タイムラインを取得するフック！✨
 * 続きはカーソルで取得するので、新しい投稿が来ても重複やずれが出ないよ。
 * 再読み込みのときも、新しい一覧が届くまで今の一覧を表示したままにするよ。
 * @param user ログイン中のユーザーID（空なら取得しない）
 * @param actor アクターID(https://example.com/users/123)。指定するとその人の投稿だけ
 * @returns タイムラインの結果
 */
export function useTimelineManager(user: string, actor?: string) {
  const [posts, setPosts] = useState<ActivityPubNoteInClient[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [fetchMore, setFetchMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  // 古いリクエストの結果で上書きしないための番号
  const requestRef = useRef(0);

  const fetchPosts = useCallback(async (after: string | null) => {
    const requestId = ++requestRef.current;
    const isLoadMore = after !== null;
    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);
    try {
      const url = new URL("/api/posts", window.location.origin);
      url.searchParams.set("limit", "10");
      if (actor) url.searchParams.set("attributedTo", actor);
      if (after) url.searchParams.set("lastId", after);
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("投稿が読み込めなかったの…💦");
      }
      const data = await response.json();
      if (requestId !== requestRef.current) return;
      const notes: ActivityPubNoteInClient[] = data.notes ?? [];
      setPosts((prev) => {
        if (!isLoadMore) return notes;
        const seen = new Set(prev.map((post) => post.id));
        return [...prev, ...notes.filter((note) => !seen.has(note.id))];
      });
      setCursor(data.nextCursor ?? null);
      setFetchMore(!!data.nextCursor);
      setError(null);
    } catch (error) {
      if (requestId === requestRef.current) setError(error as ApiError);
    } finally {
      if (requestId === requestRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [actor]);

  // 初期化とuser/actorの変更時の処理
  useEffect(() => {
    if (!user) return;
    setPosts([]);
    setCursor(null);
    fetchPosts(null);
  }, [user, actor, fetchPosts]);

  // 投稿を削除したら一覧からも消す（PostDetailCard が postDeleted を送る）
  useEffect(() => {
    const onDeleted = (event: Event) => {
      const postId = (event as CustomEvent<{ postId?: string }>).detail?.postId;
      if (postId) setPosts((prev) => prev.filter((post) => post.id !== postId));
    };
    window.addEventListener("postDeleted", onDeleted);
    return () => window.removeEventListener("postDeleted", onDeleted);
  }, []);

  const handleLoadMore = async () => {
    if (!cursor || isLoadingMore) return;
    await fetchPosts(cursor);
  };

  const handleTimelineReload = async () => {
    await fetchPosts(null);
  };

  // isLoading は「まだ何も表示していない状態で読み込み中」のときだけ true
  return {
    posts,
    fetchMore,
    isLoading: isLoading && posts.length === 0,
    isRefreshing: isLoading && posts.length > 0,
    isLoadingMore,
    error,
    handleLoadMore,
    handleTimelineReload,
  };
}