"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * 画面の見出し。左に戻るボタン（< だけ）、続けて短い名前、右に操作を置ける。
 * 背景画像があるときは、戻る＋名前の部分にだけ小さなすりガラスを敷く。
 */
export function PageHeader({ title, backHref, action }: { title?: string; backHref?: string; action?: React.ReactNode }) {
  return (
    <div className="flex h-11 items-center gap-1">
      <div className="glass-chip -ml-2 flex min-w-0 items-center gap-1 rounded-full pr-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="戻る"
            title="戻る"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        {title && <h1 className={`truncate text-lg font-semibold text-foreground ${backHref ? "" : "pl-3"}`}>{title}</h1>}
      </div>
      {action && <div className="ml-auto flex items-center gap-1">{action}</div>}
    </div>
  );
}
