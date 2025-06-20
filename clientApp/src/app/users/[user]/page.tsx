"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Post } from "@/lib/appwrite/posts";
import PostCard from "@/components/features/post/card/PostCard";
import { getUserPosts } from "@/lib/appwrite/client";
import { Button } from "@/components/ui/Button";
import FollowButton from "@/components/features/user/FollowButton";
import MuteButton from "@/components/features/user/MuteButton";
import { followUser, unfollowUser } from "@/lib/appwrite/serverConfig";
import { useAuth } from "@/hooks/auth/useAuth";
import { muteUser, unmuteUser } from "@/lib/appwrite/serverConfig";
import { getActorByUserId } from "@/lib/appwrite/database";
import { ActivityPubImage } from "@/types/activitypub/collections";
import ImageModalContent from "@/components/features/post/modal/ImageModalContent";

/**
 * ユーザープロフィール画面！✨
 * かわいいデザインでユーザーの情報と投稿を表示するよ！💖
 */
export default function UserProfile({ params }: { params: { user: string } }) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [targetActor, setTargetActor] = useState<any | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<ActivityPubImage[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // ユーザー情報を取得
        const response = await fetch(`/api/users/${params.user}`, {
          method: "GET",
          headers: {
            "Accept": "application/activity+json",
          },
        }).then(res => res.json());
        if (response.id) {
          setTargetActor(response);

          if (!user && !isAuthLoading) {
            setIsOwnProfile(false);
          } else {
            if (user && !isAuthLoading) {
              const currentUserActor = await getActorByUserId(user.$id);
              setIsOwnProfile(user.name === params.user);
              setIsMuted(currentUserActor?.mutedUsers?.includes(response.actorId) ?? false);
              
              // followersが配列の場合はincludesを使用、そうでない場合はfalseを設定！✨
              const isFollowingUser = Array.isArray(response.followersList) 
                ? response.followersList.includes(`https://${process.env.NEXT_PUBLIC_DOMAIN}/users/${user.name}`)
                : false;
              setIsFollowing(isFollowingUser);
            }
          }
          // ユーザーの投稿を取得
          const userPosts = await getUserPosts(params.user as string);
          //console.log("userPosts", userPosts);
          setPosts(Array.isArray(userPosts) ? userPosts : []);
        }
        
      } catch (error) {
        console.error("ユーザー投稿の取得に失敗したわ！", error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [params.user,user,isAuthLoading]);


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
  return (<>
    <div className="bg-cover bg-center z-[-1] absolute inset-0 w-full h-full bg-fixed" style={{backgroundImage: `url(${targetActor?.image?.url})`}}/>
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* プロフィールヘッダー */}
      <div className="bg-gradient-to-br from-purple-50/90 to-pink-50/90 dark:from-gray-800/90 dark:to-gray-900/90 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center space-x-6 flex-col sm:flex-row">
          <Avatar
            src={targetActor?.icon?.url}
            alt={targetActor?.name || targetActor?.preferredUsername}
            fallback={(targetActor?.name || targetActor?.preferredUsername || "U").charAt(0)}
            size="2xl"
            variant="outline"
            className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {targetActor?.name || targetActor?.preferredUsername}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              @{targetActor?.preferredUsername}
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
                  userId={targetActor?.actorId ?? ""}
                  isFollowing={isFollowing}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                />
                <MuteButton
                  userId={targetActor?.actorId ?? ""}
                  username={targetActor?.name || targetActor?.preferredUsername || ""}
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-br from-purple-50/90 to-pink-50/90 dark:from-gray-800/90 dark:to-gray-900/90 rounded-2xl px-2 py-4 shadow-lg">
          投稿一覧 💫
        </h2>
        {isModalOpen && (
        <div>
          <ImageModalContent imagesTable={modalImages} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} index={modalIndex} />
        </div>
      )}
        {posts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            まだ投稿がないわ！💦
          </p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.$id} post={post}  setIsModalOpen={setIsModalOpen} isModalOpen={isModalOpen} setModalImages={setModalImages} setModalIndex={setModalIndex} />
          ))
        )}
      </div>

    </div></>
  );
} 