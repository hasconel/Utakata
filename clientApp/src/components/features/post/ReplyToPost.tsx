"use client";

import { Post } from "@/lib/appwrite/posts";
import ImageModal from "./ImageModal";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { Avatar, } from "@/components/ui/Avatar";

interface ReplyToPostProps {
  post: Post;
}

/**
 * リプライ先の投稿を表示するコンポーネント！✨
 * かわいいデザインでリプライ先の投稿を表示するよ！💖
 */
export default function ReplyToPost({ post }: ReplyToPostProps) {
  const images = post.attachment?.map((image) => JSON.parse(image) as ActivityPubImage) || [];
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 dark:border dark:border-pink-900/30 rounded-xl p-4 mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center mb-2">
        <Avatar
          src={post?.avatar}
          alt={post?.username}
          fallback={post?.username?.charAt(0)}
          size="sm"
          variant="outline"
          className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"
        />
        <div className="ml-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            @{post.username}
          </p>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-sm">{post.content}</p>
      {images.length > 0 && (
        <ImageModal images={images} />
      )}
    </div>
  );
} 