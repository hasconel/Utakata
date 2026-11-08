"use client";

import { useState } from "react";
import { Loader2, UserCheck, UserPlus } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  isFollowing: string | false;
  onFollow: (userId: string) => Promise<void>;
  onUnfollow: (userId: string) => Promise<void>;
}

/**
 * フォローボタン🫧 アイコンだけ。
 * フォローしていないときは塗りつぶし（押してほしい）、フォロー中は控えめにする。
 */
export default function FollowButton({ userId, isFollowing, onFollow, onUnfollow }: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) await onUnfollow(isFollowing);
      else await onFollow(userId);
    } finally {
      setIsLoading(false);
    }
  };

  const label = isFollowing ? "フォロー中（押すと解除）" : "フォローする";
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={!!isFollowing}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-60 ${
        isFollowing
          ? "border border-border bg-card text-primary hover:bg-accent"
          : "bg-primary text-primary-foreground hover:bg-primary-hover"
      }`}
    >
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isFollowing ? <UserCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
    </button>
  );
}
