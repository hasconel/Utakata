"use client";

import React, { useEffect, useState,  } from "react";
import PostForm from "@/components/features/post/form/PostForm";
import {  ActivityPubActor, ActivityPubNoteInClient } from "@/types/activitypub";
import { useAuth } from "@/hooks/auth/useAuth";
import { getActorByUserId } from "@/lib/appwrite/database";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { TimelineContent, LoadMoreButton, EmptyState } from "@/components/features/timeline/TimelineContent";
import { useTimelineManager } from "@/hooks/api/useApi";
//import { getTimelinePosts } from "@/lib/appwrite/serverConfig";// 使えなかった


// カスタムフック: タイムライン管理
// カスタムフック: ユーザー認証とアクター情報
const useUserAndActor = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [actor, setActor] = useState<ActivityPubActor | null>(null);

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
};/**
 * タイムラインページ！✨
 * みんなの投稿が見れるよ！💖
 */
export default function TimelinePage() {
  const { actor } = useUserAndActor();
  const { posts:nextPosts, fetchMore, isLoading :isLoadingNextPosts, error,  handleTimelineReload, handleLoadMore } = useTimelineManager(actor?.id.split("/").pop() || "");
  const [posts, setPosts] = useState<ActivityPubNoteInClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setPosts(nextPosts);
    setIsLoading(isLoadingNextPosts);
  }, [nextPosts, isLoadingNextPosts]);
  return (  
    <>
      <div 
        className="w-full h-full bg-cover bg-center z-[-1] bg-fixed absolute top-0 left-0" 
        style={{backgroundImage: `url(${actor?.image?.url})`}}
      />
      <div 
        className="max-w-2xl mx-auto md:px-4"
      >
        <TimelineHeader onRefresh={handleTimelineReload} />
        {isLoading || isLoadingNextPosts ? (
          <LoadingSkeleton />
        ) : ( posts.length > 0 || !isLoadingNextPosts || fetchMore ? (
          <TimelineContent 
            isLoading={isLoading} 
            posts={posts} 
            error={error}
          />
        ) : ( <EmptyState isUser={false} />))    
        }
        {fetchMore && !isLoadingNextPosts && <LoadMoreButton onLoadMore={handleLoadMore} />}
      </div>
    </>
  );
}