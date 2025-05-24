"use client";

import { useEffect, useState } from "react";
import { getLoggedInUser,  unmuteUser } from "@/lib/appwrite/serverConfig";
import { redirect } from "next/navigation";
import { UserCard } from "@/components/features/user/UserCard";
import { Button } from "@/components/ui/Button";
import { getActorByUserId, getActorById } from "@/lib/appwrite/database";
import { useTheme } from "@/lib/theme/ThemeContext";
interface User {
  preferredUsername: string;
  displayName?: string;
  avatarUrl?: string;
  actorId: string;
}

/**
 * ミュートリストページ！✨
 * ミュートしたユーザーを管理できるよ！💖
 */
export default function MutesPage() {
  const [mutedUsers, setMutedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const user = await getLoggedInUser();
    setCurrentUserId(user.$id);
    loadMutedUsers(user.$id);
    setIsLoading(false);
  };

  const loadMutedUsers = async (userId?:string) => {
    try {
      if(!userId){
        throw new Error("ユーザーIDが取得できないよ！💦");
      }
      const data = await getActorByUserId(userId);
      const mutedUsers =[];
      for(const actorId of data?.mutedUsers || []){
        const user = await getActorById(actorId);
        if(user){
          mutedUsers.push({
            preferredUsername: user.preferredUsername,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            actorId: user.actorId,
          });
        }
      }
      setMutedUsers(mutedUsers);
    } catch (error) {
      console.error("ミュートリストの取得に失敗したよ！💦", error);
      setError("ミュートリストの取得に失敗したよ！");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnmute = async (userId: string) => {
    try {
      await unmuteUser(userId);
      setMutedUsers(prev => prev.filter(user => user.actorId !== userId));
    } catch (error) {
      console.error("ミュート解除に失敗したよ！💦", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="animate-spin text-2xl">💫</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => loadMutedUsers(currentUserId)}>再読み込み</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ミュートリスト ✨</h1>
      
      {mutedUsers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            ミュートしているユーザーはいないよ！💫
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mutedUsers.map(user => (
            <div
              key={user.actorId}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <UserCard
                username={user.preferredUsername}
                displayName={user.displayName}
                avatarUrl={user.avatarUrl}
              />
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnmute(`${user.actorId}`)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <span className="flex items-center">
                    <span className="mr-2">🔊</span>
                    ミュート解除
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 