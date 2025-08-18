/**
 * 認証関連のフック！✨
 * ログイン状態とかをキラキラに管理するよ！💖
 */

"use client";
import { useState, useEffect, useCallback } from "react";
import { Models } from "appwrite";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";  

export function useAuth() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  // ユーザー情報を取得（キャッシュ優先）
  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // APIから取得
      const user = await getLoggedInUser();
      setUser(user);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "ユーザー情報の取得に失敗したよ！💦");
      setUser(null);
    } finally {
      setIsLoading(false);
    } 
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ログアウト時にキャッシュをクリア
  const logout = useCallback(() => {
    if (user) {
    }
    setUser(null);
  }, [user]);

  return {  
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
  };
} 