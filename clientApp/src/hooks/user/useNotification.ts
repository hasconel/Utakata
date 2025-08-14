/**
 * 通知関連のフック！✨
 * 通知をキラキラに管理するよ！💖
 */

import { useState, useEffect } from "react";
import { getUnreadNotifications } from "@/lib/appwrite/serverConfig";

export function useNotification() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const unreadNotifications = await getUnreadNotifications()
        setUnreadCount(unreadNotifications);
      } catch (err) {
        setError(err instanceof Error ? err.message : "通知の取得に失敗したよ！💦");
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return {
    unreadCount,
    isLoading,
    error,
  };
} 