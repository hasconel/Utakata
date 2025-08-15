"use client";

import {  useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import PostCard from "@/components/features/post/card/PostCard";
import { Button } from "@/components/ui/Button";
import FollowButton from "@/components/features/user/FollowButton";
import MuteButton from "@/components/features/user/MuteButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { muteUser, unmuteUser, getUserPostCount, followUser, unfollowUser } from "@/lib/appwrite/serverConfig";
import { ActivityPubImage } from "@/types/activitypub/collections";
import ImageModalContent from "@/components/features/post/modal/ImageModalContent";
import { useActor } from "@/hooks/useActor";

/**
 * ユーザープロフィール画面！✨
 * かわいいデザインでユーザーの情報と投稿を表示するよ！💖
 */
export default function UserProfileClient({ userParam }: { userParam: string }) {
  
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { getActor, isLoading: isActorLoading } = useActor();
  const [targetActor, setTargetActor] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<string|false>(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<ActivityPubImage[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [offset, setOffset] = useState<number>(10);
  const [fetchMore, setFetchMore] = useState(false);
  const [postCount, setPostCount] = useState<number>(0);

  useEffect(() => {
    if(!userParam.startsWith("%40")){
      router.push(`/`);
    }
    const userParams = userParam.split("%40");
    // ユーザー名がない場合
    if(userParams.length === 1){
      router.push(`/`);
    }
    // ユーザー名が2つの場合
    if(userParams.length === 2){
      const actorName = userParams[1];
      // ドメインからhttps://を削除してポート番号も削除
      const domain = process.env.NEXT_PUBLIC_DOMAIN?.replace(/https?:\/\//, "").replace(/\/$/, "").replace(/:\d+/, "");
      //console.log(domain);
      const actor = fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/.well-known/webfinger?resource=${encodeURIComponent(`acct:${actorName}@${domain}`)}`,{
        method: "GET",
        headers: {
          "Content-Type": "application/activity+json",
          "Accept": "application/activity+json",
        },
      }).then((res) => res.json()).then((res) => {
        const actor = getActor(res.links.find((link: any) => link.rel === "self")?.href).then((res)=>setTargetActor(res.actor));
        if(!actor){
          router.push(`/`);
        }
      });
      if(!actor){
        router.push(`/`);
      }
    }
    // ユーザー名が3つの場合
    if(userParams.length === 3){
      const domain = userParams[2];
      const actorName = userParams[1];
      const actorId = fetch(`/api/webfinger?resource=${encodeURIComponent(`acct:${actorName}@${domain}`)}&domain=${domain}`,{
        method: "GET",
        headers: {
          "Content-Type": "application/activity+json",
          "Accept": "application/activity+json",
        },
      }).then((res) => res.json()).then((res) => {
        const actor = getActor(res.links.find((link: any) => link.rel === "self")?.href).then((res)=>{
          setTargetActor(res.actor);
        });
        if(!actor){
          router.push(`/`);
        }
      });
      if(!actorId){}
    }
  },[userParam])
  useEffect(() => {
    if(targetActor && user){
    if(targetActor?.id===`${process.env.NEXT_PUBLIC_DOMAIN}/users/${user?.$id}`){
      setIsOwnProfile(true);
    }else{
    fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/users/${user?.$id}/following?target=${encodeURIComponent(targetActor?.id)}`,{
      method: "GET",
      headers: {
        "Content-Type": "application/activity+json",
        "Accept": "application/activity+json",
      },
    }).then((res) => res.json()).then((res) => {
      setIsFollowing(res.id);
      //console.log("response",res);
    });}
  if(targetActor?.id.startsWith(process.env.NEXT_PUBLIC_DOMAIN)){
    getUserPostCount(targetActor?.id).then((res) => setPostCount(res));
  }
  }
  },[user,targetActor])
  const fetchPosts = async (offset: number) => {
    if(targetActor){
      fetch(`/api/posts?attributedTo=${encodeURIComponent(targetActor?.id)}&limit=10&offset=${offset}`,{
        method: "GET",
        headers: {
          "Content-Type": "application/activity+json",
          "Accept": "application/activity+json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0" 
        },
      }).then((res) => res.json()).then((res) => {
        const newPosts = res.notes.filter((post: any) => !posts.some((p: any) => p.id === post.id)).map((post: any) => ({
          ...post,
          published: post.published || new Date().toISOString(),
        }));
        const sortedPosts = newPosts.sort((a: any, b: any) => new Date(b.published).getTime() - new Date(a.published).getTime());
        setPosts([...posts, ...sortedPosts]);
        //console.log("res.total",res.total);
        //console.log("offset",offset);
        //console.log("res.notes.length",res.notes.length);
        setFetchMore(res.total > offset + res.notes.length);
      });
    }
  }
  useEffect(() => {
      if(targetActor){
        fetchPosts(0);
    }
  },[targetActor])
  const handleLoadMore = async () => {
    fetchPosts(offset);
    setOffset(offset + 10);
  }

  const handleFollow = async (userId: string) => {
    try {
      const response = await followUser(userId);
      setIsFollowing(response);
    } catch (error) {
      console.error("フォローに失敗したわ！", error);
    }
  };

  const handleUnfollow = async (activityId: string) => {
    try {
      const response = await unfollowUser(activityId);
      if(response){
        setIsFollowing(false);
      }
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

  if (isActorLoading||isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

    if (!targetActor) {
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
            src={`/api/image?url=${encodeURIComponent(targetActor?.icon?.url ?? "")}`}
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
              {postCount}件の投稿 ✨
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
                  userId={targetActor?.id || ""}
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
          posts.map((post, index) => (
            <PostCard 
              key={`${post.id}-${index}`} 
              post={post}  
              setIsModalOpen={setIsModalOpen} 
              isModalOpen={isModalOpen} 
              setModalImages={setModalImages} 
              setModalIndex={setModalIndex} 
            />
          ))
        )}
        {fetchMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => handleLoadMore()}
              className="px-6 py-3 rounded-full text-white font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
            >
              <span className="flex items-center">
                <span className="mr-2">✨</span>
                もっと見る
              </span>
            </button>
          </div>
          )} 
      </div>

    </div></>
  );
} 