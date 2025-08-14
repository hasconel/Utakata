/**
 * 投稿の型定義！✨
 * 投稿のデータ構造をキラキラに定義するよ！💖
 */

// 基本的な投稿の型！✨
export interface Post {
  id: string;
  "@context": string[];
  type: string;
  summary?: string;
  content: string;
  published: string;
  attributedTo: string;
  inReplyTo: string | null;
  to: string[];
  cc: string[];
  attachment?: string[];
  tag?: string[];
  replies?: {
    "@context": string[];
    id: string;
    type: string;
    content: string;
  }[];
}

/**
 * 通知の型定義！✨
 * 通知のデータ構造をキラキラに定義するよ！💖
 */
export interface Notification {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  type: string; // Like, Follow, Reply, Mention
  from: string; // アクターID
  to: string; // アクターID
  target: string; // 投稿ID
  read: boolean; // 既読かどうか
  id: string; // 投稿ID
} 