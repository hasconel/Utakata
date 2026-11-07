"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import PostForm from "@/components/features/post/form/PostForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { TimelineContent, LoadMoreButton, FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { useTimelineManager } from "@/hooks/api/useApi";
import { TIMELINE_REFRESH_EVENT } from "@/lib/events";

/**
 * タイムラインページ！🫧
 * 投稿フォームと、直近84時間の投稿の流れだけを置く。
 */
export default function TimelinePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    posts,
    fetchMore,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    handleTimelineReload,
    handleLoadMore,
  } = useTimelineManager(user?.$id || "");

  useEffect(() => {
    if (!user && !isAuthLoading) window.location.href = "/login";
  }, [user, isAuthLoading]);

  useEffect(() => {
    const onRefresh = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      handleTimelineReload();
    };
    window.addEventListener(TIMELINE_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(TIMELINE_REFRESH_EVENT, onRefresh);
  }, [handleTimelineReload]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <section className={`${FEED_SURFACE} p-3`}>
        <PostForm refreshTimeline={handleTimelineReload} />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleTimelineReload}
          disabled={isRefreshing}
          aria-label="タイムラインを更新"
          title="更新"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <section className={`${FEED_SURFACE} relative`} aria-busy={isRefreshing || undefined}>
        {/* 更新中は上端に細い帯を流す */}
        {isRefreshing && (
          <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
            <div className="h-full w-1/3 animate-[marquee_1.2s_linear_infinite] bg-primary" />
          </div>
        )}
        <TimelineContent isLoading={isLoading} posts={posts} error={error} onRetry={handleTimelineReload} />
      </section>

      {fetchMore && !isLoading && posts.length > 0 && (
        <LoadMoreButton onLoadMore={handleLoadMore} isLoading={isLoadingMore} />
      )}
    </div>
  );
}
