import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** 読み込み中のくるくる。文字は出さない（読み上げ用の名前だけ持つ） */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 role="status" aria-label="読み込み中" className={cn("h-6 w-6 animate-spin text-muted-foreground", className)} />;
}

/** ページ全体の読み込み中。画面の上のほうに出す（画面いっぱいにするとフッターが押し出される） */
export function PageLoading() {
  return (
    <div className="flex justify-center py-24">
      <Spinner />
    </div>
  );
}
