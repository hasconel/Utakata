"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import PostForm from "./PostForm";
import ReplyToPost from "./ReplyToPost";
import { Post } from "@/lib/appwrite/posts";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate,  } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils/date";
import ImageModal from "./ImageModal";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { getReplyPost } from "@/lib/appwrite/client";
import PostReplies from "./PostReplies";
import Link from "next/link";
import ContentsCard from "@/components/ui/ContentsCard";
import { deletePost, likePost, unlikePost } from "@/lib/appwrite/serverConfig";

// いいねボタンのコンポーネント！✨
const LikeButton = ({ postId, initialLikes = 0 ,isPostLiked}: { postId: string; initialLikes?: number ,isPostLiked: boolean }) => {
  const [isLiked, setIsLiked] = useState(isPostLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsLiked(!isLiked);

    try {
      // TODO: ここにライクのAPIを実装するよ！💖
      if (isLiked) {
        const response = await unlikePost(postId);
        setLikeCount(prev => prev - 1);
        if (!response) throw new Error("ライク解除に失敗したわ！💦");
      } else {
        const response = await likePost(postId);
        setLikeCount(prev => prev + 1);
        if (!response) throw new Error("ライクに失敗したわ！💦");
      }
      // const response = await likePost(postId);
      // if (!response.ok) throw new Error("ライクに失敗したわ！💦");
    } catch (error) {
      console.error("ライクに失敗したわ！", error);
      setIsLiked(isLiked);
    }

    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleLike();
      }}
      className={`group relative px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
        isLiked 
          ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-2 border-pink-200 dark:border-pink-800' 
          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`transition-all duration-200 ${isAnimating ? 'animate-bounce' : ''}`}>
          {isLiked ? '💖' : '🤍'}
        </span>
        <span className="font-medium">
          {likeCount > 0 ? `${likeCount}いいね` : 'いいね'}
        </span>
      </div>
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-pink-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
        isLiked ? 'opacity-100' : ''
      }`} />
    </button>
  );
};

/**
 * 投稿カードコンポーネント！✨
 * 投稿の内容を表示して、リプライ機能もついてるよ！💖
 */
export default function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [replyToPost, setReplyToPost] = useState<Post | null>(null);
  const [replyPosts, setReplyPosts] = useState<Post[]>([]);
  const [relativeTime, setRelativeTime] = useState<string>("");
  const images = post.attachment?.map((image) => JSON.parse(image) as ActivityPubImage) || [];
  const ContentsDocment = post.content ? post.content.split("\n").map((line, index) => (
    <p key={index} className="text-gray-800 dark:text-gray-200">{line}</p>
  )) : [];
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

  useEffect(() => {
    if (!post?.inReplyTo) return;

    fetch(`/api/posts/${post.inReplyTo.split("/").pop()}`).then((res) => res.json()).then((data) => setReplyToPost(data));
  }, [post?.inReplyTo]);

  // 削除ボタンのコンポーネントを追加
  const DeleteButton = ({ postId }: { postId: string }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDelete = async () => {
      try {
        const response = await deletePost(postId);

        if (!response) {
          throw new Error("投稿の削除に失敗したわ！💦");
        }
        setIsDetailOpen(false);
      } catch (error) {
        console.error("投稿の削除に失敗したわ！", error);
      }
      router.refresh();
    };

    return (
      <>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-red-200 dark:border-red-800"
        >
          <div className="flex items-center gap-2">
            <span className={`transition-transform duration-200 ${isHovered ? 'animate-bounce' : ''}`}>
              {isHovered ? '💔' : '🗑️'}
            </span>
            <span className="font-medium">削除する</span>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>

        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
          <div className="space-y-6 m-4">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-bounce">💔</div>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                本当に削除する？💦
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                削除した投稿は元に戻せないよ！💦
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setIsDeleteModalOpen(false);
                }}
                className="px-6 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-red-200 dark:border-red-800"
              >
                削除する
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  };

  return (
    <>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200 hover:scale-105 cursor-pointer relative"
        onClick={() => {setIsDetailOpen(true); {post.replyCount > 0 ? ReplyPosts() : ""}}}
      >
        {/* 相対時間を表示するよ！✨ */}
        <div className="absolute top-4 right-4 text-sm text-gray-500 dark:text-gray-400">
          {relativeTime}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Avatar
              src={post?.avatar}
              alt={post?.username}
              attributedTo={post?.attributedTo}
              fallback={post?.username?.charAt(0)}
              size="md"
              variant="default"
            />
            <div className="flex flex-col">
              <Link href={`/users/${post?.attributedTo?.split("/").pop()}`}>
              <div className="flex items-center gap-1 hover:scale-105 cursor-pointer">
                <span className="font-bold">{post?.username}</span>
                <span className="text-sm text-gray-500">@{post?.attributedTo?.split("/").pop()}</span> 
              </div>
              </Link>
              <span className="text-sm text-gray-500">{formatDate(post?.published)}</span>
            </div>
          </div>
          <p className="text-gray-800 dark:text-gray-200">{post?.content}</p>
          {images.length > 0 ? (
              <ImageModal images={images} isDetailOpen={true} />
          ):(              <ContentsCard arg={post.content} />
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsReplyOpen(true);
            }}
            className="text-purple-600 dark:text-pink hover:text-purple-700 dark:hover:text-pink-600 hover:scale-105 transition-all duration-200 flex items-center space-x-2 group"
            aria-label={`@${post.username} にリプライ`}
          >
            <span className="flex items-center space-x-1">
              <span className="group-hover:animate-bounce">💭</span>
              <span>言及する</span>
            </span>
            {post.replyCount > 0 && (
              <span className="bg-purple-100 dark:bg-pink-100 text-purple-600 dark:text-pink-600 text-xs font-semibold px-2 py-1 rounded-full transform hover:scale-110 transition-transform duration-200">
                {post.replyCount}件の言及 ✨
              </span>
            )}
          </button>
          <LikeButton postId={post.$id} initialLikes={post.LikedActors?.length || 0} isPostLiked={post.isLiked} />
        </div>
      </div>

      {isDetailOpen && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}>
          <div className="space-y-6 m-4">
            {replyToPost && <ReplyToPost post={replyToPost} />}

            <div className="flex items-center">
              <Avatar
                src={post?.avatar}
                alt={post?.username}
                fallback={post?.username?.charAt(0)}
                size="lg"
                variant="outline"
                className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"
              />
              <div className="ml-4">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  @{post.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(post.$createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-xl text-gray-800 dark:text-gray-200">{ContentsDocment}</p>

            {images.length > 0 ? (
              <div onClick={(e) => e.stopPropagation()}>
                <ImageModal images={images} />
              </div>
            ) : (
              <ContentsCard arg={post.content} />
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  setIsReplyOpen(true);
                }}
                className="text-purple-600 dark:text-pink hover:text-purple-700 dark:hover:text-pink-600 hover:scale-105 transition-all duration-200 flex items-center space-x-2 group"
                aria-label={`@${post.username} にリプライ`}
              >
                <span className="flex items-center space-x-1">
                  <span className="group-hover:animate-bounce">💭</span>
                  <span>言及する</span>
                </span>
              </button>
              {post.canDelete && <DeleteButton postId={post.$id} />}
            </div>

            {post.replyCount > 0 && (
              replyPosts.map((reply) => (
                <PostReplies key={reply.$id} post={reply} />
              ))
            )}
          </div>
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