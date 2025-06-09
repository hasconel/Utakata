"use client";

import {  useEffect, useState } from "react";
import PostForm from "@/components/features/post/form/PostForm";
import PostCard from "@/components/features/post/card/PostCard";
import Alert from "@/components/ui/Alert";
import { useTimeline } from "@/hooks/api/useApi";
import ImageModalContent from "@/components/features/post/modal/ImageModalContent";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { Post } from "@/lib/appwrite/posts";
import { ApiError } from  "@/lib/api/client";
import { useAuth } from "@/hooks/auth/useAuth";
/**
 * タイムラインページ！✨
 * みんなの投稿が見れるよ！💖
 */
export default function TimelinePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  useEffect(() => {
    if (!user && !isAuthLoading) {
      window.location.href = "/login";
    }
  }, [user, isAuthLoading]);
  const [offset, setOffset] = useState(0);
  const { data: posts, isLoading, error, refetch } = useTimeline(10, offset);
  const [isComponentLoading, setIsComponentLoading] = useState(false);
  // セッションチェック！✨

  // セッションチェック！✨
  useEffect(() => {
    setIsComponentLoading(true);
    setIsComponentLoading(false);
  }, []);
  
  // タイムラインのリロード！✨
  const handleTimelineReload = () => {
    setOffset(0);
    refetch();  
  };

  // 投稿作成イベントのリスナー！✨
  useEffect(() => {
    const handlePostCreated = () => {
      setOffset(0);
      refetch();
    };

    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, [refetch]);

  // もっと見るボタンのハンドラー！✨
  const handleLoadMore = (offsetcount: 10 |-10) => {
    setOffset(offset+offsetcount);
  };

  return (
    <>
    {isComponentLoading && (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-pink-500"></div>
      </div>
    )}
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 mb-8 border border-purple-100 dark:border-purple-900">
        <button className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4" onClick={() => handleTimelineReload()}>
          タイムライン ✨
        </button>
        <PostForm />
      </div>
      {offset !== 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => handleLoadMore(-10)}
            className="px-6 py-3 mb-4 rounded-full text-white font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
          >
            <span className="flex items-center">
              <span className="mr-2">✨</span>
              もっと見る
            </span>
          </button>
        </div>
      )}
      
      {posts && <TimelineContent 
      isLoading={isLoading} 
      posts={posts} 
      error={error}
      />}
          {/* もっと見るボタン！✨ */}
            {posts && posts.length > 9 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => handleLoadMore(10)}
              className="px-6 py-3 rounded-full text-white font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
            >
              <span className="flex items-center">
                <span className="mr-2">✨</span>
                もっと見る
              </span>
            </button>
          </div>
          )}    </div>
          </>
  );
}

const TimelineContent = ({  isLoading, posts,  error}: {isLoading: boolean | null, posts: Post[], error: ApiError | null}) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<ActivityPubImage[]>([]);
  const [modalIndex, setModalIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Alert type="error" message={error.message} />
      </div>
    );
  }


  return (
    <div>
      {isModalOpen  && (
        <div className="fixed inset-0 z-50">
          <ImageModalContent 
          imagesTable={modalImages} 
          isModalOpen={isModalOpen} 
          setIsModalOpen={setIsModalOpen} 
          index={modalIndex}
        />
        </div>
      )}
      {!posts || posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 dark:border-purple-900">
          <div className="text-6xl mb-4 animate-bounce">💫</div>
          <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
            まだ投稿がないよ！✨
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            最初の投稿をしてみよう！💖
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.isArray(posts) && posts.map((post) => (
            <PostCard 
              key={post.$id} 
              post={post} 
              setIsModalOpen={setIsModalOpen} 
              isModalOpen={isModalOpen} 
              setModalImages={setModalImages}
              setModalIndex={setModalIndex}
            />
          ))}
          
        </div>
      )}
    </div>
  );
};
