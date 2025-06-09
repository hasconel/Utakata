/**
 * 認証関連のフック！✨
 * ログイン状態とかをキラキラに管理するよ！💖
 */

"use client";
import { useState, useEffect } from "react";
import { Models } from "appwrite";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";

export function useAuth() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getLoggedInUser();
        setUser(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ユーザー情報の取得に失敗したよ！💦");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
} 