"use client";

//import { Post } from "@/lib/appwrite/posts";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { Avatar, } from "@/components/ui/Avatar";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { getShortRelativeTime } from "@/lib/utils/date";
import { postHref } from "./PostReplies";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import { Thumbnails, compactText } from "@/components/features/post/Thumbnails";
import PostContent from "@/components/features/post/PostContent";
import { EmojiText } from "@/components/features/post/EmojiText";
interface ReplyToPostProps {
  /** 表示する投稿（取得は呼び出し側でまとめて行う） */
  note: ActivityPubNoteInClient | null;
}
/**
 * リプライ先の投稿を表示するコンポーネント！✨
 * かわいいデザインでリプライ先の投稿を表示するよ！💖
 */
export default function ReplyToPost({ note: postData }: ReplyToPostProps) {
  const images: ActivityPubImage[] = (postData?.attachment ?? []).flatMap((image: any) => {
    try { return [JSON.parse(image) as ActivityPubImage]; } catch { return []; }
  });

  // 投稿データのチェック
  if(!postData?.id){
    return <div className="flex items-center justify-center h-40">
      <p className="text-muted-foreground">投稿はもう見られないみたい🫧</p>
    </div>
  }

  // メインのレンダリング
  return (
    <div className="rounded-xl bg-muted/60 p-3 text-sm">
      <Link href={postHref(postData?.id || "")} onClick={(e) => e.stopPropagation()} className="block">
      <div className="flex items-center mb-2">
        <Avatar
          src={postData?._user?.icon?.url}
          alt={postData?._user?.preferredUsername || ""}
          fallback={postData?._user?.preferredUsername?.charAt(0) || ""}
          size="sm"
          variant="default"
          interactive={false}
        />
        <div className="flex flex-col items-start justify-start w-full gap-1 ml-2">
          <div className="flex min-w-0 w-full items-baseline gap-1.5">
            <p className="truncate font-semibold text-foreground">
              <EmojiText text={postData?._user?.displayName || postData?._user?.preferredUsername} emojis={postData?._user?.emojis} />
            </p>
            <p className="truncate text-muted-foreground">
              @{postData?._user?.preferredUsername}
            </p>
            <time dateTime={postData?.published} title={formatDate(postData?.published)} className="ml-auto shrink-0 text-muted-foreground tabular-nums">
              {getShortRelativeTime(postData?.published)}
            </time>
          </div>
        </div>
      </div>
      <PostContent content={postData ? compactText(postData) : ""} emojis={postData?.emojis} className="line-clamp-4 text-foreground/90" />
      {!postData?.summary && <Thumbnails images={images} size="h-14 w-14" />}
      </Link>
    </div>
  );
} 