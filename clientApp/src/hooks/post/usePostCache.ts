/**
 * Postキャッシュフック！✨
 * Post情報とActor情報を一緒にキラキラにキャッシュしてパフォーマンスを向上させるよ！💖
 */

"use client";
import { useState, useCallback } from "react";
import { cachePost, getCachedPost, removeCachedPost } from "@/lib/utils/cache";
import { cacheActor, getCachedActor } from "@/lib/utils/cache";
import { getActorById } from "@/lib/appwrite/database";
import { ActivityPubActor } from "@/types/activitypub/collections";

interface PostWithActor {
  post: any;
  actor: ActivityPubActor | null;
}

export function usePostCache() {
  const [loadingPosts, setLoadingPosts] = useState<Set<string>>(new Set());

  // Post情報とActor情報を取得（キャッシュ優先）
  const getPostWithActor = useCallback(async (postUrl: string): Promise<PostWithActor | null> => {
    // キャッシュから取得を試行
    const cachedPostData = getCachedPost(postUrl);
    if (cachedPostData) {
      return cachedPostData as PostWithActor;
    }

    // 既にローディング中の場合は待機
    if (loadingPosts.has(postUrl)) {
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!loadingPosts.has(postUrl)) {
            const cached = getCachedPost(postUrl);
            resolve(cached as PostWithActor | null);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    try {
      setLoadingPosts(prev => new Set(prev).add(postUrl));
      
      // Post情報を取得
      const response = await fetch(postUrl, {
        method: "GET",
        headers: {
          "Accept": "application/activity+json",
        },
      });

      if (!response.ok) {
        // 404の場合はnullを返す
        
        return null;
      }
      const post = await response.json();
      // Actor情報を取得（キャッシュ優先）
      let actor: ActivityPubActor | null = null;
      if (post.attributedTo) {
        // まずキャッシュから取得
        const cachedActor = getCachedActor(post.attributedTo);
        if (cachedActor) {
          actor = cachedActor as ActivityPubActor;
        } else {
          // APIから取得
          actor = await getActorById(post.attributedTo) as unknown as ActivityPubActor;
          if (actor) {
            cacheActor(post.attributedTo, actor);
          }
        }
      }

      const postData: PostWithActor = { post, actor };
      
      // キャッシュに保存
      cachePost(postUrl, postData);
      
      return postData;
    } catch (error) {
      console.error(`Post取得エラー (${postUrl}):`, error);
      return null;
    } finally {
      setLoadingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postUrl);
        return newSet;
      });
    }
  }, [loadingPosts]);

  // 複数のPost情報を一括取得
  const getPostsWithActors = useCallback(async (postUrls: string[]): Promise<(PostWithActor | null)[]> => {
    const results: (PostWithActor | null)[] = [];
    const uncachedUrls: string[] = [];

    // まずキャッシュから取得
    for (const postUrl of postUrls) {
      const cached = getCachedPost(postUrl);
      if (cached) {
        results.push(cached as PostWithActor);
      } else {
        results.push(null);
        uncachedUrls.push(postUrl);
      }
    }

    // キャッシュにないものだけ並列取得
    if (uncachedUrls.length > 0) {
      const promises = uncachedUrls.map(async (postUrl) => {
        try {
          const response = await fetch(postUrl, {
            method: "GET",
            headers: {
              "Accept": "application/activity+json",
            },
          });

          if (!response.ok) {
            return null;
          }

          const post = await response.json();
          
          // Actor情報を取得（キャッシュ優先）
          let actor: ActivityPubActor | null = null;
          if (post.attributedTo) {
            const cachedActor = getCachedActor(post.attributedTo);
            if (cachedActor) {
              actor = cachedActor as ActivityPubActor;
            } else {
              actor = await getActorById(post.attributedTo) as unknown as ActivityPubActor;
              if (actor) {
                cacheActor(post.attributedTo, actor);
              }
            }
          }

          const postData: PostWithActor = { post, actor };
          cachePost(postUrl, postData);
          
          return postData;
        } catch (error) {
          console.error(`Post一括取得エラー (${postUrl}):`, error);
          return null;
        }
      });

      const fetchedPosts = await Promise.all(promises);
      
      // 結果を元の配列に配置
      let fetchedIndex = 0;
      for (let i = 0; i < results.length; i++) {
        if (results[i] === null) {
          results[i] = fetchedPosts[fetchedIndex] as unknown as PostWithActor ;
          fetchedIndex++;
        }
      }
    }

    return results;
  }, []);

  // Post情報をキャッシュから削除
  const removePost = useCallback((postUrl: string) => {
    removeCachedPost(postUrl);
  }, []);

  // 投稿の追加・更新・削除時の包括的なキャッシュ無効化
  const invalidatePostCache = useCallback((action: 'create' | 'update' | 'delete', postUrl?: string) => {
    //console.log(`🔄 投稿キャッシュ無効化: ${action}`, postUrl);
    
    if (action === 'delete' && postUrl) {
      // 削除時は特定の投稿のみ無効化
      removeCachedPost(postUrl);
    } else {
      // 作成・更新時は関連するキャッシュを包括的に無効化
      
      // 1. 投稿一覧のキャッシュを無効化
      const timelineCacheKeys = [
        '/api/posts',
        '/timeline',
        '/[user]',
        '/search'
      ];
      
      timelineCacheKeys.forEach(key => {
        // ローカルストレージのキャッシュをクリア
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage);
          keys.forEach(storageKey => {
            if (storageKey.includes(key) || storageKey.includes('posts')) {
              localStorage.removeItem(storageKey);
              //console.log(`🗑️ キャッシュ削除: ${storageKey}`);
            }
          });
        }
      });
      
      // 2. 関連する投稿のキャッシュも無効化
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(storageKey => {
          if (storageKey.includes('post') || storageKey.includes('actor')) {
            localStorage.removeItem(storageKey);
            //console.log(`🗑️ 関連キャッシュ削除: ${storageKey}`);
          }
        });
      }
      
      // 3. メモリキャッシュもクリア
      if (typeof window !== 'undefined' && (window as any).__POST_CACHE__) {
        (window as any).__POST_CACHE__ = {};
        //console.log('🧠 メモリキャッシュクリア完了');
      }
    }
    
    // 4. 強制的な再レンダリングをトリガー
    if (typeof window !== 'undefined') {
      // カスタムイベントを発火して、関連コンポーネントにキャッシュ無効化を通知
      window.dispatchEvent(new CustomEvent('postCacheInvalidated', {
        detail: { action, postUrl }
      }));
      //console.log('📡 キャッシュ無効化イベント発火');
    }
  }, []);

  // 特定のPostがローディング中かチェック
  const isLoading = useCallback((postUrl: string) => {
    return loadingPosts.has(postUrl);
  }, [loadingPosts]);

  return {
    getPostWithActor,
    getPostsWithActors,
    removePost,
    invalidatePostCache, // 新しい関数を追加
    isLoading,
  };
} 