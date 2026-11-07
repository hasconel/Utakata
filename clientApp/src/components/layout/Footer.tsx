"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/auth/useAuth";

const linkClass = "text-sm text-muted-foreground transition-colors hover:text-foreground";

/** ログイン前の画面だけに出す（ログイン中は下部タブバーと重なるので出さない） */
export default function Footer() {
  const { user, isLoading } = useAuth();
  if (isLoading || user) return null;
  return (
    <footer className="border-t border-border bg-background py-4 px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} utakata</p>
        <nav className="flex gap-4" aria-label="フッター">
          <Link href="/privacy" className={linkClass}>
            プライバシーポリシー
          </Link>
          <Link href="/terms" className={linkClass}>
            利用規約
          </Link>
        </nav>
      </div>
    </footer>
  );
}
