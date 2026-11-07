"use client";

import { Bell, Search, Settings, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";
import { useEffect, useState } from "react";
import { getUnreadNotifications } from "@/lib/appwrite/serverConfig";
import { useAuth } from "@/hooks/auth/useAuth";
//import NotificationPermission from "@/components/NotificationPermission";
//import ThemeToggle from "@/components/ui/ThemeToggle";

/**
 * ヘッダーコンポーネント！✨
 * ナビゲーションとかをキラキラに表示するよ！💖
 */
export function Header() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user && !isAuthLoading) {
      // 未読通知の数を取得
      getUnreadNotifications().then(setUnreadCount).catch(() => {});
    }
  }, [user, isAuthLoading]);
  
  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-center border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex">
          {/* ページ全体を読み込み直さないように Link を使う。未ログインで / を開くとトップ、ログイン済みならタイムライン */}
          <Link href={user ? "/timeline" : "/"} className="mr-6 flex items-center space-x-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            <span className="font-bold">Utakata✨</span>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          {/* デスクトップ用のナビゲーション！✨ */}
          <nav className="hidden md:flex items-center space-x-2">
            {user && !isAuthLoading && (
              <>
                {/* 通知許可要求 */}
                {/*<NotificationPermission />*/}
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="ghost" size="sm">
                    <Search className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href={`/users/${user.$id}`}>
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </>
            )}
            {!user && !isAuthLoading && (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    ログイン
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="gradient" size="sm">
                    新規登録
                  </Button>
                </Link>
              </>
            )}
          </nav>
          {/* モバイル用のメニュー！✨ */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
          {/*<ThemeToggle />*/}
        </div>
      </div>
    </header>
  );
}