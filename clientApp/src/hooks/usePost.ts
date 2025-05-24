"use client";

import { useState, useCallback } from "react";
import { createPost } from "@/lib/activitypub/post";
import { PostInput } from "@/types/common/post";

/**
 * 投稿関連のフック！✨
 * 投稿の作成とかをキラキラに処理するよ！💖
 */
export function usePost() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 投稿を作成する関数！✨
   * @param input 投稿の入力値
   * @returns 投稿の結果
   */
  const create = useCallback(async (input: PostInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createPost(input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗したわ！💦");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    create,
    isLoading,
    error,
  };
} 