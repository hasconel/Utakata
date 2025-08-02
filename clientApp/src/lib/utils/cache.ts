/**
 * キャッシュユーティリティ！✨
 * アプリケーション全体で使えるキラキラなキャッシュ機能！💖
 */

// ローカルストレージベースのキャッシュ
export class LocalStorageCache {
  private prefix: string;

  constructor(prefix = 'utakata_cache') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + expiresIn,
      };
      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.warn('ローカルストレージへの保存に失敗しました:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiresAt) {
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('ローカルストレージからの取得に失敗しました:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('ローカルストレージからの削除に失敗しました:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('ローカルストレージのクリアに失敗しました:', error);
    }
  }

  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (Date.now() > parsed.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('ローカルストレージのクリーンアップに失敗しました:', error);
    }
  }
}

// メモリベースのキャッシュ
export class MemoryCache {
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    // サイズ制限をチェック
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + expiresIn,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  remove(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// デフォルトのキャッシュインスタンス
export const userCache = new LocalStorageCache('user');
export const actorCache = new LocalStorageCache('actor');
export const memoryCache = new MemoryCache();

// ユーザー情報専用のキャッシュ関数
export const cacheUser = (userId: string, userData: any) => {
  userCache.set(`user:${userId}`, userData, 10 * 60 * 1000); // 10分
  memoryCache.set(`user:${userId}`, userData, 5 * 60 * 1000); // 5分
};

export const getCachedUser = (userId: string) => {
  // メモリキャッシュを優先
  const memoryUser = memoryCache.get(`user:${userId}`);
  if (memoryUser) return memoryUser;

  // ローカルストレージから取得
  const localUser = userCache.get(`user:${userId}`);
  if (localUser) {
    // メモリキャッシュに保存
    memoryCache.set(`user:${userId}`, localUser, 5 * 60 * 1000);
    return localUser;
  }

  return null;
};

export const removeCachedUser = (userId: string) => {
  userCache.remove(`user:${userId}`);
  memoryCache.remove(`user:${userId}`);
};

// Actor情報専用のキャッシュ関数
export const cacheActor = (actorId: string, actorData: any) => {
  actorCache.set(`actor:${actorId}`, actorData, 15 * 60 * 1000); // 15分（actorは変更頻度が低い）
  memoryCache.set(`actor:${actorId}`, actorData, 10 * 60 * 1000); // 10分
};

export const getCachedActor = (actorId: string) => {
  // メモリキャッシュを優先
  const memoryActor = memoryCache.get(`actor:${actorId}`);
  if (memoryActor) return memoryActor;

  // ローカルストレージから取得
  const localActor = actorCache.get(`actor:${actorId}`);
  if (localActor) {
    // メモリキャッシュに保存
    memoryCache.set(`actor:${actorId}`, localActor, 10 * 60 * 1000);
    return localActor;
  }

  return null;
};

export const removeCachedActor = (actorId: string) => {
  actorCache.remove(`actor:${actorId}`);
  memoryCache.remove(`actor:${actorId}`);
};

// Post情報専用のキャッシュ関数（actor情報も含む）
export const cachePost = (postId: string, postData: any) => {
  const postCache = new LocalStorageCache('post');
  postCache.set(`post:${postId}`, postData, 5 * 60 * 1000); // 5分
  memoryCache.set(`post:${postId}`, postData, 3 * 60 * 1000); // 3分
};

export const getCachedPost = (postId: string) => {
  const postCache = new LocalStorageCache('post');
  
  // メモリキャッシュを優先
  const memoryPost = memoryCache.get(`post:${postId}`);
  if (memoryPost) return memoryPost;

  // ローカルストレージから取得
  const localPost = postCache.get(`post:${postId}`);
  if (localPost) {
    // メモリキャッシュに保存
    memoryCache.set(`post:${postId}`, localPost, 3 * 60 * 1000);
    return localPost;
  }

  return null;
};

export const removeCachedPost = (postId: string) => {
  const postCache = new LocalStorageCache('post');
  postCache.remove(`post:${postId}`);
  memoryCache.remove(`post:${postId}`);
};

// 定期的なクリーンアップ
if (typeof window !== 'undefined') {
  setInterval(() => {
    userCache.cleanup();
    actorCache.cleanup();
    memoryCache.cleanup();
  }, 60000); // 1分ごと
} 