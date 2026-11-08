"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * 閲覧注意（CW）🫧
 * 説明文と 👁 だけを見せて、本文と画像は押すまでたたんでおく。
 * 説明文が無い投稿は、そのまま中身を出す。
 */
export function ContentWarning({ summary, children }: { summary?: string | null; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!summary) return <>{children}</>;
  return (
    <>
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-border bg-secondary/60 px-3 py-2">
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-1 text-[15px] leading-relaxed text-foreground">{summary}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          aria-label={open ? "たたむ" : "続きを見る"}
          title={open ? "たたむ" : "見る"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {open ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {open && children}
    </>
  );
}
