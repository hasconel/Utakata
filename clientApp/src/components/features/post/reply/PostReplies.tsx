"use client";

import { Post } from "@/lib/appwrite/posts";
/**
 * リプライを表示するコンポーネント！✨
 * 投稿についたリプライをキラキラに表示するよ！💖
 */

import { ActivityPubImage } from "@/types/activitypub/collections";
import { Avatar } from "@/components/ui/Avatar";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils/date";

interface PostRepliesProps {
  post: Post;
}

/**
 * リプライ先の投稿を表示するコンポーネント！✨
 * かわいいデザインでリプライ先の投稿を表示するよ！💖
 */
export default function PostReplies({ post }: PostRepliesProps) {
  const images = post.attachment?.map((image) => JSON.parse(image) as ActivityPubImage) || [];
  return (
    <Link href={`/posts/${post.$id}`}>  
    <div className="flex flex-col pl-8 space-y-4 border-l-2 border-purple-200 dark:border-pink-900 bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-purple-50 dark:hover:bg-gray-900/50 transition-all duration-200">
      <div className="flex items-center">
        <Avatar
          src={post?.avatar}
          alt={post?.username}
          fallback={post?.username?.charAt(0)}
          size="sm"
          variant="outline"
          className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"
        />
        <div className="flex flex-col items-start justify-start w-full ml-2">
        <div className="flex flex-row items-start justify-start w-full gap-1">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {post.username}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{post.attributedTo?.split("/").pop()}
          </p>
        </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(post.$createdAt)}
          </div>
          </div>
          <div className="ml-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {getRelativeTime(post.$createdAt)}
            </span>  
          </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-sm">{post.content}</p>
      {images.length > 0 && (
        <div className="flex justify-left grid-cols-4 gap-2">
          {images.map((image, index) => (
            index < 3 && (
              <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                <Image src={image.url} alt={image.name} width={100} height={100} style={{objectFit: "cover"}}/>
              </div>
            )
          ))}
          {images.length === 4 && (
            <div className="aspect-square relative rounded-lg overflow-hidden">
              <Image src={images[3].url} alt={images[3].name} width={100} height={100} style={{objectFit: "cover"}}/>
            </div>
          )}
          {images.length > 4 && (
            <div className="aspect-square relative rounded-lg overflow-hidden">
              <div className="flex items-center justify-center relative rounded-xl overflow-hidden">
                <div className="absolute bg-pink-500/50 dark:bg-pink-900/50 w-full h-full mx-auto flex items-center justify-center ">
                <p className="text-white text-xl font-bold mx-auto">+{images.length - 3}</p>
                </div>
                <Image src={images[3].url} alt={images[3].name} width={100} height={100} className="rounded-xl" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </Link>
  );
} 
