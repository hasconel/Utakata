"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNotification } from "@/hooks/user/useNotification";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
/**
 * ヘッダーコンポーネント！✨
 * ナビゲーションとかをキラキラに表示するよ！💖
 */
export function Header() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { unreadCount } = useNotification();
  const [ topAnchor, setTopAnchor ] = useState("/");
  useEffect(() => {
    if (user) {
      setTopAnchor("/timeline");
    } 
  }, [user]);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex">
          <a href={topAnchor} className="mr-6 flex items-center space-x-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            <span className="font-bold">Utakata✨</span>
          </a>
        </div>
        <div className="flex items-center space-x-2">
          {/* デスクトップ用のナビゲーション！✨ */}
          <nav className="hidden md:flex items-center space-x-2">
            {user && (
              <>
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
                    検索
                  </Button>
                </Link>
                <Link href={`/users/${user.name}`}>
                  <Button variant="ghost" size="sm">
                    プロフィール
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    設定
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
                <Link href="/signup">
                  <Button variant="gradient" size="sm">
                    新規登録
                  </Button>
                </Link>
              </>
            )}
          </nav>
          {/* モバイル用のメニュー！✨ */}
          <div className="md:hidden">
            <MobileMenu user={user} />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}