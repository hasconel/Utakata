"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import PostCard from "@/components/features/post/card/PostCard";
import ImageModalContent from "@/components/features/post/modal/ImageModalContent";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import { ApiError } from "@/lib/api/client";

/** 投稿リストを載せる面（タイムラインとプロフィールで共通） */
export const FEED_SURFACE = "overflow-hidden rounded-2xl border border-border bg-card shadow-soft";

/** 「もっと見る」ボタン。押す代わりに、画面の下まで来たら自動で読み込む */
const LoadMoreButton = ({ onLoadMore, isLoading = false }: { onLoadMore: () => void; isLoading?: boolean }) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // 読み込みが終わるたびに監視し直す（画面が短くて下端が見えたままでも、続けて読み込めるように）
  useEffect(() => {
    const el = sentinelRef.current;
    if (isLoading || !el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current();
      },
      // 下端に着く少し前から読み込み始める
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

  return (
    <div ref={sentinelRef} className="flex justify-center py-6">
      {/* 自動で読み込めない環境のための、押せる予備 */}
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoading}
        aria-label="続きを読み込む"
        title="続きを読み込む"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </button>
    </div>
  );
};

/** 投稿がないとき。浮かぶ泡だけを見せる */
const EmptyState = ({ isUser = false }: { isUser?: boolean }) => (
  <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
    <div aria-hidden className="relative h-16 w-16">
      <span className="absolute bottom-0 left-1 h-9 w-9 rounded-full border-2 border-current opacity-40" />
      <span className="absolute right-1 top-2 h-5 w-5 rounded-full border-2 border-current opacity-30" />
      <span className="absolute left-7 top-0 h-2.5 w-2.5 rounded-full border-2 border-current opacity-20" />
    </div>
    <p className="text-sm">{isUser ? "最近の投稿はないみたい🫧" : "まだ投稿がないわ🫧"}</p>
  </div>
);

const TimelineContent = ({
  isLoading,
  posts,
  error,
  onRetry,
  empty,
}: {
  isLoading: boolean | null;
  posts: ActivityPubNoteInClient[];
  error: ApiError | null;
  onRetry?: () => void;
  /** 投稿が0件のときに出すもの（省略すると「まだ投稿がない」） */
  empty?: React.ReactNode;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<ActivityPubImage[]>([]);
  const [modalIndex, setModalIndex] = useState(0);

  if (isLoading) return <LoadingSkeleton />;

  if (error && posts.length === 0) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-12 text-sm text-destructive">
        <p>{error.message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            aria-label="もう一度読み込む"
            title="もう一度読み込む"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCw className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }

  if (posts.length === 0) return <>{empty ?? <EmptyState />}</>;

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          <ImageModalContent
            imagesTable={modalImages}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            index={modalIndex}
          />
        </div>
      )}
      <div className="divide-y divide-border">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            setIsModalOpen={setIsModalOpen}
            isModalOpen={isModalOpen}
            setModalImages={setModalImages}
            setModalIndex={setModalIndex}
          />
        ))}
      </div>
    </>
  );
};

export { LoadMoreButton, EmptyState, TimelineContent };
