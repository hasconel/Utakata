/**
 * 認証関連のフック！✨
 * ログイン状態とかをキラキラに管理するよ！💖
 */

"use client";
import { useState, useEffect, useCallback } from "react";
import { Models } from "appwrite";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
import { cacheUser, getCachedUser, removeCachedUser } from "@/lib/utils/cache";

export function useAuth() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // キャッシュからユーザー情報を取得
  const getCachedUserData = useCallback((userId: string): Models.User<Models.Preferences> | null => {
    const cached = getCachedUser(userId);
    return cached as Models.User<Models.Preferences> | null;
  }, []);

  // ユーザー情報をキャッシュに保存
  const setCachedUserData = useCallback((user: Models.User<Models.Preferences> | null) => {
    if (user) {
      cacheUser(user.$id, user);
    }
  }, []);

  // キャッシュをクリア
  const clearCache = useCallback((userId?: string) => {
    if (userId) {
      removeCachedUser(userId);
    } else {
      // 全ユーザーのキャッシュをクリア
      if (user) {
        removeCachedUser(user.$id);
      }
    }
  }, [user]);

  // ユーザー情報を取得（キャッシュ優先）
  const fetchUser = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      if (forceRefresh) {
        clearCache();
      }
      // APIから取得
      const user = await getLoggedInUser();
      setUser(user);
      
      // ユーザー情報をキャッシュに保存
      if (user) {
        setCachedUserData(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ユーザー情報の取得に失敗したよ！💦");
      setUser(null);
    } finally {
      setIsLoading(false);
    } 
  }, [setCachedUserData]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ログアウト時にキャッシュをクリア
  const logout = useCallback(() => {
    if (user) {
      clearCache(user.$id);
    }
    setUser(null);
  }, [user, clearCache]);

  // ユーザー情報を強制更新
  const refreshUser = useCallback(() => {
    fetchUser(true);
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
    refreshUser,
    clearCache,
    getCachedUser: getCachedUserData,
  };
} 