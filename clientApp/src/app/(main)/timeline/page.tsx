"use client";

import { useEffect, useState, useCallback } from "react";
import PostForm from "@/components/features/post/form/PostForm";
import PostCard from "@/components/features/post/card/PostCard";
import Alert from "@/components/ui/Alert";
import { useTimeline } from "@/hooks/api/useApi";
import ImageModalContent from "@/components/features/post/modal/ImageModalContent";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { getActorByUserId, Actor as ActorType } from "@/lib/appwrite/database";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

// カスタムフック: プルリフレッシュ機能
const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    if (diff > 50 && window.scrollY === 0 && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh().finally(() => {
        setIsRefreshing(false);
      });
    }
  };

  return {
    isRefreshing,
    handleTouchStart,
    handleTouchMove
  };
};

// カスタムフック: タイムライン管理
const useTimelineManager = () => {
  const [fetchMore, setFetchMore] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [allPosts, setAllPosts] = useState<string[]>([]);
  
  const { data: posts, isLoading, error, refetch } = useTimeline(10, offset || 0, null, null);
  
  // プリフェッチ用のフック（次のページのデータを事前に読み込み）
  //const { data: nextPosts } = useTimeline(10, (offset || 0) + 10, null, null, null);

  useEffect(() => {
    if (!Array.isArray(posts)) return;
    
    const hasMorePosts = posts.length >= 10;
    setFetchMore(hasMorePosts);
    
    setAllPosts(prevPosts => {
      if (offset === 0) {
        const newPosts = posts.filter(post => !prevPosts.includes(post));
        return [...newPosts, ...prevPosts];
      } else {
        const newPosts = posts.filter(post => !prevPosts.includes(post));
        return [...prevPosts, ...newPosts];
      }
    });
  }, [posts, offset]);

  const handleTimelineReload = useCallback(async () => {
    setOffset(0);
    setAllPosts([]);
    await refetch();
  }, []); // refetchは安定した参照なので依存関係から除外

  const handleLoadMore = useCallback(async () => {
    setOffset(prevOffset => prevOffset + 10);
    await refetch();
  }, []); // refetchは安定した参照なので依存関係から除外

  return {
    allPosts,
    fetchMore,
    isLoading,
    error,
    handleTimelineReload,
    handleLoadMore,
    refetch
  };
};

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

// コンポーネント: プルリフレッシュインジケーター
const PullRefreshIndicator = ({ isRefreshing }: { isRefreshing: boolean }) => {
  if (!isRefreshing) return null;

  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center z-50">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-b-2xl shadow-lg border border-purple-100 dark:border-purple-900">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600 dark:border-pink-500"></div>
      </div>
    </div>
  );
};

// コンポーネント: タイムラインヘッダー
const TimelineHeader = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="bg-gradient-to-br from-white/90 via-gray-100/80 to-gray-50/80 dark:from-gray-800/40 dark:via-gray-700/80 dark:to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 mb-8 border border-purple-100 dark:border-purple-900">
    <button 
      className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4" 
      onClick={onRefresh}
    >
      タイムライン ✨
    </button>
    <PostForm />
  </div>
);

// コンポーネント: もっと見るボタン
const LoadMoreButton = ({ onLoadMore }: { onLoadMore: () => void }) => (
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

// コンポーネント: 投稿リスト
const PostList = ({ 
  posts, 
  setIsModalOpen, 
  isModalOpen, 
  setModalImages, 
  setModalIndex 
}: {
  posts: string[];
  setIsModalOpen: (open: boolean) => void;
  isModalOpen: boolean;
  setModalImages: (images: ActivityPubImage[]) => void;
  setModalIndex: (index: number) => void;
}) => (
  <div className="space-y-6">
    {Array.isArray(posts) && posts.map((post) => (
      <PostCard 
        key={post} 
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
  error 
}: {
  isLoading: boolean | null;
  posts: string[];
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
  const { 
    allPosts, 
    fetchMore, 
    isLoading, 
    error, 
    handleTimelineReload, 
    handleLoadMore, 
    refetch 
  } = useTimelineManager();
  
  const { isRefreshing, handleTouchStart, handleTouchMove } = usePullToRefresh(handleTimelineReload);

  // 投稿作成イベントのリスナー！✨
  useEffect(() => {
    const handlePostCreated = () => {
      refetch();
    };

    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, []); // refetchは安定した参照なので依存関係から除外

  return (
    <>
      <div 
        className="bg-cover bg-center z-[-1] absolute inset-0 w-full h-full bg-fixed" 
        style={{backgroundImage: `url(${actor?.backgroundUrl})`}}
      />
      <div 
        className="max-w-2xl mx-auto md:px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <PullRefreshIndicator isRefreshing={isRefreshing} />
        
        <TimelineHeader onRefresh={handleTimelineReload} />
        
        <TimelineContent 
          isLoading={isLoading} 
          posts={allPosts} 
          error={error}
        />
        
        {fetchMore && <LoadMoreButton onLoadMore={handleLoadMore} />}
      </div>
    </>
  );
}
