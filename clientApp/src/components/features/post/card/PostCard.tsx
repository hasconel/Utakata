"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import PostForm from "../form/PostForm";
import { Post } from "@/lib/appwrite/posts";
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
 */
export default function PostCard({ post, setIsModalOpen, isModalOpen ,setModalImages, setModalIndex}: { post: Post, setIsModalOpen: (isOpen: boolean) => void, isModalOpen: boolean, setModalImages: (images: ActivityPubImage[]) => void, setModalIndex: (index: number) => void }) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [, setReplyPosts] = useState<Post[]>([]);
  const [relativeTime, setRelativeTime] = useState<string>("");
  const images = post.attachment?.map((image) => JSON.parse(image) as ActivityPubImage) || [];
  // 相対時間を更新するよ！⏰
  useEffect(() => {
    const updateRelativeTime = () => {
      setRelativeTime(getRelativeTime(post.published));
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60000); // 1分ごとに更新

    return () => clearInterval(interval);
  }, [post.published]);

  function ReplyPosts() {
    getReplyPost(post.$id).then((data) => setReplyPosts(data));
  }

  return (
    <>
      <div 
        className="bg-gradient-to-br from-white/90 via-gray-100/80 to-gray-50/80 dark:from-gray-800/90 dark:via-gray-700/80 dark:to-gray-900/80 border border-white/80 dark:border-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden group z-0"
        onClick={() => {setIsDetailOpen(true); {post.replyCount > 0 ? ReplyPosts() : ""}}}
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
              src={post?.avatar}
              alt={post?.username}
              attributedTo={post?.attributedTo}
              fallback={post?.username?.charAt(0)}
              size="md"
              variant="default"
              className="ring-2 ring-purple-500/20 dark:ring-pink-500/20 group-hover:ring-purple-500/40 dark:group-hover:ring-pink-500/40 transition-all duration-300"
            />
            <div className="flex flex-col">
              <Link href={`/users/${post?.attributedTo?.split("/").pop()}`}>
              <div className="flex items-center gap-1.5 hover:scale-105 cursor-pointer transition-transform duration-200">
                <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-pink-400 transition-colors duration-200">{post?.username}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">@{post?.attributedTo?.split("/").pop()}</span> 
              </div>
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post.$createdAt)}</span>
            </div>
          </div>
          <div className="text-gray-800 dark:text-gray-200 text-base leading-relaxed">{post?.content}</div>
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
              <ContentsCard arg={post.content} />
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
              aria-label={`@${post.username} にリプライ`}
            >
              <span className="group-hover:animate-bounce">💭</span>
              {post.replyCount > 0 && (
                <span className="text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full">
                  {post.replyCount}
                </span>
              )}
            </button>
            <LikeButton postId={post.$id} initialLikes={post.LikedActors?.length || 0} isPostLiked={post.isLiked} />
          </div>
        </div>
      </div>

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
            <PostForm post={post} onClose={() => setIsReplyOpen(false)} />
          </div>
        </Modal>
      )}
    </>
  );
}