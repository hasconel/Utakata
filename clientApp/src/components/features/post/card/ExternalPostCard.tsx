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
import PostDetailCard from "./PostDetailCard";
import { usePostCache } from "@/hooks/post/usePostCache";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { getActorDisplayPreferredUsername } from "@/lib/activitypub/utils";

/**
 * ActivityPubの外部インスタンス用投稿カードコンポーネント！✨
 * 投稿の内容を表示して、リプライ機能もついてるよ！💖
 * @param post 投稿ID
 * @param setIsModalOpen モーダルを開く
 * @param isModalOpen モーダルが開いているかどうか
 * @param setModalImages モーダルの画像を設定
 * @param setModalIndex モーダルのインデックスを設定
 */
const ExternalPostCard = React.memo(({ post, setIsModalOpen, isModalOpen, setModalImages, setModalIndex}: { 
  post: string, 
  setIsModalOpen: (isOpen: boolean) => void, 
  isModalOpen: boolean, 
  setModalImages: (images: ActivityPubImage[]) => void, 
  setModalIndex: (index: number) => void 
}) => {
  //console.log(`🔧 PostCard レンダリング: ${post}`);
  
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [, setReplyPosts] = useState<any[]>([]);
  const [relativeTime, setRelativeTime] = useState<string>("");
  const { getPostWithActor } = usePostCache();
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
  }, [post]); // getPostWithActorを依存関係から削除

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
    // 既に取得済みの場合はスキップ
    if (postData?.post?.inReplyTo && !postData?.post?.inReplyTo.includes("undefined")) {
      getReplyPost(postData.post.inReplyTo).then((data) => {
        if (data && data.length > 0) {
          setReplyPosts(data);
          //console.log("✅ リプライ投稿を取得:", data.length, "件");
        }
      }).catch((error) => {
        console.error("❌ リプライ投稿の取得に失敗:", error);
      });
    }
  }
  
  if(isPostLoading){
    return <LoadingSkeleton />;
  }

  return (
    <>
      {postData?.post?.id && (
        <div className="flex flex-col gap-2 w-full">
      <div 
        className="bg-gradient-to-br from-white/90 via-gray-100/80 to-gray-50/80 dark:from-gray-800/90 dark:via-gray-700/80 dark:to-gray-900/80 border border-pink-500/80 dark:border-purple-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden group z-0 w-full"
        onClick={() => {
          setIsDetailOpen(true);
          // リプライがある場合のみReplyPostsを実行
          if (postData?.post?.replyCount > 0 && postData?.post?.inReplyTo) {
            ReplyPosts();
          }
        }}
      >
        {/* キラキラな背景エフェクト！✨ */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />
        
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
              <ContentsCard arg={postData?.post?.content || "" } />
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

ExternalPostCard.displayName = 'ExternalPostCard';

export default ExternalPostCard;
