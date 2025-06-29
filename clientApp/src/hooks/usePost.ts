"use client";

import { useState, useCallback, useEffect } from "react";
//import { isInternalUrl } from "@/lib/utils";
import { fetchReplyToPost } from "@/lib/appwrite/client";
import { Post } from "@/lib/appwrite/posts";

/**
 * 投稿関連のフック！✨
 * 投稿IDから投稿を取得する関数を提供するよ！💖
 */
export function usePost(postId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Post | null>(null);
  /**
   * 投稿を作成する関数！✨
   * @param input 投稿の入力値
   * @returns 投稿の結果
   */
  const getPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchReplyToPost(postId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に読み込みに失敗したわ！💦");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [postId]);
  useEffect(() => {
    getPost();
  }, [postId]);

  return {
    data,
    isLoading,
    error,
  };
} 