/**
 * 通知関連のフック！✨
 * 通知をキラキラに管理するよ！💖
 */

import { useState, useEffect } from "react";
import { getUnreadNotifications } from "@/lib/appwrite/serverConfig";

export function useNotification() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const unreadNotifications = await getUnreadNotifications();
        setNotifications(unreadNotifications);
      } catch (err) {
        setError(err instanceof Error ? err.message : "通知の取得に失敗したよ！💦");
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return {
    notifications,
    isLoading,
    error,
    unreadCount: notifications.length,
  };
} 