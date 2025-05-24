"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/Avatar";
import { getLoggedInUser} from "@/lib/appwrite/serverConfig";
import { getActorByUserId } from "@/lib/appwrite/database";
import { Actor } from "@/lib/appwrite/database";
import { uploadImage, updateProfile } from "@/lib/appwrite/serverConfig";
export default function ProfileSettings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Actor | null>(null);
  const [avatarFormData, setAvatarFormData] = useState({
    displayName: "",
    bio: "",
    avatar: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        const session = await getLoggedInUser();
        const actor = await getActorByUserId(session.$id);
        if (actor) {
          setUser(actor);
          setAvatarFormData(prev => ({
            ...prev,
            displayName: actor.displayName || "",
            bio: actor.bio || "",
          }));
        }
      } catch (error) {
        handleError();
      } finally {
        handleLoad();
      }
    };

    fetchUserData();
  }, [handleLoad, handleError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log(avatarFormData);

    try {

      let uploadProfile ={
        displayName: "",
        bio: "",
        avatarUrl: ""
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
        const avatarUrl = await uploadImage(avatarBase64);
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

      await updateProfile(uploadProfile.displayName, uploadProfile.bio, uploadProfile.avatarUrl);
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
      setPreviewUrl(url);
    }
  };

  // コンポーネントのアンマウント時にURLを解放
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
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
        <div className="flex flex-col items-center space-y-4 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
          <div className="relative group">
            <Avatar
              src={previewUrl || user?.avatarUrl}
              alt={user?.displayName || ""}
              fallback={(user?.displayName || "U").charAt(0)}
              size="lg"
              className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 ring-4 ring-purple-200 dark:ring-purple-800 transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-white text-sm font-medium">クリックして変更！✨</span>
            </div>
          </div>
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
              プロフィール画像を選んでね！✨
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-3 file:px-6
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-100 file:text-purple-700
                hover:file:bg-purple-200
                dark:file:bg-purple-800 dark:file:text-purple-300
                transition-all duration-200"
            />
          </div>
        </div>

        {/* 表示名 */}
        <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
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
        <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
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
    </div>
  );
}