"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "../features/auth/LogoutButton";
import { Home, Bell, MessageSquare, LogIn, UserPlus, Menu } from "lucide-react";

interface MobileMenuProps {
  isLoggedIn: boolean;
}

export default function MobileMenu({ isLoggedIn }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="p-2 rounded-xl text-purple-600 dark:text-pink-500 hover:bg-purple-100 dark:hover:bg-pink-100/20 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <nav
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border-2 border-purple-100 dark:border-pink-100 p-4 space-y-2 animate-in slide-in-from-top-2 duration-200"
          aria-label="モバイルナビゲーション"
        >
          {isLoggedIn ? (
            <>
              <Link
                href="/timeline"
                className="flex items-center gap-3 py-3 px-4 text-purple-600 dark:text-pink-500 hover:bg-purple-50 dark:hover:bg-pink-50/20 rounded-xl transition-all duration-200 group"
                onClick={toggleMenu}
              >
                <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span>タイムライン</span>
              </Link>
              <Link
                href="/notifications"
                className="flex items-center gap-3 py-3 px-4 text-purple-600 dark:text-pink-500 hover:bg-purple-50 dark:hover:bg-pink-50/20 rounded-xl transition-all duration-200 group"
                onClick={toggleMenu}
              >
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span>通知</span>
              </Link>
              <Link
                href="/messages"
                className="flex items-center gap-3 py-3 px-4 text-purple-600 dark:text-pink-500 hover:bg-purple-50 dark:hover:bg-pink-50/20 rounded-xl transition-all duration-200 group"
                onClick={toggleMenu}
              >
                <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span>メッセージ</span>
              </Link>
              <div className="h-px bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 my-2" />
              <div className="px-4">
                <LogoutButton />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-3 py-3 px-4 text-purple-600 dark:text-pink-500 hover:bg-purple-50 dark:hover:bg-pink-50/20 rounded-xl transition-all duration-200 group"
                onClick={toggleMenu}
              >
                <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span>ログイン</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-3 py-3 px-4 text-purple-600 dark:text-pink-500 hover:bg-purple-50 dark:hover:bg-pink-50/20 rounded-xl transition-all duration-200 group"
                onClick={toggleMenu}
              >
                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span>新規登録</span>
              </Link>
            </>
          )}
        </nav>
      )}
    </div>
  );
}