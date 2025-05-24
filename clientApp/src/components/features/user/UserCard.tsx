"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

interface UserCardProps {
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * ユーザーカードコンポーネント！✨
 * ユーザー情報をかわいく表示するよ！💖
 */
export function UserCard({ username, displayName, avatarUrl }: UserCardProps) {
  return (
    <Link href={`/${username}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
      <Avatar src={avatarUrl} alt={displayName} size="sm" />
      <div>
        <p className="font-medium">{displayName || username}</p>
        <p className="text-sm text-gray-500">@{username}</p>
      </div>
    </Link>
  );
} 