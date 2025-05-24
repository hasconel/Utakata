"use client";

import { Post } from "@/lib/appwrite/posts";
/**
 * リプライを表示するコンポーネント！✨
 * 投稿についたリプライをキラキラに表示するよ！💖
 */
import ImageModal from "./ImageModal";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { Avatar } from "@/components/ui/Avatar";

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
    <div className="pl-8 space-y-4 border-l-2 border-purple-200 dark:border-pink-900">
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
