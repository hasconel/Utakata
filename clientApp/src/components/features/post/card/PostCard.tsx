"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import PostForm from "../form/PostForm";
//import { Post } from "@/lib/appwrite/posts";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils/date";
import ImageModal from "../modal/ImageModal";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { getReplyPost } from "@/lib/appwrite/client";
import Link from "next/link";
import ContentsCard from "@/components/ui/ContentsCard";
import { likePost, unlikePost } from "@/lib/appwrite/serverConfig";
import PostDetailCard from "./PostDetailCard";
import { usePostCache } from "@/hooks/post/usePostCache";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { getActorDisplayPreferredUsername } from "@/lib/activitypub/utils";

// いいねボタンのコンポーネント！✨
export const LikeButton = ({ postId, initialLikes = 0 ,isPostLiked}: { postId: string; initialLikes?: number ,isPostLiked: boolean }) => {
  const [isLiked, setIsLiked] = useState(isPostLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleLike = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsLiked(!isLiked);

    try {
      if (isLiked) {
        const response = await unlikePost(postId);
        setLikeCount(prev => prev - 1);
        if (!response) throw new Error("ライク解除に失敗したわ！💦");
      } else {
        const response = await likePost(postId);
        setLikeCount(prev => prev + 1);
        if (!response) throw new Error("ライクに失敗したわ！💦");
      }
    } catch (error) {
      console.error("ライクに失敗したわ！", error);
      setIsLiked(isLiked);
    }

    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleLike();
      }}
      className={`group relative px-2.5 py-1 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
        isLiked 
          ? 'text-pink-500 dark:text-pink-400' 
          : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      <div className="flex items-center gap-1">
        <span className={`transition-all duration-300 ${isAnimating ? 'animate-bounce' : ''}`}>
          {isLiked ? '💖' : '🤍'}
        </span>
        {likeCount > 0 && (
          <span className="text-sm font-medium">
            {likeCount}
          </span>
        )}
      </div>
    </button>
  );
};

/**
 * 投稿カードコンポーネント！✨
 * 投稿の内容を表示して、リプライ機能もついてるよ！💖
 * @param post 投稿ID
 * @param setIsModalOpen モーダルを開く
 * @param isModalOpen モーダルが開いているかどうか
 * @param setModalImages モーダルの画像を設定
 * @param setModalIndex モーダルのインデックスを設定
 */
const PostCard = React.memo(({ post, setIsModalOpen, isModalOpen, setModalImages, setModalIndex}: { 
  post: string, 
  setIsModalOpen: (isOpen: boolean) => void, 
  isModalOpen: boolean, 
  setModalImages: (images: ActivityPubImage[]) => void, 
  setModalIndex: (index: number) => void 
}) => {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [, setReplyPosts] = useState<any[]>([]);
  const [relativeTime, setRelativeTime] = useState<string>("");
  const { getPostWithActor,  } = usePostCache();
  const [postData, setPostData] = useState<any>(null);
  const [isPostLoading, setIsPostLoading] = useState(true);
  const images = postData?.post?.attachment?.map((image: any) => JSON.parse(image) as ActivityPubImage) || [];

  // Post情報を取得
  useEffect(() => {
    const fetchPost = async () => {
      setIsPostLoading(true);
      try {
        const data = await getPostWithActor(post);
        setPostData(data);
      } catch (error) {
        console.error("Post取得エラー:", error);
      } finally {
        setIsPostLoading(false);
      }
    };

    fetchPost();
  }, [post, getPostWithActor]);

  useEffect(() => {
    if(postData){
      const updateRelativeTime = () => {
        const published = new Date(postData?.post?.published || "");
        setRelativeTime(getRelativeTime(published));
      };

      updateRelativeTime();
      const interval = setInterval(updateRelativeTime, 60000); // 1分ごとに更新

      return () => clearInterval(interval);
    }
    return () => {
      setRelativeTime("");
    }
  }, [postData]);

  function ReplyPosts() {
    getReplyPost(postData?.post?.inReplyTo || "").then((data) => setReplyPosts(data));
  }
  
  if(isPostLoading){
    return <LoadingSkeleton />;
  }

  return (
    <>
      {postData?.post?.id && (
        <div className="flex flex-col gap-2 w-full">
      <div 
        className="bg-gradient-to-br from-white/90 via-gray-100/80 to-gray-50/80 dark:from-gray-800/90 dark:via-gray-700/80 dark:to-gray-900/80 border border-white/80 dark:border-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden group z-0 w-full"
        onClick={() => {setIsDetailOpen(true); {postData?.post?.replyCount > 0 ? ReplyPosts() : ""}}}
      >
        {/* キラキラな背景エフェクト！✨ */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
        
        {/* 相対時間を表示するよ！✨ */}
        <div className="absolute top-3 right-3 text-sm text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {relativeTime}
        </div>

        <div className="flex flex-col gap-3 relative">
          <div className="flex items-center gap-2">
            <Avatar
              src={postData?.actor?.icon?.url}
              alt={postData?.actor?.preferredUsername}
              attributedTo={postData?.actor?.id}
              fallback={postData?.actor?.preferredUsername?.charAt(0)}
              size="md"
              variant={postData?.post?.to?.includes("https://www.w3.org/ns/activitystreams#Public") ? "outline" : "default"}
              className="ring-2 ring-purple-500/20 dark:ring-pink-500/20 group-hover:ring-purple-500/40 dark:group-hover:ring-pink-500/40 transition-all duration-300"
            />
            <div className="flex flex-col">
              <Link href={`${postData?.post?.attributedTo}`}>
              <div className="flex items-center gap-1.5 hover:scale-105 cursor-pointer transition-transform duration-200">
                <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-pink-400 transition-colors duration-200">{postData?.actor?.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">@{getActorDisplayPreferredUsername(postData?.actor)}</span> 
              </div>
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(postData?.post?.published)}</span>
            </div>
          </div>
          <div className="text-gray-800 dark:text-gray-200 text-base leading-relaxed">{postData?.post?.content}</div>
          {images.length > 0 ? (
             <div 
               onClick={(e) => {
                 e.stopPropagation();
                 e.preventDefault();
               }}
               className="relative z-50"
             >
                <ImageModal 
                  images={images} 
                  setIsModalOpen={setIsModalOpen} 
                  isModalOpen={isModalOpen}
                  ModalSwitch={true}
                  setModalImages={setModalImages}
                  setModalIndex={setModalIndex}
                />
              </div>
          ):(
              <ContentsCard arg={postData?.post?.content || ""} />
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsReplyOpen(true);
              }}
              className="text-purple-600 dark:text-pink hover:text-purple-700 dark:hover:text-pink-600 hover:scale-105 transition-all duration-200 flex items-center gap-1.5 group"
              aria-label={`@${postData?.actor?.preferredUsername} にリプライ`}
            >
              <span className="group-hover:animate-bounce">💭</span>
              {postData?.post?.replyCount > 0 && (
                <span className="text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full">
                  {postData?.post?.replyCount}
                </span>
              )}
            </button>
            <LikeButton postId={postData?.post?.id || ""} initialLikes={0} isPostLiked={false} />
          </div>
        </div>
      </div>
      </div>
      )}

      {isDetailOpen && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}>
          <PostDetailCard 
            post={post} 
            setIsDetailOpen={setIsDetailOpen} 
            setIsReplyOpen={setIsReplyOpen} 
            setIsModalOpen={setIsModalOpen} 
            isModalOpen={isModalOpen} 
            setModalImages={setModalImages} 
            setModalIndex={setModalIndex} 
          />
        </Modal>
      )}

      {isReplyOpen && (
        <Modal isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)}>
          <div className="space-y-6 m-4">
            <h2 className="text-2xl font-bold text-purple-600 dark:text-pink">
              言及する？💫
            </h2>
            <PostForm post={{activityId: post, preferredUsername: postData?.actor?.preferredUsername || "", attributedTo: postData?.actor?.id || ""}} onClose={() => setIsReplyOpen(false)} />
          </div>
        </Modal>
      )}
    </>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
