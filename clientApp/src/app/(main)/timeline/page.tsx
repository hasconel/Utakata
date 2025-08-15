"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { usePostCache } from "@/hooks/post/usePostCache";

// カスタムフック: プルリフレッシュ機能
const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const { invalidatePostCache } = usePostCache();

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    if (diff > 50 && window.scrollY === 0 && !isRefreshing) {
      setIsRefreshing(true);
      
      // プルリフレッシュ時にキャッシュ無効化
      //console.log('📱 プルリフレッシュ: キャッシュ無効化 + タイムライン更新');
      invalidatePostCache('update');
      
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const { invalidatePostCache } = usePostCache();
  
  // 直接fetchする関数
  const fetchPosts = useCallback(async (currentOffset: number = 0, isRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const url = new URL('/api/posts', window.location.origin);
      url.searchParams.set('limit', '10');
      url.searchParams.set('offset', currentOffset.toString());
      
      //  console.log('📡 投稿を直接fetch中:', url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // キャッシュを使わない
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const posts: string[] = data.postsAsPostArray || [];
      
      //console.log('✅ 投稿fetch完了:', posts.length, '件');
      
      if (isRefresh) {
        // リフレッシュの場合は既存の投稿を置き換え
        setAllPosts(posts);
      } else {
        // 追加読み込みの場合は既存の投稿に追加
        setAllPosts(prevPosts => {
          const existingPostsSet = new Set(prevPosts);
          const newPosts = posts.filter((post: string) => !existingPostsSet.has(post));
          return [...prevPosts, ...newPosts];
        });
      }
      
      // 次のページがあるかどうかを判定
      setFetchMore(posts.length >= 10);
      
    } catch (error) {
      //console.error('❌ 投稿fetchエラー:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!Array.isArray(allPosts)) return;
    
    const hasMorePosts = allPosts.length >= 10;
    setFetchMore(hasMorePosts);
    
    // このフックではキャッシュを使わないため、offsetは常に0
    // キャッシュを使わないため、postsの内容は常に最新
  }, [allPosts]);

  // 初期データの読み込み
  useEffect(() => {
    //console.log('🚀 初期データ読み込み開始');
    fetchPosts(0, true);
  }, [fetchPosts]);

  // useRefで安定した参照を確保
  const refetchRef = useRef(fetchPosts);
  const handleTimelineReloadRef = useRef(fetchPosts);
  
  useEffect(() => {
    refetchRef.current = fetchPosts;
  }, [fetchPosts]);
  
  useEffect(() => {
    handleTimelineReloadRef.current = fetchPosts;
  }, [fetchPosts]);

  // キャッシュ無効化イベントのリスナーを追加
  useEffect(() => {
    //console.log('🔧 イベントリスナーを登録中...');
    
    const handleCacheInvalidated = (event: Event) => {
      const customEvent = event as CustomEvent;
      //console.log('🔄 キャッシュ無効化イベントを受信:', customEvent.detail);
      
      // 投稿の作成・更新・削除時にタイムラインを再読み込み
      if (customEvent.detail.action === 'create' || customEvent.detail.action === 'update' || customEvent.detail.action === 'delete') {
        //console.log('📱 キャッシュ無効化によるタイムライン更新（無限ループ防止）');
        
        // キャッシュ無効化をスキップしてタイムラインを更新
        handleTimelineReloadRef.current(0, true); // offsetを0にしてリフレッシュ
      }
    };

    // カスタムイベントリスナーを追加
    window.addEventListener('postCacheInvalidated', handleCacheInvalidated as EventListener);
    
    // 既存の投稿作成イベントリスナーも維持
    const handlePostCreated = () => {
      //console.log('✨ 投稿作成イベントを受信');
      handleTimelineReloadRef.current(0, true); // offsetを0にしてリフレッシュ
    };
    window.addEventListener('postCreated', handlePostCreated);

    // 投稿削除イベントリスナーを追加
    const handlePostDeleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      //console.log('🗑️ 投稿削除イベントを受信:', customEvent.detail);
      const deletedPostId = customEvent.detail.postId;
      
      // 削除された投稿を一覧から除外
      setAllPosts(prevPosts => {
        const filteredPosts = prevPosts.filter(post => !post.includes(deletedPostId));
        //console.log(`🗑️ 投稿を一覧から除外: ${deletedPostId}`);
        return filteredPosts;
      });
      
      // 削除後は最新データを取得
      handleTimelineReloadRef.current(0, true);
    };
    window.addEventListener('postDeleted', handlePostDeleted);

    //console.log('🔧 イベントリスナー登録完了');

    // クリーンアップ
    return () => {
      //console.log('🧹 イベントリスナーをクリーンアップ中...');
      window.removeEventListener('postCacheInvalidated', handleCacheInvalidated as EventListener);
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('postDeleted', handlePostDeleted);
      //console.log('🧹 イベントリスナークリーンアップ完了');
    };
  }, []); // handleTimelineReloadを依存関係から削除

  const handleLoadMore = useCallback(async () => {
    handleTimelineReloadRef.current(offset, false); // offsetを増やして追加読み込み
  }, [offset]);

  return {
    allPosts,
    fetchMore,
    isLoading,
    error,
    handleTimelineReload: handleTimelineReloadRef.current,
    handleLoadMore,
    refetch: fetchPosts // このフックではrefetchはfetchPostsを直接呼び出す
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

// コンポーネント: プルリフレッシュインジケーター（メモ化）
const PullRefreshIndicator = React.memo(({ isRefreshing }: { isRefreshing: boolean }) => {
  if (!isRefreshing) return null;

  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center z-50">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-b-2xl shadow-lg border border-purple-100 dark:border-purple-900">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600 dark:border-pink-500"></div>
      </div>
    </div>
  );
});

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
  const { invalidatePostCache } = usePostCache();
  
  const handleLoadMoreWithCacheInvalidation = () => {
    //console.log('📚 もっと見るボタンクリック: キャッシュ無効化 + 追加読み込み');
    
    // 投稿関連のキャッシュを無効化
    invalidatePostCache('update');
    
    // 追加の投稿を読み込み
    onLoadMore();
  };

  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={handleLoadMoreWithCacheInvalidation}
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
  posts: string[];
  setIsModalOpen: (open: boolean) => void;
  isModalOpen: boolean;
  setModalImages: (images: ActivityPubImage[]) => void;
  setModalIndex: (index: number) => void;
}) => (
  <div className="space-y-4">
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
  } = useTimelineManager();
  
  const { isRefreshing, handleTouchStart, handleTouchMove } = usePullToRefresh(handleTimelineReload);

  // 投稿作成イベントのリスナー！✨
  useEffect(() => {
    const handlePostCreated = () => {
      //console.log('✨ 投稿作成イベントを受信（無限ループ防止）');
      
      // キャッシュ無効化をスキップしてタイムラインを更新
      handleTimelineReload(0, true); // offsetを0にしてリフレッシュ
    };

    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, [handleTimelineReload]); // handleTimelineReloadを依存関係に追加

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
