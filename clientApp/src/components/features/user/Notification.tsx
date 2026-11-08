"use client";

import Link from "next/link";
import { MessageCircle, Sparkles, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import PostContent from "@/components/features/post/PostContent";
import { EmojiText } from "@/components/features/post/EmojiText";
import { compactText } from "@/components/features/post/Thumbnails";
import { postHref } from "@/components/features/post/reply/PostReplies";
import { ActivityPubActor, ActivityPubNoteInClient } from "@/types/activitypub";
import { profileHref } from "@/lib/utils";
import { formatDate, getShortRelativeTime } from "@/lib/utils/date";

/** /api/notifications が返す通知（相手のユーザーと対象の投稿つき） */
export interface NotificationWithData {
  $id: string;
  $createdAt: string;
  id: string;
  type: string;
  from: string;
  to: string;
  target?: string;
  read: boolean;
  actor: (ActivityPubActor & { name?: string; displayName?: string }) | null;
  post: ActivityPubNoteInClient | null;
}

/** 種類ごとのマーク。文で「〜がいいねしたよ」と書く代わりに、アイコンの角に付ける */
const KINDS: Record<string, { icon: typeof Sparkles; label: string; className: string }> = {
  Like: { icon: Sparkles, label: "いいね", className: "bg-primary text-primary-foreground" },
  Reply: { icon: MessageCircle, label: "リプライ", className: "bg-secondary text-accent-foreground" },
  Follow: { icon: UserPlus, label: "フォロー", className: "bg-success text-white" },
};

/**
 * 通知1件🫧
 * 相手のアイコン（右下に種類のマーク）・名前・時間、その下に対象の投稿。
 */
export default function Notification({ notification }: { notification: NotificationWithData }) {
  const actor = notification.actor;
  const name = actor?.displayName || actor?.name || actor?.preferredUsername || notification.from;
  const kind = KINDS[notification.type];
  const post = notification.post;
  const Icon = kind?.icon;
  const href = post?.id ? postHref(post.id) : profileHref(actor?.id || notification.from, actor?.preferredUsername);

  return (
    <Link
      href={href}
      className={`flex gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 ${notification.read ? "" : "bg-accent/30"}`}
    >
      <div className="relative shrink-0">
        <Avatar src={actor?.icon?.url} alt={name} fallback={name.charAt(0)} size="md" interactive={false} />
        {Icon && (
          <span
            role="img"
            aria-label={kind.label}
            title={kind.label}
            className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-card ${kind.className}`}
          >
            <Icon className="h-3 w-3" strokeWidth={2.5} />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-1.5 text-sm">
          <span className="truncate font-semibold text-foreground"><EmojiText text={name} emojis={(actor as any)?.emojis} /></span>
          {!notification.read && <span aria-label="未読" className="h-1.5 w-1.5 shrink-0 self-center rounded-full bg-primary" />}
          <time
            dateTime={notification.$createdAt}
            title={formatDate(notification.$createdAt)}
            className="ml-auto shrink-0 text-muted-foreground tabular-nums"
          >
            {getShortRelativeTime(notification.$createdAt)}
          </time>
        </div>
        {post ? (
          <PostContent
            content={compactText(post)}
            emojis={post.emojis}
            className={`line-clamp-3 text-[15px] leading-relaxed ${notification.type === "Reply" ? "text-foreground" : "text-muted-foreground"}`}
          />
        ) : (
          notification.type !== "Follow" && <p className="text-sm text-muted-foreground">投稿はもう見られないみたい🫧</p>
        )}
      </div>
    </Link>
  );
}
