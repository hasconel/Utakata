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


// カスタムフック: タイムライン管理
const useTimelineManager = () => {
  const [posts, setPosts] = useState<ActivityPubNote[]>([]);
  const [offset, setOffset] = useState<number>(10);
  const [fetchMore, setFetchMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchPosts = async (offset: number, isLoadMore: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts?limit=10&offset=${offset}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/activity+json",
          "Accept": "application/activity+json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
      });
      const data = await res.json();
      const sortedPosts = data.notes.sort((a: any, b: any) => new Date(b.published).getTime() - new Date(a.published).getTime());
      console.log("sortedPosts", sortedPosts);
      
      if (isLoadMore) {
        // もっと見る: 既存の投稿に追加
        setPosts(prevPosts => [...prevPosts, ...sortedPosts]);
      } else {
        // リロード: 投稿を置き換え
        setPosts([...sortedPosts]);
      }
      
      setFetchMore(data.total > offset + data.notes.length);
      setIsLoading(false);
    } catch (error) {
      setError(error as ApiError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // 最初のアクセス時のみfetch
    if (!isInitialized && offset === 10) {
      fetchPosts(0, false);
      setIsInitialized(true);
    }
  }, [isInitialized, offset]);

  const handleLoadMore = async () => {
    fetchPosts(offset, true); 
    setOffset(offset + 10);
  }

  const handleTimelineReload = async () => {
    fetchPosts(0, false);
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
  return (
    <div className="bg-gradient-to-br from-white/90 via-gray-100/80 to-gray-50/80 dark:from-gray-800/40 dark:via-gray-700/80 dark:to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 mb-8 border border-purple-100 dark:border-purple-900">
      <button 
        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4 hover:scale-105 transition-transform duration-200" 
        onClick={onRefresh}
      >
        タイムライン ✨
      </button>
      <PostForm refreshTimeline={onRefresh} />
    </div>
  );
};

// コンポーネント: もっと見るボタン
const LoadMoreButton = ({ onLoadMore }: { onLoadMore: () => void }) => {
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
    {Array.isArray(posts) && posts.map((post, index) => (
      <PostCard 
        key={post.id + index} // $idを使用
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
      
        <PostList 
          posts={posts}
          setIsModalOpen={setIsModalOpen}
          isModalOpen={isModalOpen}
          setModalImages={setModalImages}
          setModalIndex={setModalIndex}
        />
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
  const [isLoading, setIsLoading] = useState(true);
  //handleTimelineReloadが呼ばれたら、postsを更新
  useEffect(() => {
    setIsLoading(true);
    setPosts(nextPosts);
    setIsLoading(false);
  }, [handleTimelineReload]);
  //nextPostsが更新されたら、postsに追加
  useEffect(() => {
    if (nextPosts.length > 0) {
      // 重複チェックして新しい投稿のみを追加
      const newPosts = nextPosts.filter((nextPost: ActivityPubNote) => 
        !posts.some((existingPost: ActivityPubNote) => existingPost.id === nextPost.id)
      );
      
      if (newPosts.length > 0) {
        //console.log("新しい投稿を追加:", newPosts.length, "件");
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      } else {
        console.log("新しい投稿なし");
      }
      
      setIsLoading(false);
    }
  }, [nextPosts, posts]);


  return (  
    <>
      <div 
        className="w-full h-full bg-cover bg-center z-[-1] bg-fixed absolute top-0 left-0" 
        style={{backgroundImage: `url(${actor?.backgroundUrl})`}}
      />
      <div 
        className="max-w-2xl mx-auto md:px-4"
      >
        <TimelineHeader onRefresh={handleTimelineReload} />
        {posts.length > 0 || !isLoading || !isLoadingNextPosts ? (<>
        <TimelineContent 
          isLoading={isLoading} 
          posts={posts} 
          error={error}
        />

        {isLoadingNextPosts && <LoadingSkeleton />}
        {fetchMore && !isLoadingNextPosts && <LoadMoreButton onLoadMore={handleLoadMore} />}
        </>
        ) : (
          <EmptyState />
        )}
      </div>
    </>
  );
}