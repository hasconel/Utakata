"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Post } from "@/lib/appwrite/posts";
import { Actor } from "@/lib/appwrite/database";
import PostCard from "@/components/features/post/PostCard";
import { getUserPosts } from "@/lib/appwrite/client";
import { Button } from "@/components/ui/Button";
import FollowButton from "@/components/features/user/FollowButton";
import MuteButton from "@/components/features/user/MuteButton";
import { followUser, unfollowUser } from "@/lib/appwrite/serverConfig";
import { useTheme } from "@/lib/theme/ThemeContext";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
import { muteUser, unmuteUser } from "@/lib/appwrite/serverConfig";
import { getActorByUserId } from "@/lib/appwrite/database";
/**
 * ユーザープロフィール画面！✨
 * かわいいデザインでユーザーの情報と投稿を表示するよ！💖
 */
export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<Actor | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // ユーザー情報を取得
        const response = await fetch(`/api/users/${params.user}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }).then(res => res.json() as Promise<Actor>);
        
        if (response.$id) {
          setUser(response);

          const currentUser = await getLoggedInUser()
          const currentUserActor = await getActorByUserId(currentUser.$id);
          if(currentUser===null){
            setIsOwnProfile(false);
          }else{
            if(currentUser.name === params.user){
              setIsOwnProfile(true);
            }
          }
          if(currentUserActor?.mutedUsers?.includes(response.actorId)){
            setIsMuted(true);
          }else{
            setIsMuted(false);
          }
          if(response.followers?.includes(`https://${process.env.NEXT_PUBLIC_APPWRITE_DOMAIN}/v1/users/${currentUser.name}`)){
            setIsFollowing(true);
          }else{
            setIsFollowing(false);
          }
        // ユーザーの投稿を取得
        const userPosts = await getUserPosts(params.user as string);
        setPosts(Array.isArray(userPosts) ? userPosts : []);
      }} catch (error) {
        console.error("ユーザー投稿の取得に失敗したわ！", error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [params.user]);


  const handleFollow = async (userId: string) => {
    try {
      await followUser(userId);
      setIsFollowing(true);
    } catch (error) {
      console.error("フォローに失敗したわ！", error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(userId);
      setIsFollowing(false);
    } catch (error) {
      console.error("フォロー解除に失敗したわ！", error);
    }
  };

  const handleMute = async (userId: string) => {
    try {
      await muteUser(userId);
      setIsMuted(true);
    } catch (error) {
      console.error("ミュートに失敗したわ！", error);
    }
  };

  const handleUnmute = async (userId: string) => {
    try {
      await unmuteUser(userId);
      setIsMuted(false);
    } catch (error) {
      console.error("ミュート解除に失敗したわ！", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">ユーザーが見つからないわ！💦</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* プロフィールヘッダー */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center space-x-6">
          <Avatar
            src={user.avatarUrl}
            alt={user.displayName || user.preferredUsername}
            fallback={(user.displayName || user.preferredUsername || "U").charAt(0)}
            size="lg"
            variant="outline"
            className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {user.displayName || user.preferredUsername}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              @{user.preferredUsername}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {posts.length}件の投稿 ✨
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {isOwnProfile ? (
              <Button onClick={() => router.push("/settings/profile")}>
                プロフィール編集 ✨
              </Button>
            ) : (
              <>
                <FollowButton
                  userId={user.actorId}
                  isFollowing={isFollowing}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                />
                <MuteButton
                  userId={user.actorId}
                  username={user.displayName || user.preferredUsername}
                  isMuted={isMuted}
                  onMute={handleMute}
                  onUnmute={handleUnmute}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 投稿一覧 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          投稿一覧 💫
        </h2>
        {posts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            まだ投稿がないわ！💦
          </p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.$id} post={post} />
          ))
        )}
      </div>
    </div>
  );
} 