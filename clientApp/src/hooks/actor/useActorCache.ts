/**
 * Actorキャッシュフック！✨
 * Actor情報をキラキラにキャッシュしてパフォーマンスを向上させるよ！💖
 */

"use client";
import { useState, useCallback } from "react";
import { getActorById } from "@/lib/appwrite/database";
import { cacheActor, getCachedActor, removeCachedActor } from "@/lib/utils/cache";
import { ActivityPubActor } from "@/types/activitypub/collections";

export function useActorCache() {
  const [loadingActors, setLoadingActors] = useState<Set<string>>(new Set());

  // Actor情報を取得（キャッシュ優先）
  const getActor = useCallback(async (actorId: string): Promise<ActivityPubActor | null> => {
    // キャッシュから取得を試行
    const cachedActor = getCachedActor(actorId);
    if (cachedActor) {
      return cachedActor as ActivityPubActor;
    }

    // 既にローディング中の場合は待機
    if (loadingActors.has(actorId)) {
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!loadingActors.has(actorId)) {
            const cached = getCachedActor(actorId);
            resolve(cached as ActivityPubActor | null);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    try {
      setLoadingActors(prev => new Set(prev).add(actorId));
      
      // APIから取得
      const actor = await getActorById(actorId);
      
      if (actor) {
        // キャッシュに保存
        cacheActor(actorId, actor);
      }
      
      return actor as unknown as ActivityPubActor;
    } catch (error) {
      console.error(`Actor取得エラー (${actorId}):`, error);
      return null;
    } finally {
      setLoadingActors(prev => {
        const newSet = new Set(prev);
        newSet.delete(actorId);
        return newSet;
      });
    }
  }, [loadingActors]);

  // 複数のActor情報を一括取得
  const getActors = useCallback(async (actorIds: string[]): Promise<(ActivityPubActor | null)[]> => {
    const results: (ActivityPubActor | null)[] = [];
    const uncachedIds: string[] = [];

    // まずキャッシュから取得
    for (const actorId of actorIds) {
      const cached = getCachedActor(actorId);
      if (cached) {
        results.push(cached as ActivityPubActor);
      } else {
        results.push(null);
        uncachedIds.push(actorId);
      }
    }

    // キャッシュにないものだけ並列取得
    if (uncachedIds.length > 0) {
      const promises = uncachedIds.map(async (actorId) => {
        try {
          const actor = await getActorById(actorId);
          if (actor) {
            cacheActor(actorId, actor);
          }
          return actor;
        } catch (error) {
          console.error(`Actor一括取得エラー (${actorId}):`, error);
          return null;
        }
      });

      const fetchedActors = await Promise.all(promises);
      
      // 結果を元の配列に配置
      let fetchedIndex = 0;
      for (let i = 0; i < results.length; i++) {
        if (results[i] === null) {
          results[i] = fetchedActors[fetchedIndex] as ActivityPubActor | null;
          fetchedIndex++;
        }
      }
    }

    return results;
  }, []);

  // Actor情報をキャッシュから削除
  const removeActor = useCallback((actorId: string) => {
    removeCachedActor(actorId);
  }, []);

  // 特定のActorがローディング中かチェック
  const isLoading = useCallback((actorId: string) => {
    return loadingActors.has(actorId);
  }, [loadingActors]);

  return {
    getActor,
    getActors,
    removeActor,
    isLoading,
  };
} 