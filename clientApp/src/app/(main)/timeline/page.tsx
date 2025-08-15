"use client";

import React, { useEffect, useState,  } from "react";
import PostForm from "@/components/features/post/form/PostForm";
import PostCard from "@/components/features/post/card/PostCard";
import Alert from "@/components/ui/Alert";
import ImageModalContent from "@/components/features/post/modal/ImageModalContent";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ActivityPubNote } from "@/types/activitypub";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { getActorByUserId, Actor as ActorType } from "@/lib/appwrite/database";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { usePostCache } from "@/hooks/post/usePostCache";


// カスタムフック: タイムライン管理
const useTimelineManager = () => {
  const [posts, setPosts] = useState<ActivityPubNote[]>([]);
  const [offset, setOffset] = useState<number>(10);
  const [fetchMore, setFetchMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchPosts = async (offset: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts?limit=10&offset=${offset}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/activity+json",
        "Accept": "application/activity+json",
      },
    });
    const data = await res.json();
    const sortedPosts = data.notes.sort((a: any, b: any) => new Date(b.published).getTime() - new Date(a.published).getTime());
    setPosts([...sortedPosts]);
    setFetchMore(data.total > offset + data.notes.length);
    setIsLoading(false);
    } catch (error) {
      setError(error as ApiError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts(0);
  }, []);

  const handleLoadMore = async () => {
    fetchPosts(offset); 
    setOffset(offset + 10);
  }

  const handleTimelineReload = async () => {
    fetchPosts(0);
    setOffset(10);
  };

  return { posts, fetchMore, isLoading, error, handleLoadMore, handleTimelineReload };
}
// カスタムフック: ユーザー認証とアクター情報
const useUserAndActor = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [actor, setActor] = useState<ActorType | null>(null);

  useEffect(() => {
    if (!user && !isAuthLoading) {
      window.location.href = "/login";
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    if (user) {
      getActorByUserId(user.$id)
        .then(res => setActor(res))
        .catch(err => console.error(err));
    }
  }, [user]);

  return { user, isAuthLoading, actor };
};

// コンポーネント: タイムラインヘッダー
const TimelineHeader = ({ onRefresh }: { onRefresh: () => void }) => {
  const { invalidatePostCache } = usePostCache();
  
  const handleRefreshWithCacheInvalidation = () => {
    //console.log('🔄 タイムラインヘッダークリック: キャッシュ無効化 + タイムライン更新');
    
    // 投稿関連のキャッシュを無効化
    invalidatePostCache('update');
    
    // タイムラインを更新
    onRefresh();
  };

  return (
    <div className="bg-gradient-to-br from-white/90 via-gray-100/80 to-gray-50/80 dark:from-gray-800/40 dark:via-gray-700/80 dark:to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 mb-8 border border-purple-100 dark:border-purple-900">
      <button 
        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4 hover:scale-105 transition-transform duration-200" 
        onClick={handleRefreshWithCacheInvalidation}
      >
        タイムライン ✨
      </button>
      <PostForm />
    </div>
  );
};

// コンポーネント: もっと見るボタン
const LoadMoreButton = ({ onLoadMore }: { onLoadMore: () => void }) => {
    // 追加の投稿を読み込み
    onLoadMore();

  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={onLoadMore}
        className="px-6 py-3 rounded-full text-white font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
      >
        <span className="flex items-center">
          <span className="mr-2">✨</span>
          もっと見る
        </span>
      </button>
    </div>
  );
};

// コンポーネント: 空の状態
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 dark:border-purple-900">
    <div className="text-6xl mb-4 animate-bounce">💫</div>
    <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
      まだ投稿がないよ！✨
    </p>
    <p className="text-gray-600 dark:text-gray-400">
      最初の投稿をしてみよう！💖
    </p>
  </div>
);

// コンポーネント: 投稿リスト（シンプル版）
const PostList = ({ 
  posts, 
  setIsModalOpen, 
  isModalOpen, 
  setModalImages, 
  setModalIndex 
}: {
  posts: ActivityPubNote[]; // ActivityPubのNote形式の配列
  setIsModalOpen: (open: boolean) => void;
  isModalOpen: boolean;
  setModalImages: (images: ActivityPubImage[]) => void;
  setModalIndex: (index: number) => void;
}) => (
  <div className="space-y-4">
    {Array.isArray(posts) && posts.map((post) => (
      <PostCard 
        key={post.id} // $idを使用
        post={post} 
        setIsModalOpen={setIsModalOpen} 
        isModalOpen={isModalOpen} 
        setModalImages={setModalImages}
        setModalIndex={setModalIndex}
      />
    ))}
  </div>
);

// メインのタイムラインコンテンツコンポーネント
const TimelineContent = ({ 
  isLoading, 
  posts, 
  error,
}: {
  isLoading: boolean | null;
  posts: ActivityPubNote[]; // ActivityPubのNote形式の配列
  error: ApiError | null;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<ActivityPubImage[]>([]);
  const [modalIndex, setModalIndex] = useState(0);

  if (isLoading) {
    return <LoadingSkeleton />;
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
      {isModalOpen && (
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
        <EmptyState />
      ) : (
        <PostList 
          posts={posts}
          setIsModalOpen={setIsModalOpen}
          isModalOpen={isModalOpen}
          setModalImages={setModalImages}
          setModalIndex={setModalIndex}
        />
      )}
    </div>
  );
};

/**
 * タイムラインページ！✨
 * みんなの投稿が見れるよ！💖
 */
export default function TimelinePage() {
  const { actor } = useUserAndActor();
  const { posts:nextPosts, fetchMore, isLoading :isLoadingNextPosts, error,  handleTimelineReload, handleLoadMore } = useTimelineManager();
  const [posts, setPosts] = useState<ActivityPubNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 投稿作成イベントのリスナー！✨
  useEffect(() => {
    const newPosts = nextPosts.filter((post: any) => !posts.some((p: any) => p.id === post.id)).map((post: any) => ({
      ...post,
      published: post.published ,
    }));
    setPosts([...posts, ...newPosts]);
    setIsLoading(false);
  }, [nextPosts]);
  return (
    <>
      <div 
        className="bg-cover bg-center z-[-1] absolute inset-0 w-full h-full bg-fixed" 
        style={{backgroundImage: `url(${actor?.backgroundUrl})`}}
      />
      <div 
        className="max-w-2xl mx-auto md:px-4"
      >
        <TimelineHeader onRefresh={handleTimelineReload} />
        
        <TimelineContent 
          isLoading={isLoading} 
          posts={posts} 
          error={error}
        />
        {isLoadingNextPosts && <LoadingSkeleton />}
        {fetchMore && <LoadMoreButton onLoadMore={handleLoadMore} />}
      </div>
    </>
  );
}