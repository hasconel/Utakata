"use client";

//import { Post } from "@/lib/appwrite/posts";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { Avatar, } from "@/components/ui/Avatar";
import Image from "next/image";
import Link from "next/link";
import { convertToInternalUrl, formatDate } from "@/lib/utils";
import { getShortRelativeTime } from "@/lib/utils/date";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import PostContent from "@/components/features/post/PostContent";
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
      <p className="text-gray-500 dark:text-gray-400">投稿が見つかりません</p>
    </div>
  }

  // メインのレンダリング
  return (
    <div className="rounded-xl bg-muted/60 p-3 text-sm">
      <Link href={`${postData?.id}`}>
      <div className="flex items-center mb-2">
        <Avatar
          src={postData?._user?.icon?.url}
          alt={postData?._user?.preferredUsername || ""}
          fallback={postData?._user?.preferredUsername?.charAt(0) || ""}
          size="sm"
          variant="default"
        />
        <div className="flex flex-col items-start justify-start w-full gap-1 ml-2">
          <div className="flex min-w-0 w-full items-baseline gap-1.5">
            <p className="truncate font-semibold text-foreground">
              {postData?._user?.displayName || postData?._user?.preferredUsername}
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
      <PostContent content={postData?.content} className="line-clamp-4 text-foreground/90" />
      {images.length > 0 && (
        <div className="flex justify-left grid-cols-4 gap-2">
          {images.map((image, index) => (
            index < 3 && (
              <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                <Image src={convertToInternalUrl(image.url)} alt={image.name} width={100} height={100} style={{objectFit: "cover"}}/>
              </div>
            )
          ))}
          {images.length === 4 && (
            <div className="aspect-square relative rounded-lg overflow-hidden">
              <Image src={convertToInternalUrl(images[3].url)} alt={images[3].name} width={100} height={100} style={{objectFit: "cover"}}/>
            </div>
          )}
          {images.length > 4 && (
            <div className="aspect-square relative rounded-lg overflow-hidden">
              <div className="flex items-center justify-center relative rounded-xl overflow-hidden">
                <div className="absolute bg-pink-500/50 dark:bg-pink-900/50 w-full h-full mx-auto flex items-center justify-center ">
                <p className="text-white text-xl font-bold mx-auto">+{images.length - 3}</p>
                </div>
                <Image src={convertToInternalUrl(images[3].url)} alt={images[3].name} width={100} height={100} className="rounded-xl" />
              </div>
            </div>
          )}
        </div>
      )}
      </Link>
    </div>
  );
} 