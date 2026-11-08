"use client";
import { useEffect, useState } from "react";
import Notification, { NotificationWithData } from "@/components/features/user/Notification";
import { showToast } from "@/components/ui/Toast";
import { NOTIFICATIONS_READ_EVENT } from "@/lib/events";
import { Bell } from "lucide-react";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { FEED_SURFACE } from "@/components/features/timeline/TimelineContent";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 相手のユーザーと対象の投稿も、1回でまとめて取得する
        const res = await fetch("/api/notifications", { cache: "no-store" });
        // ログインしていなければログイン画面へ
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const { notifications } = (await res.json()) as { notifications: NotificationWithData[] };
        if (cancelled) return;
        setNotifications(notifications);
        // 未読はまとめて1回で既読にする
        const unread = notifications.filter((n) => !n.read).map((n) => n.$id);
        if (unread.length > 0) {
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: unread }),
          })
            // ヘッダーの未読バッジを消す
            .then(() => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)))
            .catch(() => {});
        }
      } catch {
        if (!cancelled) showToast("通知が読み込めなかったの…ごめんね💦");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <section className={FEED_SURFACE} aria-busy={isLoading || undefined}>
        {isLoading ? (
          <LoadingSkeleton count={5} />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Bell aria-hidden className="h-10 w-10 opacity-40" strokeWidth={1.5} />
            <p className="text-sm">通知はまだないよ🫧</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[...notifications]
              .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
              .map((notification) => (
                <Notification key={notification.$id} notification={notification} />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
