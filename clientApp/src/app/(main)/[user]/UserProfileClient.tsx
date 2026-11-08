"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogIn, Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PageLoading } from "@/components/ui/Spinner";
import FollowButton from "@/components/features/user/FollowButton";
import MuteButton from "@/components/features/user/MuteButton";
import { TimelineContent, LoadMoreButton, FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import NotFound from "@/app/not-found";
import { useAuth } from "@/hooks/auth/useAuth";
import { useActor } from "@/hooks/useActor";
import { useBackdrop } from "@/components/providers/BackdropProvider";
import { EmojiText } from "@/components/features/post/EmojiText";
import PostContent from "@/components/features/post/PostContent";
import { buildEmojis } from "@/lib/activitypub/emoji";
import { useTimelineManager } from "@/hooks/api/useApi";
import { followUser, getUserPostCount, muteUser, unfollowUser, unmuteUser } from "@/lib/appwrite/serverConfig";
import { getMutedUsers } from "@/lib/appwrite/database";
import { htmlToPlainText, isInternalUrl, mediaUrl } from "@/lib/utils";
import { POST_WINDOW_MS } from "@/lib/postWindow";
import { showToast } from "@/components/ui/Toast";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import { ApiError } from "@/lib/api/client";

const AP_HEADERS = { Accept: "application/activity+json" };

/** "@name" / "@name@host" の形のURLから、WebFinger で actor のURLを探す */
async function resolveActorId(userParam: string): Promise<string | null> {
  const handle = decodeURIComponent(userParam);
  const match = handle.match(/^@([^@\s]+)(?:@([^@\s]+))?$/);
  if (!match) return null;
  const [, name, host] = match;
  const localHost = new URL(process.env.NEXT_PUBLIC_DOMAIN!).hostname;
  const isLocal = !host || host === localHost;
  const url = isLocal
    ? new URL("/.well-known/webfinger", window.location.origin)
    : new URL("/api/webfinger", window.location.origin);
  url.searchParams.set("resource", `acct:${name}@${isLocal ? localHost : host}`);
  if (!isLocal) url.searchParams.set("domain", host!);
  const res = await fetch(url, { headers: AP_HEADERS });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.links?.find((link: any) => link.rel === "self")?.href ?? null;
}

/** 外部ユーザーの投稿を、相手のサーバーから直接読む（保存はしない）。84時間より前の投稿は出さない */
function useRemoteOutbox(actorId: string | null, enabled: boolean) {
  const [posts, setPosts] = useState<ActivityPubNoteInClient[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (page: string | null) => {
      if (!actorId) return;
      const requestId = ++requestRef.current;
      page ? setIsLoadingMore(true) : setIsLoading(true);
      try {
        const url = new URL("/api/remote-outbox", window.location.origin);
        url.searchParams.set("actor", actorId);
        if (page) url.searchParams.set("page", page);
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new ApiError(data?.error || "投稿を読めなかったわ💦");
        if (requestId !== requestRef.current) return;
        const since = Date.now() - POST_WINDOW_MS;
        const notes: ActivityPubNoteInClient[] = data.notes ?? [];
        const recent = notes.filter((note) => Date.parse(note.published) > since);
        setPosts((prev) => (page ? [...prev, ...recent] : recent));
        // 新しい順に並んでいるので、期間より古い投稿が出てきたら、その先は読まない
        setNext(recent.length < notes.length ? null : data.next ?? null);
        setError(null);
      } catch (err) {
        if (requestId === requestRef.current) setError(err as ApiError);
      } finally {
        if (requestId === requestRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [actorId]
  );

  useEffect(() => {
    if (enabled) load(null);
  }, [enabled, load]);

  return { posts, isLoading, isLoadingMore, error, hasMore: !!next, loadMore: () => next && !isLoadingMore && load(next), reload: () => load(null) };
}

/** フォロー数・フォロワー数（ローカルのユーザーだけ。コレクションの totalItems を読む） */
function useCounts(actor: any, enabled: boolean) {
  const [counts, setCounts] = useState<{ posts?: number; following?: number; followers?: number }>({});
  useEffect(() => {
    if (!enabled || !actor?.id) return;
    let cancelled = false;
    const total = (url?: string) =>
      url
        ? fetch(url, { headers: AP_HEADERS })
            .then((r) => r.json())
            .then((d) => (typeof d?.totalItems === "number" ? d.totalItems : undefined))
            .catch(() => undefined)
        : Promise.resolve(undefined);
    Promise.all([getUserPostCount(actor.id).catch(() => undefined), total(actor.following), total(actor.followers)]).then(
      ([posts, following, followers]) => !cancelled && setCounts({ posts, following, followers })
    );
    return () => {
      cancelled = true;
    };
  }, [actor?.id, enabled]);
  return counts;
}

function Count({ value, label }: { value?: number; label: string }) {
  if (value === undefined) return null;
  return (
    <span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span> {label}
    </span>
  );
}

/**
 * ユーザープロフィール🫧
 * ヘッダー画像 → アイコン・名前・操作 → 自己紹介 → 投稿 の順。
 */
export default function UserProfileClient({ userParam }: { userParam: string }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { getActor } = useActor();
  const [targetActor, setTargetActor] = useState<any | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [isFollowing, setIsFollowing] = useState<string | false>(false);
  const [isMuted, setIsMuted] = useState(false);

  const actorId: string | null = targetActor?.id ?? null;
  const isLocal = !!actorId && isInternalUrl(actorId);
  const isOwnProfile = !!user && actorId === `${process.env.NEXT_PUBLIC_DOMAIN}/users/${user.$id}`;

  // ローカルのユーザーは保存済みの投稿、外部のユーザーは相手のサーバーから読む
  // ログインしていない人にも、ローカルのユーザーの公開投稿は見せる（"guest" は読み込みの合図）
  const viewerKey = isAuthLoading ? "" : user?.$id || "guest";
  const local = useTimelineManager(isLocal ? viewerKey : "", isLocal ? actorId || "" : "");
  const remote = useRemoteOutbox(actorId, !!actorId && !isLocal && !!user);
  const counts = useCounts(targetActor, isLocal);

  // URLの @name から actor を探す
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setTargetActor(null);
    (async () => {
      try {
        const id = await resolveActorId(userParam);
        if (!id) throw new Error("not found");
        const { actor } = await getActor(id);
        if (!actor?.id) throw new Error("not found");
        if (!cancelled) {
          setTargetActor(actor);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("notfound");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userParam, getActor]);

  // フォロー中か・ミュート中か
  useEffect(() => {
    if (!actorId || !user || isOwnProfile) return;
    const url = new URL(`/users/${user.$id}/following`, window.location.origin);
    url.searchParams.set("target", actorId);
    fetch(url, { headers: AP_HEADERS })
      .then((res) => res.json())
      .then((res) => setIsFollowing(res?.id || false))
      .catch(() => {});
    getMutedUsers()
      .then((muted) => setIsMuted(muted.includes(actorId)))
      .catch(() => {});
  }, [actorId, user, isOwnProfile]);

  // 失敗したときの戻り値は { error } なので、成功したかを確かめてから表示を変える
  const handleFollow = async (id: string) => {
    const response = await followUser(id).catch(() => null);
    if (typeof response === "string") setIsFollowing(response);
    else showToast("フォローできなかったの…もう一回試してみて💦");
  };
  const handleUnfollow = async (activityId: string) => {
    const response = await unfollowUser(activityId).catch(() => null);
    if (response === true) setIsFollowing(false);
    else showToast("フォロー解除できなかったの…もう一回試してみて💦");
  };
  const handleMute = async (id: string) => {
    const response = await muteUser(id).catch(() => false);
    if (response === true) setIsMuted(true);
    else showToast("ミュートできなかったの…💦");
  };
  const handleUnmute = async (id: string) => {
    const response: any = await unmuteUser(id).catch(() => null);
    if (response && !response.error) setIsMuted(false);
    else showToast("ミュート解除できなかったの…💦");
  };

  useBackdrop(status === "ready" ? targetActor?.image?.url || null : null);

  if (status === "loading" || isAuthLoading) return <PageLoading />;
  if (status === "notfound" || !targetActor) return <NotFound />;

  const name = targetActor.name || targetActor.displayName || targetActor.preferredUsername;
  const handle = isLocal ? targetActor.preferredUsername : `${targetActor.preferredUsername}@${new URL(actorId!).hostname}`;
  const bio = htmlToPlainText(targetActor.summary);
  // 外部のユーザーは、表示名と自己紹介の絵文字が tag に入っている
  const emojis = targetActor.emojis ?? buildEmojis(targetActor.tag);
  const headerUrl = mediaUrl(targetActor.image?.url, 1280);

  const feed = isLocal
    ? {
        posts: local.posts.filter((post) => post.attributedTo === actorId),
        isLoading: local.isLoading,
        isLoadingMore: local.isLoadingMore,
        error: local.error,
        hasMore: !!local.fetchMore,
        loadMore: local.handleLoadMore,
        reload: local.handleTimelineReload,
      }
    : remote;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <section className={FEED_SURFACE}>
        {/* ヘッダー画像（無ければ、やわらかい色の帯） */}
        <div className="relative aspect-[3/1] w-full bg-linear-to-br from-accent via-secondary to-muted">
          {headerUrl && <img src={headerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        </div>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <Avatar
              src={targetActor.icon?.url}
              alt={name}
              fallback={(name || "U").charAt(0)}
              size="2xl"
              className="ring-4 ring-card"
            />
            <div className="flex items-center gap-2 pb-1">
              {isOwnProfile ? (
                <Link
                  href="/settings/profile"
                  aria-label="プロフィールを編集"
                  title="編集"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-[18px] w-[18px]" />
                </Link>
              ) : !user ? null : (
                <>
                  <MuteButton userId={actorId!} username={handle} isMuted={isMuted} onMute={handleMute} onUnmute={handleUnmute} />
                  <FollowButton userId={actorId!} isFollowing={isFollowing} onFollow={handleFollow} onUnfollow={handleUnfollow} />
                </>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-xl font-bold text-foreground">
              <EmojiText text={name} emojis={emojis} />
            </h1>
            <p className="truncate text-sm text-muted-foreground">@{handle}</p>
          </div>

          {bio && <PostContent content={bio} emojis={emojis} className="text-[15px] leading-relaxed text-foreground" />}

          {isLocal && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <Count value={counts.posts} label="投稿" />
              <Count value={counts.following} label="フォロー" />
              <Count value={counts.followers} label="フォロワー" />
            </div>
          )}
        </div>
      </section>

      <section className={FEED_SURFACE}>
        {!user && !isLocal ? (
          <GuestNotice />
        ) : (
          <TimelineContent isLoading={feed.isLoading} posts={feed.posts} error={feed.error} onRetry={feed.reload} empty={<EmptyFeed />} />
        )}
      </section>
      {feed.hasMore && !feed.isLoading && feed.posts.length > 0 && (
        <LoadMoreButton onLoadMore={feed.loadMore} isLoading={feed.isLoadingMore} />
      )}
    </div>
  );
}

/** ログインしていない人が、外のサーバーの人のページを開いたとき（相手のサーバーへ取りに行くのはログイン中だけ） */
function GuestNotice() {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
      <LogIn aria-hidden className="h-9 w-9 opacity-40" strokeWidth={1.5} />
      <Link href="/login" className="text-sm text-primary hover:underline">
        ログインすると投稿が見られるよ🫧
      </Link>
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
      <div aria-hidden className="relative h-12 w-12">
        <span className="absolute bottom-0 left-0 h-7 w-7 rounded-full border-2 border-current opacity-40" />
        <span className="absolute right-0 top-1 h-4 w-4 rounded-full border-2 border-current opacity-30" />
      </div>
      <p className="text-sm">最近の投稿はないみたい🫧</p>
    </div>
  );
}
