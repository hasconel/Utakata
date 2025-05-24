"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollow: (userId: string) => Promise<void>;
  onUnfollow: (userId: string) => Promise<void>;
}

/**
 * フォローボタンコンポーネント！✨
 * フォロー/フォロー解除をかわいく実装するよ！💖
 */
export default function FollowButton({ userId, isFollowing, onFollow, onUnfollow }: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow(userId);
      } else {
        await onFollow(userId);
      }
    } catch (error) {
      console.error("フォロー操作に失敗したよ！💦", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "primary"}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={isFollowing ? "text-gray-500 hover:text-gray-700" : ""}
    >
      {isLoading ? (
        <span className="flex items-center">
          <span className="animate-spin mr-2">💫</span>
          処理中...
        </span>
      ) : isFollowing ? (
        <span className="flex items-center">
          <span className="mr-2">👋</span>
          フォロー解除
        </span>
      ) : (
        <span className="flex items-center">
          <span className="mr-2">✨</span>
          フォローする
        </span>
      )}
    </Button>
  );
} 