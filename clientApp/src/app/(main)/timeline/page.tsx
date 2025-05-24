"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
import PostForm from "@/components/features/post/PostForm";
import PostCard from "@/components/features/post/PostCard";
import Alert from "@/components/ui/Alert";
import { Post } from "@/lib/appwrite/posts";
import { fetchTimelinePosts } from "@/lib/appwrite/client";
import { Models } from "appwrite";

/**
 * タイムラインページ！✨
 * みんなの投稿が見れるよ！💖
 */
export default function TimelinePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [session, setSession] = useState<Models.User<Models.Preferences> | null>(null);
  const checkSession = async () => {
    try {
      const loadsession = await getLoggedInUser();
      setSession(loadsession);
    } catch (err: any) {
      if (err.message === "No session found" || err.code === 401) {
        redirect("/login?error=login_required");
      }
      throw err;
    }
  };

  const loadPosts = async (loadMore = false) => {
    try {
      if (!loadMore) {
        await checkSession();
      }
      const fetchedPosts :Post[] = await fetchTimelinePosts(10, offset);
      if (loadMore) {
        setPosts(prev => [...prev, ...fetchedPosts]);
      } else {
        setPosts(fetchedPosts);
      }

      // オフセットを更新
      if (fetchedPosts.length > 0) {
        setOffset(prev => prev + fetchedPosts.length);
        setHasMore(fetchedPosts.length === 10); // 10件ずつ取得する想定
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("投稿の取得に失敗しました:", error);
      setError("投稿の取得に失敗しました");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadPosts(true);
  };

  useEffect(() => {
    loadPosts();

    // 投稿作成イベントのリスナーを追加！✨
    const handlePostCreated = () => {
      setOffset(0); // リセット
      loadPosts();
    };

    window.addEventListener('postCreated', handlePostCreated);

    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-pink"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 dark:text-red-400 text-center">
          <p className="text-xl font-bold mb-2">エラーが発生したよ！💦</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200 mb-8">
        <h1 className="text-3xl font-bold text-purple-600 dark:text-pink mb-4">
          タイムライン ✨
        </h1>
        <PostForm />
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
          <div className="text-6xl mb-4 animate-bounce">💫</div>
          <p className="text-xl font-bold text-purple-600 dark:text-pink mb-2">
            まだ投稿がないよ！✨
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            最初の投稿をしてみよう！💖
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.$id} post={post} />
          ))}
          
          {/* もっと見るボタン！✨ */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className={`px-6 py-3 rounded-full text-white font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  isLoadingMore
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-pink dark:bg-purple hover:bg-purple dark:hover:bg-pink"
                }`}
              >
                {isLoadingMore ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">💫</span>
                    読み込み中...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">✨</span>
                    もっと見る
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}