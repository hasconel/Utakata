"use client";

import {  useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import FollowButton from "@/components/features/user/FollowButton";
import { muteUser, unmuteUser } from "@/lib/appwrite/serverConfig";
import MuteButton from "@/components/features/user/MuteButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { getUserPostCount, followUser, unfollowUser } from "@/lib/appwrite/serverConfig";
import { useActor } from "@/hooks/useActor";
import { TimelineContent, LoadMoreButton, EmptyState, FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { useTimelineManager } from "@/hooks/api/useApi";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { getMutedUsers } from "@/lib/appwrite/database";
import { showToast } from "@/components/ui/Toast";

/**
 * ユーザープロフィール画面！✨
 * かわいいデザインでユーザーの情報と投稿を表示するよ！💖
 */
export default function UserProfileClient({ userParam }: { userParam: string }) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { getActor, isLoading: isActorLoading } = useActor();
  const [targetActor, setTargetActor] = useState<any | null>(null);
  const { posts, fetchMore, isLoading, error, handleLoadMore } = useTimelineManager(user?.$id || "", targetActor?.id || "");
  const [isFollowing, setIsFollowing] = useState<string|false>(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
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
      const url = new URL(`${process.env.NEXT_PUBLIC_DOMAIN}/.well-known/webfinger`);
      url.searchParams.set("resource", `acct:${actorName}@${domain}`);
      const actor = fetch(url, {
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
      const url = new URL(`${process.env.NEXT_PUBLIC_DOMAIN}/api/webfinger`);
      url.searchParams.set("resource", `acct:${actorName}@${domain}`);
      url.searchParams.set("domain", domain);
      const actorId = fetch(url, {
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
      const url = new URL(`${process.env.NEXT_PUBLIC_DOMAIN}/users/${user?.$id}/following`);
      url.searchParams.set("target", targetActor?.id);
      fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/activity+json",
        "Accept": "application/activity+json",
      },
    }).then((res) => res.json()).then((res) => {
      setIsFollowing(res.id);
      //console.log("response",res);
    });}
  // 今のミュート状態を読み込む（ミュート一覧にはactorのURLが入っている）
  getMutedUsers()
    .then((muted) => setIsMuted(muted.includes(targetActor?.id)))
    .catch(() => {});
  if(targetActor?.id.startsWith(process.env.NEXT_PUBLIC_DOMAIN)){
    getUserPostCount(targetActor?.id).then((res) => setPostCount(res));
  }
  }
  },[user,targetActor])


  // 失敗したときの戻り値は { error } なので、成功したかを確かめてから表示を変える
  const handleFollow = async (userId: string) => {
    const response = await followUser(userId).catch(() => null);
    if (typeof response === "string") {
      setIsFollowing(response);
    } else {
      showToast("フォローできなかったの…もう一回試してみて💦");
    }
  };

  const handleUnfollow = async (activityId: string) => {
    const response = await unfollowUser(activityId).catch(() => null);
    if (response === true) {
      setIsFollowing(false);
    } else {
      showToast("フォロー解除できなかったの…もう一回試してみて💦");
    }
  };

  const handleMute = async (userId: string) => {
    const response = await muteUser(userId).catch(() => false);
    if (response === true) {
      setIsMuted(true);
    } else {
      showToast("ミュートできなかったの…💦");
    }
  };

  const handleUnmute = async (userId: string) => {
    const response: any = await unmuteUser(userId).catch(() => null);
    if (response && !response.error) {
      setIsMuted(false);
    } else {
      showToast("ミュート解除できなかったの…💦");
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
                  userId={targetActor?.id ?? ""}
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
      {posts.filter((post: any) => post.attributedTo.includes(targetActor?.id)).length > 0 && !isLoading  ? (<>
      <div className={FEED_SURFACE}>
      <TimelineContent 
        isLoading={isLoading} 
        posts={posts.filter((post: any) => post.attributedTo.includes(targetActor?.id))} 
        error={error}
      />
      </div>

      {isLoading && <LoadingSkeleton />}
      {fetchMore && !isLoading && posts.filter((post: any) => post.attributedTo.includes(targetActor?.id)).length > 0 && <LoadMoreButton onLoadMore={handleLoadMore} />}
      </>
      ) : (
        <EmptyState isUser={true} />
      )}
      </div>

    </div></>
  );
} 