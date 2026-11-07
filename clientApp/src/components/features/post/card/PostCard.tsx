"use client";

import  { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { getRelativeTime } from "@/lib/utils/date";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import PostContent from "@/components/features/post/PostContent";
import { showToast } from "@/components/ui/Toast";
import ContentsCard from "@/components/ui/ContentsCard";
import { likePost, unlikePost } from "@/lib/appwrite/serverConfig";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date";
import ImageModal from "@/components/features/post/modal/ImageModal";
import Modal from "@/components/ui/Modal";
import PostDetailCard from "@/components/features/post/card/PostDetailCard";
import PostForm from "@/components/features/post/form/PostForm"; 

// いいねボタンのコンポーネント！✨
export const LikeButton = ({ 
  postId, 
  initialLikes, 
  isPostLiked, 
  actorInbox,
  onLikeChange,
  onLikeCountChange
}: { 
  postId: string; 
  initialLikes: number; 
  isPostLiked: boolean; 
  actorInbox: string;
  onLikeChange: (isLiked: boolean) => void;
  onLikeCountChange: (count: number) => void;
}) => {
  const [isLiked, setIsLiked] = useState(isPostLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 親の状態が変わったら同期
  useEffect(() => {
    setIsLiked(isPostLiked);
  }, [isPostLiked]);
  
  useEffect(() => {
    setLikeCount(initialLikes);
  }, [initialLikes]);
  
  const handleLike = async () => {
    if (isAnimating) return;
    
    const newIsLiked = !isLiked;
    setIsAnimating(true);
    setIsLiked(newIsLiked);

    try {
      if (isLiked) {
        const response = await unlikePost(postId, actorInbox);
        if (!response) throw new Error("ライク解除に失敗したわ！💦");
        const newCount = likeCount - 1;
        setLikeCount(newCount);
        onLikeCountChange(newCount);
      } else {
        const response = await likePost(postId, actorInbox);
        if (!response) throw new Error("ライクに失敗したわ！💦");
        const newCount = likeCount + 1;
        setLikeCount(newCount);
        onLikeCountChange(newCount);
      }
      onLikeChange(newIsLiked);
    } catch (error) {
      console.error("ライクに失敗したわ！", error);
      setIsLiked(isLiked);
      showToast(isLiked ? "いいねを取り消せなかったの…💦" : "いいねが届かなかったみたい…もう一回押してみて💦");
    }

    setTimeout(() => setIsAnimating(false), 500);
  };
  
  //console.log("LikeButton - isLiked:", isLiked, "likeCount:", likeCount);
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
          {isLiked ? <span className="text-transparent bg-clip-text bg-purple-500 dark:bg-pink-500">✨️</span> : <span className="text-transparent bg-clip-text bg-gray-400 dark:bg-gray-200">✨️</span>}
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
 * ActivityPubのNote形式のデータを表示して、リプライ機能もついてるよ！💖
 * @param post ActivityPubのNote形式の投稿データ
 * @param setIsModalOpen モーダルを開く
 * @param isModalOpen モーダルが開いているかどうか
 * @param setModalImages モーダルの画像を設定
 * @param setModalIndex モーダルのインデックスを設定
 */
const PostCard = ({ post, setIsModalOpen, isModalOpen, setModalImages, setModalIndex}: { 
  post: ActivityPubNoteInClient, // ActivityPubのNote形式の投稿データ
  setIsModalOpen: (isOpen: boolean) => void, 
  isModalOpen: boolean, 
  setModalImages: (images: ActivityPubImage[]) => void, 
  setModalIndex: (index: number) => void 
}) => {
  //const [replyPosts, setReplyPosts] = useState<any[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const images: ActivityPubImage[] = post?.attachment?.flatMap((image: any) => {
    try { return [JSON.parse(image) as ActivityPubImage]; } catch { return []; }
  }) || [];

  if(!post.published){
    return <LoadingSkeleton />;
  }
  return (
    <>
      {post?.id && (
        <div className="flex flex-col gap-2 w-full">
      <div 
        className="bg-gradient-to-br from-white/90 via-gray-100/80 to-gray-50/80 dark:from-gray-800/90 dark:via-gray-700/80 dark:to-gray-900/80 border border-pink-500/80 dark:border-purple-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden group z-0 w-full"
        onClick={() => setIsDetailOpen(true)}
      >
        {/* キラキラな背景エフェクト！✨ */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />
        
        {/* 相対時間を表示するよ！✨ */}
        <div className="absolute top-3 right-3 text-sm text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {getRelativeTime(new Date(post.published))}
        </div>

        <div className="flex flex-col gap-3 relative">
          <div className="flex items-center gap-2">
            <Avatar
              src={post?._user?.icon?.url}
              alt={post?._user?.preferredUsername}
              attributedTo={post?._user?.id}
              fallback={post?._user?.preferredUsername?.charAt(0)}
              size="md"
              variant={post?.to?.includes("https://www.w3.org/ns/activitystreams#Public") ? "outline" : "default"}
              className="ring-2 ring-purple-500/20 dark:ring-pink-500/20 group-hover:ring-purple-500/40 dark:group-hover:ring-pink-500/40 transition-all duration-300"
            />
            <div className="flex flex-col">
              <Link href={`${post?.attributedTo}`}>
              <div className="flex items-center gap-1.5 hover:scale-105 cursor-pointer transition-transform duration-200">
                <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-pink-400 transition-colors duration-200">{post?._user?.displayName}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">@{(post?._user?.preferredUsername)}</span> 
              </div>
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post?.published)}</span>
            </div>
          </div>
          <PostContent content={post?.content} className="text-gray-800 dark:text-gray-200 text-base leading-relaxed" />
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
              <ContentsCard arg={post?.content || "" } />
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
              aria-label={`@${post?._user?.preferredUsername} にリプライ`}
            >
              <span className="group-hover:animate-bounce">💭</span>
              {/*post?.replies?.totalItems && post?.replies?.totalItems !== 0 && (
                <span className="text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full">
                {post?.replies?.totalItems}
                </span>
              )}*/}
              
            </button>
          <LikeButton 
            postId={post?.id} 
            initialLikes={post?.likes?.totalItems || 0} 
            isPostLiked={post?._isLiked || false} 
            actorInbox={post?._user?.inbox || ""}
            onLikeChange={() => {}}
            onLikeCountChange={() => {}}
          />
          </div>
        </div>
      </div>
      </div>
      )}

      {isDetailOpen && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}>
          <PostDetailCard 
            post={post?.id} 
            initialPost={post}
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
            <PostForm post={{activityId: post?.id, preferredUsername: post?._user?.preferredUsername || "", attributedTo: post?._user?.id || "", note: post}} onClose={() => setIsReplyOpen(false)} />
          </div>
        </Modal>
      )}
    </>
  );
};
export default PostCard;
