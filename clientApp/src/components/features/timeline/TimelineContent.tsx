
import PostCard from "@/components/features/post/card/PostCard";
import Alert from "@/components/ui/Alert";
import ImageModalContent from "@/components/features/post/modal/ImageModalContent";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

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
  const EmptyState = ({ isUser }: { isUser: boolean }) => (
    <div className="flex flex-col items-center justify-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 dark:border-purple-900">
      <div className="text-6xl mb-4 animate-bounce">💫</div>
      <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
        {isUser ?  "最近投稿をしていないみたい！":"まだ投稿がないよ！✨" }
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        {isUser ? "" : "最初の投稿をしてみよう！💖"}
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
    posts: ActivityPubNoteInClient[]; // ActivityPubのNote形式の配列
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
    posts: ActivityPubNoteInClient[]; // ActivityPubのNote形式の配列
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

  export { LoadMoreButton, EmptyState,  TimelineContent };