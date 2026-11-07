"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { TimelineContent, LoadMoreButton, FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import { ApiError } from "@/lib/api/client";

type SearchState = {
  query: string;
  notes: ActivityPubNoteInClient[];
  nextOffset: number | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: ApiError | null;
};

const initialState = (query: string): SearchState => ({
  query,
  notes: [],
  nextOffset: null,
  isLoading: !!query,
  isLoadingMore: false,
  error: null,
});

/**
 * 検索ページ🫧
 * 直近84時間のローカルの投稿を、新しい順に探す。
 */
export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const initialQuery = (use(searchParams).q ?? "").trim();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [input, setInput] = useState(initialQuery);
  const [state, setState] = useState<SearchState>(() => initialState(initialQuery));
  const requestRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user && !isAuthLoading) window.location.href = "/login";
  }, [user, isAuthLoading]);

  const runSearch = useCallback(async (query: string, offset: number) => {
    const requestId = ++requestRef.current;
    const isMore = offset > 0;
    setState((prev) =>
      isMore ? { ...prev, isLoadingMore: true } : { ...initialState(query), isLoading: !!query }
    );
    if (!query) return;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&offset=${offset}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new ApiError(data?.error || "検索できなかったわ！💦");
      if (requestId !== requestRef.current) return;
      setState((prev) => {
        const seen = new Set(isMore ? prev.notes.map((n) => n.id) : []);
        const notes = data.notes.filter((n: ActivityPubNoteInClient) => !seen.has(n.id));
        return {
          ...prev,
          notes: isMore ? [...prev.notes, ...notes] : notes,
          nextOffset: data.nextOffset ?? null,
          isLoading: false,
          isLoadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      if (requestId !== requestRef.current) return;
      setState((prev) => ({ ...prev, isLoading: false, isLoadingMore: false, error: error as ApiError }));
    }
  }, []);

  // 開いたときに、URLの言葉で検索する
  useEffect(() => {
    if (user) runSearch(initialQuery, 0);
    else if (!initialQuery) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.$id]);

  const submit = (query: string) => {
    const q = query.trim();
    // ページを読み込み直さずに、URLだけ書き換える（戻るボタンで前の検索に戻れる）
    router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search", { scroll: false });
    runSearch(q, 0);
  };

  const searched = !!state.query;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
          inputRef.current?.blur();
        }}
        className="relative"
      >
        <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={200}
          aria-label="投稿を検索"
          className="h-12 w-full rounded-full border border-input bg-card pl-12 pr-12 text-[15px] text-foreground shadow-soft placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
        />
        {input && (
          <button
            type="button"
            onClick={() => {
              setInput("");
              submit("");
              inputRef.current?.focus();
            }}
            aria-label="検索語を消す"
            title="消す"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {state.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </button>
        )}
      </form>

      {searched && (
        <section className={FEED_SURFACE} aria-live="polite" aria-busy={state.isLoading || undefined}>
          <TimelineContent
            isLoading={state.isLoading}
            posts={state.notes}
            error={state.error}
            onRetry={() => runSearch(state.query, 0)}
            empty={<NoResults />}
          />
        </section>
      )}

      {searched && state.nextOffset !== null && !state.isLoading && (
        <LoadMoreButton
          onLoadMore={() => !state.isLoadingMore && runSearch(state.query, state.nextOffset!)}
          isLoading={state.isLoadingMore}
        />
      )}
    </div>
  );
}

/** 見つからなかったとき。虫めがねと短い一言だけ */
function NoResults() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <Search aria-hidden className="h-10 w-10 opacity-40" strokeWidth={1.5} />
      <p className="text-sm">見つからなかったわ🫧</p>
    </div>
  );
}
