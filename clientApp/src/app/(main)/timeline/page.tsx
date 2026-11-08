"use client";

import { useEffect, useState } from "react";
import { Orbit, RotateCw, Users } from "lucide-react";
import PostForm from "@/components/features/post/form/PostForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { TimelineContent, LoadMoreButton, FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { useTimelineManager, TimelineScope } from "@/hooks/api/useApi";
import { TIMELINE_REFRESH_EVENT } from "@/lib/events";

/**
 * タイムラインページ！🫧
 * 投稿フォームと、直近84時間の投稿の流れだけを置く。
 * 流れは「ローカル（このサーバーの投稿）」と「連合（フォローしている外の人も含む全部）」を切り替えられる。
 */
const SCOPE_KEY = "utakata:timeline-scope";
const SCOPES: { value: TimelineScope; label: string; icon: typeof Users }[] = [
  { value: "local", label: "ローカル", icon: Users },
  { value: "federated", label: "連合", icon: Orbit },
];

/** 前回選んだほうを覚えておく（覚えられない環境ではローカル） */
function useScope() {
  const [scope, setScope] = useState<TimelineScope>("local");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCOPE_KEY);
      if (saved === "local" || saved === "federated") setScope(saved);
    } catch {}
  }, []);
  const choose = (next: TimelineScope) => {
    setScope(next);
    try {
      localStorage.setItem(SCOPE_KEY, next);
    } catch {}
  };
  return [scope, choose] as const;
}

/** ローカル / 連合 の切り替え（アイコンだけ。名前は読み上げとツールチップで） */
function ScopeSwitch({ value, onChange }: { value: TimelineScope; onChange: (v: TimelineScope) => void }) {
  return (
    <div role="radiogroup" aria-label="タイムライン" className="flex gap-0.5 rounded-full bg-secondary p-0.5">
      {SCOPES.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(v)}
            className={`flex h-8 w-10 items-center justify-center rounded-full transition-colors ${
              active ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
export default function TimelinePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [scope, setScope] = useScope();
  const {
    posts,
    fetchMore,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    handleTimelineReload,
    handleLoadMore,
  } = useTimelineManager(
    // ログインの確認を待たずに読み始める（/api/posts が自分で確かめて、だめなら 401 を返す）
    "me",
    undefined,
    scope
  );

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

      <div className="flex items-center justify-between">
        <ScopeSwitch value={scope} onChange={setScope} />
        <button
          type="button"
          onClick={handleTimelineReload}
          disabled={isRefreshing}
          aria-label="タイムラインを更新"
          title="更新"
          className="glass-chip flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
