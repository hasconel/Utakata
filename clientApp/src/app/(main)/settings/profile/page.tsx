"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/auth/useAuth";
import { getActorByUserId } from "@/lib/appwrite/database";
import { Actor } from "@/lib/appwrite/database";
import {  updateProfile } from "@/lib/appwrite/serverConfig";
import { X } from "lucide-react";

/**
画像のアップロード
@param buffer 背景画像のバイナリデータ
@param fileName 背景画像のファイル名
@param type 背景画像のファイルのMIMEタイプ
@returns 背景画像のURL
*/
async function uploadImage(buffer: string,fileName: string,type: string) {
  try {
    const uploadFile = await fetch("/api/files",{
      method: "POST",
      body: JSON.stringify({
        file: {
          bin: buffer,
          name: fileName,
          type: type,
          width: 0,
          height: 0,
          blurhash: ""
        }
      })
    })
    const url = (await uploadFile.json()).url;
    return url;
  } catch (error) {
    console.error("画像のアップロードに失敗したわ！💦", error);
    return false;
  }
}


export default function ProfileSettings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [actor, setActor] = useState<Actor | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  useEffect(() => {
    if (!user && !isAuthLoading) {
      window.location.href = "/login";
    }
  }, [user, isAuthLoading]);
  const [avatarFormData, setAvatarFormData] = useState({
    displayName: "",
    bio: "",
    avatar: null as File | null,
    background: null as File | null | "", // 背景画像のファイル""は削除のためのもの
  });
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string | null>(null);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    console.error("ユーザー情報の取得に失敗したわ！💦");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user && !isAuthLoading) {
          const actor = await getActorByUserId(user.$id);
          if(actor){
            setActor(actor);
          setAvatarFormData(prev => ({
            ...prev,
            displayName: actor.displayName || "",
            bio: actor.bio || "",
          }));
          }
        }
      } catch (error) {
        handleError();
      } finally {
        handleLoad();
      }
    };

    fetchUserData();
  }, [handleLoad, handleError, user, isAuthLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {

      let uploadProfile ={
        displayName: "",
        bio: "",
        avatarUrl: "",
        backgroundUrl: ""
      }
      // アバターがあればBase64に変換
      if (avatarFormData.avatar) {
        const avatarFormData2 = new FormData();
        avatarFormData2.append("avatar", avatarFormData.avatar);
        const image = new Image();
        image.src = URL.createObjectURL(avatarFormData.avatar);
        const arrayBuffer = await avatarFormData.avatar.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const avatarBase64 = base64;
        const avatarUrl = await uploadImage(avatarBase64,avatarFormData.avatar.name,avatarFormData.avatar.type);
        if (avatarUrl) {
          uploadProfile.avatarUrl = avatarUrl;
        }
      }
      if(avatarFormData.displayName){
        uploadProfile.displayName = avatarFormData.displayName;
      }
      if(avatarFormData.bio){
        uploadProfile.bio = avatarFormData.bio;
      }
      if(avatarFormData.background){
        if(typeof avatarFormData.background === "string" && avatarFormData.background === ""){
          uploadProfile.backgroundUrl = "";
        }else if(avatarFormData.background instanceof File){
        const backgroundFormData2 = new FormData();
        backgroundFormData2.append("background", avatarFormData.background);
        const image = new Image();
        image.src = URL.createObjectURL(avatarFormData.background);
        const arrayBuffer = await avatarFormData.background.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const backgroundBase64 = base64;
        const backgroundUrl = await uploadImage(backgroundBase64,avatarFormData.background.name,avatarFormData.background.type);
        if (backgroundUrl) {
          uploadProfile.backgroundUrl = backgroundUrl;
        }
        }
      }

      await updateProfile(uploadProfile.displayName, uploadProfile.bio, uploadProfile.avatarUrl, uploadProfile.backgroundUrl);
      router.push("/settings/profile");
      router.refresh();
    } catch (error) {
      console.error("プロフィール更新に失敗したわ！💦", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFormData(prev => ({
        ...prev,
        avatar: file,
      }));
      
      // プレビューURLを作成
      const url = URL.createObjectURL(file);
      setAvatarPreviewUrl(url);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFormData(prev => ({
        ...prev,
        background: file,
      }));

      // プレビューURLを作成
      const url = URL.createObjectURL(file);
      setBackgroundPreviewUrl(url);
    }
  };

  // コンポーネントのアンマウント時にURLを解放
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    return () => {
      if (backgroundPreviewUrl) {
        URL.revokeObjectURL(backgroundPreviewUrl);
      }
    };
  }, [backgroundPreviewUrl]);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if(!user && !isAuthLoading){
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  if(!user && isAuthLoading){
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  if(user && isAuthLoading){
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  if(user && !isAuthLoading){
  return (
      <>{actor && (<>

        <div className="w-full h-full bg-cover bg-center z-[-1] bg-fixed absolute top-0 left-0" style={backgroundPreviewUrl !== "" ? {backgroundImage: `url(${backgroundPreviewUrl || actor?.backgroundUrl})`} : {}}/>
        <div className="border border-white dark:border-gray-800 max-w-2xl mx-auto p-6 space-y-8 bg-gradient-to-br from-white/90 via-gray-100/60 to-gray-100/30 dark:from-gray-800/90 dark:via-gray-600/50 dark:to-gray-900/30 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              プロフィール設定 ✨
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              あなたの素敵な一面を見せちゃおう！💖
            </p>
          </div>
    
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* アバター設定 */}
            <div className="flex flex-col items-center space-y-4 p-6 bg-purple-200/50 dark:bg-purple-900/50 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="relative group">
                <Avatar
                  src={avatarPreviewUrl? avatarPreviewUrl : actor?.avatarUrl}
                  alt={actor?.displayName || ""}
                  fallback={(actor?.displayName || "U").charAt(0)}
                  size="lg"
                  className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 ring-4 ring-purple-200 dark:ring-purple-800 transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"   
                onClick={() => {
                  const input = document.getElementById("avatar-input");
                  if (input) {
                    input.click();
                  }
                }}
                >
                  <span className="text-white text-sm font-medium">クリックして変更！✨</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-input"
                /><div className="top-0 right-0 absolute w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center" onClick={() => {
                  setAvatarFormData(prev => ({
                    ...prev,
                    avatar: null,
                  }));
                  setAvatarPreviewUrl(null);
                }}>
                  <X className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="w-full max-w-md relative">
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                  背景画像を選んでね！✨
                </label><div className="flex items-center justify-between">
                <button className="text-sm text-gray-500 bg-purple-300  dark:text-gray-400
                    py-3 px-6 rounded-full border-0 text-sm font-semibold text-purple-700 
                    file:mr-4 file:py-3 file:px-6 mr-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-500 file:text-white
                    dark:file:bg-purple-800 dark:file:text-purple-300
                    transition-all duration-200
                    hover:bg-purple-500 hover:text-white
                    hover:scale-105
                    "
                    onClick={() => {
                      const input = document.getElementById("background-input");
                      if (input) {
                        input.click();
                      }
                    }}
                    type="button"
                    aria-label="背景画像を選んでね！✨"
                    >
                      クリックして変更！✨
                    </button>{avatarFormData.background !== "" && avatarFormData.background !== null && avatarFormData.background?.name}
                <input
                  type="file"
                  accept="image/*"
                  id="background-input"
                  onChange={handleBackgroundChange}
                  className="hidden"
                />
                {avatarFormData.background !== "" && avatarFormData.background !== null && avatarFormData.background?.name &&(

                <div className="w-10 h-10 mr-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center z-10" onClick={() => {
                  setAvatarFormData(prev => ({
                    ...prev,
                    background: null,
                  }));
                  setBackgroundPreviewUrl(null);
                }}>
                  <X className="w-4 h-4 text-white" />
                </div>
                )}</div>

                {actor?.backgroundUrl && (
                  <button className=" bg-black p-2 mt-2 bg-opacity-50 rounded-full flex items-center justify-center z-10 text-white hover:bg-red-500 hover:text-white disabled:hidden" 
                  disabled={!actor.backgroundUrl}
                  onClick={() => {
                    setAvatarFormData(prev => ({
                      ...prev,
                      background: "",
                    }));
                    setBackgroundPreviewUrl("");
                  }}>
                    <X className="w-4 h-4 text-white" />背景画像の削除🗑️
                  </button>
                )}
              </div>
            </div>
    
            {/* 表示名 */}
            <div className="p-6 bg-pink-200/50 dark:bg-pink-900/50 rounded-xl">
              <label className="block text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                表示名 💫
              </label>
              <Input
                type="text"
                value={avatarFormData.displayName}
                onChange={(e) => setAvatarFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="あなたの素敵な名前を教えてね！✨"
                className="w-full bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-800 focus:border-pink-500 dark:focus:border-pink-400"
              />
            </div>
    
            {/* 自己紹介 */}
            <div className="p-6 bg-purple-200/50 dark:bg-purple-900/50 rounded-xl">
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                自己紹介 💝
              </label>
              <Textarea
                value={avatarFormData.bio}
                onChange={(e) => setAvatarFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="あなたのことを教えてね！💖"
                className="w-full bg-white dark:bg-gray-700 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400"
                rows={4}
              />
            </div>
    
            {/* 保存ボタン */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">💫</span>
                    保存中...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">✨</span>
                    保存する
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div></>
    )}
    </>
  );
  }
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500">
        エラーが発生しました！
      </div>
    </div>
  );
}