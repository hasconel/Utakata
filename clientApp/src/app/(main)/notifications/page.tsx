"use client";
import { getUserNotifications, readNotification } from "@/lib/appwrite/serverConfig";
import { useEffect, useState } from "react";
import { Notification as NotificationType } from "@/lib/appwrite/posts";
import Notification from "@/components/features/user/Notification";
import { Models } from "appwrite";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
  useEffect(() => {
    getUserNotifications().then(notifications => {
      setNotifications(notifications.map((notification:any)=>({
        ...notification,
        read: notification.read,
        type: notification.type,
        from: notification.from,
        to: notification.to,
        target: notification.target,
        message: notification.message,
        $id: notification.$id,
        $createdAt: notification.$createdAt,
        $updatedAt: notification.$updatedAt,
      })));
      for(const notification of notifications){
        if(!notification.read){
          readNotification(notification.$id);
        }
      }
    });
  }, []);
  return (
    <div className="m-5 justify-center items-center mx-auto max-w-2xl">
      <div className="flex flex-col gap-4">
        {notifications.sort((a,b)=>new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()).map((notification) => (
          <Notification key={notification.$id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
