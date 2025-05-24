"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
import MobileMenu from "./MobileMenu";
import { Models } from "appwrite";
import { useState,useEffect } from "react";
import { getUnreadNotifications } from "@/lib/appwrite/serverConfig";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
/**
 * ヘッダーコンポーネント！✨
 * ナビゲーションとかをキラキラに表示するよ！💖
 */
export default function Header() {
  const [user,setUser] = useState<Models.User<Models.Preferences> | undefined>(undefined);
  const [notifications,setNotifications] = useState<number>(0);
  useEffect(()=>{
    getLoggedInUser().then((user)=>{
      setUser(user);
      getUnreadNotifications().then((notifications)=>{
        setNotifications(notifications.length);
      });
    }).catch((err:any)=>{
      console.log(err);
    });
  },[]);
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              utakata ✨
            </span>
          </Link>
        </div>

        {/* デスクトップメニュー */}
        <nav className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Link href="/search" className="text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-pink-500 hover:scale-105">
                検索
              </Link>
              <Link href="/timeline" className="text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-pink-500 hover:scale-105">
                タイムライン
              </Link>
              <Link href={`/users/${user.name}`} className="text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-pink-500 hover:scale-105">
                プロフィール
              </Link>
              <Link href="/notifications" className="text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-pink-500 hover:scale-105 relative">
                <Bell className="dark:text-gray-300 dark:hover:text-gray-100 rounded-md hover:scale-105 transition-all duration-200 -2" />
                {notifications > 0 && <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center">{notifications}</span>}
              </Link>
              <Link href="/settings" className="text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-pink-500 hover:scale-105">
                設定
              </Link>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
              <ThemeToggle />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-pink-500 hover:scale-105">
                ログイン
              </Link>
              <Link href="/register" className="text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-pink-500 hover:scale-105">
                新規登録
              </Link>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
              <ThemeToggle />
            </>
          )}
        </nav>

        {/* モバイルメニュー */}
        <div className="flex items-center space-x-4 md:hidden">
          <ThemeToggle />
          <MobileMenu isLoggedIn={!!user} />
        </div>
      </div>
    </header>
  );
}