"use client";

import { useState, useCallback } from "react";
import { isInternalUrl } from "@/lib/utils";
import { ActivityPubActor } from "@/types/activitypub";

export function useActor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActor = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
        // 内部ドメインの場合は直接取得
        if(isInternalUrl(url)){
          //console.log("internal",url);
          const actor : ActivityPubActor = await fetch(url,{
            method: "GET",
            headers: {
              "Accept": "application/activity+json",
            },
          }).then((res) => res.json());
          //console.log("actor",actor);
          return {actor:actor,name:actor.preferredUsername};
        }else{
          // 外部ドメインの場合はWebFingerにアクセス
          const actor = await fetch(`/api/actor?url=${encodeURIComponent(url)}`,{
            method: "GET",
            headers: {
              "Accept": "application/activity+json",
            },
          }).then((res) => res.json());
          const domain = new URL(url).hostname;
          return {actor:actor ,name:`${actor.preferredUsername}@${domain}`};
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Actorの取得に失敗したよ！💦");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getActor,
    isLoading,
    error,
  };
}