"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, VolumeX } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/ui/PageHeader";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { getMutedUsers } from "@/lib/appwrite/database";
import { fetchActors } from "@/lib/api/actors";
import { EmojiText } from "@/components/features/post/EmojiText";
import { unmuteUser } from "@/lib/appwrite/serverConfig";
import { actorHandle, profileHref } from "@/lib/utils";

interface MutedUser {
  actorId: string;
  preferredUsername: string;
  displayName?: string;
  avatarUrl?: string;
  emojis?: string[];
}

/** ミュートしている人の一覧🫧 右のアイコンで解除 */
export default function MutesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<MutedUser[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !isAuthLoading) window.location.href = "/login";
  }, [user, isAuthLoading]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // 外のサーバーの人もまとめて読む（以前はこのサーバーの人しか出ていなかった）
        const ids = await getMutedUsers();
        const actors = await fetchActors(ids);
        setUsers(
          actors.map((a) => ({
            actorId: a.id,
            preferredUsername: a.preferredUsername,
            displayName: a.displayName || a.name,
            avatarUrl: a.icon?.url,
            emojis: a.emojis,
          }))
        );
      } catch {
        setUsers([]);
        showToast("ミュートの一覧を読めなかったわ💦");
      }
    })();
  }, [user]);

  const handleUnmute = async (actorId: string) => {
    setPending(actorId);
    const response: any = await unmuteUser(actorId).catch(() => null);
    setPending(null);
    if (response && !response.error) setUsers((prev) => prev?.filter((u) => u.actorId !== actorId) ?? null);
    else showToast("ミュート解除できなかったの…💦");
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <PageHeader backHref="/settings" title="ミュート" />
      <section className={FEED_SURFACE}>
        {users === null ? (
          <LoadingSkeleton count={3} />
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
            <VolumeX aria-hidden className="h-9 w-9 opacity-40" strokeWidth={1.5} />
            <p className="text-sm">ミュートしている人はいないよ🫧</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li key={u.actorId} className="flex items-center gap-3 px-4 py-3">
                <Link href={profileHref(u.actorId, u.preferredUsername)} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar src={u.avatarUrl} alt={u.preferredUsername} fallback={u.preferredUsername?.charAt(0)} size="md" interactive={false} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-foreground">
                      <EmojiText text={u.displayName || u.preferredUsername} emojis={u.emojis} />
                    </span>
                    <span className="truncate text-sm text-muted-foreground">@{actorHandle(u.actorId, u.preferredUsername)}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnmute(u.actorId)}
                  disabled={pending === u.actorId}
                  aria-label={`@${u.preferredUsername} のミュートを解除`}
                  title="ミュート解除"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                >
                  {pending === u.actorId ? <Loader2 className="h-5 w-5 animate-spin" /> : <VolumeX className="h-5 w-5" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
