"use client";

//import { Post } from "@/lib/appwrite/posts";
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
import { useState, useEffect } from "react";
import { getInternalPostWithActor } from "@/lib/appwrite/serverConfig";
import { ActivityPubNoteInClient } from "@/types/activitypub";
interface PostRepliesProps {
  post: string; //https://example.com/posts/123
  setIsLoading: (isLoading: boolean) => void;
}


/**
 * リプライ先の投稿を表示するコンポーネント！✨
 * かわいいデザインでリプライ先の投稿を表示するよ！💖
 */
export default function PostReplies({ post, setIsLoading }: PostRepliesProps) {
  const [postData, setPostData] = useState<ActivityPubNoteInClient | null>(null);
  useEffect(() => {
    const fetchPost = async () => {
      const postData = await getInternalPostWithActor(post);
      setPostData(postData);
    };
    fetchPost();
    setIsLoading(false);
  }, [post]);
  const [images, setImages] = useState<ActivityPubImage[]>([]);
  
  useEffect(() => {
    if(postData){
      console.log("PostReplies - postData loaded:", postData);
      console.log("PostReplies - userData:", postData?._user);
      setImages(postData?.attachment?.map((image:any) => JSON.parse(image) as ActivityPubImage) || []);
      setIsLoading(false);
    }
  }, [postData]);

  if(!postData?.id){
    return <div className="flex items-center justify-center h-40">
      <p className="text-gray-500 dark:text-gray-400">投稿が見つかりません</p>
    </div>
  }else{
  return (
    <Link href={`${postData?.id}`}>  
    <div className="flex flex-col pl-8 space-y-4 border-l-2 border-purple-200 dark:border-pink-900 bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-purple-50 dark:hover:bg-gray-900/50 transition-all duration-200">
      <div className="flex items-center">
        <Avatar
          src={postData?._user?.icon?.url}
          alt={postData?._user?.preferredUsername || ""}
          fallback={postData?._user?.preferredUsername?.charAt(0)}
          size="sm"
          variant="outline"
          className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"
        />
        <div className="flex flex-col items-start justify-start w-full ml-2">
        <div className="flex flex-row items-start justify-start w-full gap-1">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {postData?._user?.displayName || postData?._user?.preferredUsername}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{postData?._user?.preferredUsername}
          </p>
        </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {postData?.published ? formatDate(postData?.published) : "Unknown"}
          </div>
          </div>
          <div className="ml-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {getRelativeTime(postData?.published || "")}
            </span>  
          </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-sm">{postData?.content}</p>
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
} 
