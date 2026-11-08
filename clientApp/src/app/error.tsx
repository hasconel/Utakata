"use client";

import { RotateCw } from "lucide-react";

/** 画面の表示中に問題が起きたとき。もう一度読み込むボタンだけ出す */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
      <p className="text-sm">うまく表示できなかったわ💦</p>
      <button
        type="button"
        onClick={reset}
        aria-label="もう一度読み込む"
        title="もう一度読み込む"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
      >
        <RotateCw className="h-5 w-5" />
      </button>
    </div>
  );
}
