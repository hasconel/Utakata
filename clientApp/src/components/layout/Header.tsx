"use client";

import { Bell, Home, Search, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUnreadNotifications } from "@/lib/appwrite/serverConfig";
import { useAuth } from "@/hooks/auth/useAuth";
import { NOTIFICATIONS_READ_EVENT, TIMELINE_REFRESH_EVENT } from "@/lib/events";
import { cn } from "@/lib/utils";

/**
 * ヘッダーと、スマホ用の下部タブバー🫧
 * ナビはアイコンだけ（名前は読み上げとツールチップ用に aria-label / title で持つ）。
 * パソコンではヘッダーの右、スマホでは画面の下に同じアイコンを並べる。
 */

/** 未読通知の数。開いたとき・画面に戻ってきたとき・通知を既読にしたときに数え直す */
function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);
  const lastFetchedRef = useRef(0);

  const refresh = useCallback(() => {
    if (!enabled) return;
    // 画面を行き来するたびに問い合わせないよう、30秒はあける
    if (Date.now() - lastFetchedRef.current < 30_000) return;
    lastFetchedRef.current = Date.now();
    getUnreadNotifications().then(setCount).catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const onFocus = () => refresh();
    const onRead = () => setCount(0);
    window.addEventListener("focus", onFocus);
    window.addEventListener(NOTIFICATIONS_READ_EVENT, onRead);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, onRead);
    };
  }, [enabled, refresh]);

  return count;
}

type NavItem = { href: string; label: string; icon: typeof Home; match: (path: string) => boolean; badge?: number };

function useNavItems(): NavItem[] | null {
  const { user, isLoading } = useAuth();
  const unread = useUnreadCount(!!user);
  if (isLoading || !user) return null;
  return [
    { href: "/timeline", label: "ホーム", icon: Home, match: (p) => p === "/timeline" },
    { href: "/search", label: "検索", icon: Search, match: (p) => p.startsWith("/search") },
    { href: "/notifications", label: "通知", icon: Bell, match: (p) => p.startsWith("/notifications"), badge: unread },
    { href: `/users/${user.$id}`, label: "プロフィール", icon: User, match: (p) => p === `/@${user.name}` || p === `/users/${user.$id}` },
    { href: "/settings", label: "設定", icon: Settings, match: (p) => p.startsWith("/settings") },
  ];
}

function NavLink({ item, pathname, className }: { item: NavItem; pathname: string; className?: string }) {
  const active = item.match(pathname);
  const Icon = item.icon;
  const badge = item.badge ?? 0;
  return (
    <Link
      href={item.href}
      aria-label={badge > 0 ? `${item.label}（未読${badge}件）` : item.label}
      title={item.label}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        // タイムラインを見ているときにホームを押したら、上に戻って更新する
        if (item.href === "/timeline" && pathname === "/timeline") {
          e.preventDefault();
          window.dispatchEvent(new Event(TIMELINE_REFRESH_EVENT));
        }
      }}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        className
      )}
    >
      <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} />
      {badge > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-background tabular-nums">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const { user, isLoading } = useAuth();
  const items = useNavItems();
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={user ? "/timeline" : "/"}
          className="bg-linear-to-r from-pink-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent"
        >
          Utakata
        </Link>

        {items && (
          <nav aria-label="メイン" className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} className="h-10 w-10" />
            ))}
          </nav>
        )}

        {!isLoading && !user && (
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              ログイン
            </Link>
            <Link href="/register" className="rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
              新規登録
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

/** スマホ用の下部タブバー（ログイン中だけ） */
export function BottomNav() {
  const items = useNavItems();
  const pathname = usePathname() ?? "";
  if (!items) return null;
  return (
    <>
      {/* タブバーの下に本文が隠れないための余白 */}
      <div aria-hidden className="h-16 md:hidden" />
      <nav
        aria-label="メイン"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
          {items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} className="h-11 w-11" />
          ))}
        </div>
      </nav>
    </>
  );
}
