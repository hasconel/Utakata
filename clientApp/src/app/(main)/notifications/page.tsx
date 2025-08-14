"use client";
import { getUserNotifications, readNotification } from "@/lib/appwrite/serverConfig";
import { useEffect, useState } from "react";
import { Notification as NotificationType } from "@/lib/appwrite/posts";
import Notification from "@/components/features/user/Notification";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserNotifications().then(notifications => {
      console.log(notifications);
      setNotifications(notifications.map((notification:any)=>({
        ...notification,
        read: notification.read,
        type: notification.type,
        from: notification.from,
        to: notification.to,
        target: notification.target,
        id: notification.id,
        $id: notification.$id,
        $createdAt: notification.$createdAt,
        $updatedAt: notification.$updatedAt,
      })));
      for(const notification of notifications){
        if(!notification.read){
          readNotification(notification.$id);
        }
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-2 py-4">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 md:p-6 mb-8 border border-purple-100 dark:border-purple-900">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
          通知 ✨
        </h1>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4 animate-bounce">💫</div>
            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
              通知はまだないよ！✨
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              みんなと交流してみよう！💖
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications
              .sort((a,b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
              .map((notification) => (
                <Notification key={notification.$id} notification={notification} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
