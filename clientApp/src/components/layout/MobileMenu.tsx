"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";

import { useAuth } from "@/hooks/auth/useAuth";

export function MobileMenu() {
  const { user, logout } = useAuth();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden p-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">メニューを開く</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>メニュー</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-4">
          <Link href="/" className="text-sm font-medium">
            ホーム
          </Link>
          {user ? (
            <>
              <Link href="/notifications" className="text-sm font-medium">
                通知
              </Link>
              <Link href="/settings" className="text-sm font-medium">
                設定
              </Link>
              {/* /logout というページは無いので、ここで直接ログアウトする */}
              <button type="button" onClick={logout} className="text-left text-sm font-medium text-destructive">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium">
                ログイン
              </Link>
              <Link href="/register" className="text-sm font-medium">
                新規登録
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}