"use client";

/**
 * 投稿詳細の下に並べるリプライ1件🫧
 * タイムラインの1件を少し小さくした形。押すとそのリプライのページへ。
 */
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Thumbnails, compactText } from "@/components/features/post/Thumbnails";
import PostContent from "@/components/features/post/PostContent";
import { EmojiText } from "@/components/features/post/EmojiText";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import { isInternalUrl } from "@/lib/utils";
import { formatDate, getShortRelativeTime } from "@/lib/utils/date";

/** 投稿を開くときのリンク先（ローカルの投稿はサイト内のページ） */
export function postHref(id: string) {
  return isInternalUrl(id) ? `/posts/${id.split("/").pop()}` : id;
}

export default function PostReplies({ note }: { note: ActivityPubNoteInClient | null }) {
  if (!note?.id) return null;
  const user = note._user;
  const images: ActivityPubImage[] = (note.attachment ?? []).flatMap((image: any) => {
    try {
      return [JSON.parse(image) as ActivityPubImage];
    } catch {
      return [];
    }
  });

  return (
    <Link href={postHref(note.id)} className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
      <Avatar
        src={user?.icon?.url}
        alt={user?.preferredUsername || ""}
        interactive={false}
        fallback={user?.preferredUsername?.charAt(0)}
        size="sm"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-1.5 text-sm">
          <span className="truncate font-semibold text-foreground"><EmojiText text={user?.displayName || user?.preferredUsername} emojis={user?.emojis} /></span>
          <span className="truncate text-muted-foreground">@{user?.preferredUsername}</span>
          <time dateTime={note.published} title={formatDate(note.published)} className="ml-auto shrink-0 text-muted-foreground tabular-nums">
            {getShortRelativeTime(note.published)}
          </time>
        </div>
        <PostContent content={compactText(note)} emojis={note.emojis} className="text-[15px] leading-relaxed text-foreground" />
        {!note.summary && <Thumbnails images={images} />}
      </div>
    </Link>
  );
}
