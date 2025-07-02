"use client";

//import { Post } from "@/lib/appwrite/posts";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { Avatar, } from "@/components/ui/Avatar";
import { usePost } from "@/hooks/usePost";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils/date";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
interface ReplyToPostProps {
  post: string;
}
import { getActorDisplayPreferredUsername } from "@/lib/activitypub/utils";

/**
 * リプライ先の投稿を表示するコンポーネント！✨
 * かわいいデザインでリプライ先の投稿を表示するよ！💖
 * @param post リプライ先の投稿ID (https://example.com/posts/123)
 */
export default function ReplyToPost({ post }: ReplyToPostProps) {
  const { data: postData, isLoading: isPostLoading } = usePost(post);
  const [images, setImages] = useState<ActivityPubImage[]>([]);
  useEffect(() => {
    if(postData){
      setImages(postData?.post?.attachment?.map((image:any) => JSON.parse(image) as ActivityPubImage) || []);
    }
  }, [postData]);

  //const images = postData?.attachment?.map((image) => JSON.parse(image) as ActivityPubImage) || [];
  if(isPostLoading){
    return <div className="flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  }
  if(!postData?.post?.id){
    return <div className="flex items-center justify-center h-40">
      <p className="text-gray-500 dark:text-gray-400">投稿が見つかりません</p>
    </div>
  }else{
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 dark:border dark:border-pink-900/30 rounded-xl p-4 mb-4 shadow-sm hover:shadow-md hover:from-purple-50 dark:hover:from-gray-900/50 transition-all duration-200">
      <Link href={`${postData?.post?.id}`}>
      <div className="flex items-center mb-2">
        <Avatar
          src={postData?.actor?.icon?.url}
          alt={postData?.actor?.preferredUsername || ""}
          fallback={postData?.actor?.preferredUsername?.charAt(0) || ""}
          size="sm"
          variant="default"
          className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"
        />
        <div className="flex flex-col items-start justify-start w-full gap-1 ml-2">
          <div className="flex flex-row items-start justify-start w-full mr-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {postData?.actor?.name || postData?.actor?.preferredUsername}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{getActorDisplayPreferredUsername(postData?.actor)}
            </p>
          </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(postData?.post?.published)}
            </span>
        </div>
        <div className="ml-auto">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getRelativeTime(postData?.post?.published)}
          </span>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 ">{postData?.post?.content}</p>
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
      </Link>
    </div>
  );}
} 