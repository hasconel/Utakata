/**
 * 投稿の読み込み中に出す、投稿の形をした影🫧
 * タイムラインの1件と同じ並び（アイコン・名前・本文・ボタン）にしてあるので、読み込み後にガタつかない。
 */
export default function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="divide-y divide-border">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3.5 animate-pulse">
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
          <div className="flex flex-1 flex-col gap-2.5 pt-1">
            <div className="h-3 w-1/3 rounded-full bg-muted" />
            <div className="h-3 w-full rounded-full bg-muted" />
            <div className="h-3 w-2/3 rounded-full bg-muted" />
            <div className="mt-1 flex gap-6">
              <div className="h-4 w-4 rounded-full bg-muted" />
              <div className="h-4 w-4 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
