/**
 * Postキャッシュフック！✨
 * Post情報とActor情報を一緒にキラキラにキャッシュしてパフォーマンスを向上させるよ！💖
 */

"use client";
import { useState, useCallback, useRef } from "react";
import { cacheActor, getCachedActor } from "@/lib/utils/cache"; 
import { getActorById } from "@/lib/appwrite/database";

interface PostWithActor {
  post: any;
  actor: any | null;
}

export function usePostCache() {
  const [loadingPosts, setLoadingPosts] = useState<Set<string>>(new Set());
  
  // loadingPostsの参照を安定化
  const loadingPostsRef = useRef(loadingPosts);
  loadingPostsRef.current = loadingPosts;

  // Post情報とActor情報を取得（キャッシュ優先）
  const getPostWithActor = useCallback(async (postUrl: string): Promise<PostWithActor | null> => {
    try {
      setLoadingPosts(prev => new Set(prev).add(postUrl));
      //console.log("postUrl", postUrl);
      
      const postData = await fetch(postUrl, {
        method: "GET",
        headers: {
          "Accept": "application/activity+json",
        },
      }).catch((error) => {
        console.error("Post取得エラー:", error);
        return null;
      });
      if(!postData){
        return null;
      }

      const post = await postData.json();
      //console.log("post", post);
      if(post.attributedTo){
        const actor = getCachedActor(post.attributedTo);
        if(!actor){
          if(!post.attributedTo.startsWith(process.env.NEXT_PUBLIC_DOMAIN!)){
            const formattedActorId = encodeURIComponent(post.attributedTo);
            const actorData = await fetch(`/api/actor?url=${formattedActorId}`, {
              method: "GET",
              headers: {
                "Accept": "application/activity+json",
              },
            });
            const actor = await actorData.json();
            if(actor){
              cacheActor(post.attributedTo, actor);
              return { post, actor };
            }
          }
          const actor = await getActorById(post.attributedTo);
          if(actor){
            //console.log("actor", actor);
            cacheActor(post.attributedTo, actor);
            return { post, actor };
          }
        }
        if(actor){
          //console.log("actor", actor);
          return { post, actor };
        }
      }
      return null;
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
  }, []); // 依存関係を空配列に変更

  // 投稿の追加・更新・削除時の包括的なキャッシュ無効化
  const invalidatePostCache = useCallback((action: 'create' | 'update' | 'delete', postUrl?: string) => {
    //console.log(`🔄 投稿キャッシュ無効化: ${action}`, postUrl);
    
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
    return loadingPostsRef.current.has(postUrl);
  }, []); // 依存関係を空配列に変更

  return {
    getPostWithActor,
    invalidatePostCache,
    isLoading,
  };
} 