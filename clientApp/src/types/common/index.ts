/**
 * 共通の型定義！✨
 * アプリケーション全体で使う型を定義するよ！💖
 */

/**
 * 投稿の基本型！✨
 * 投稿の内容を定義するよ！💖
 */
export interface BasePost {
  $id: string;
  $createdAt: string;
  content: string;
  username: string;
  avatar?: string;
  inReplyTo?: string;
  replyCount: number;
  attachment?: string[];
  activityId: string;
  to: string;
  cc: string[];
  published: string;
  attributedTo: string;
  canDelete?: boolean;
  isLiked?: boolean;
  LikedActors?: string[];
}

/**
 * 画像の型！✨
 * 投稿に添付する画像を定義するよ！💖
 */
export interface Image {
  url: string;
  name: string;
  mediaType: string;
  width?: number;
  height?: number;
  blurhash?: string;
  bin?: string;
}

/**
 * フォームの状態型！✨
 * フォームの状態を表現するよ！💖
 */
export interface FormState {
  isLoading: boolean;
  error?: string;
  success?: string;
}

/**
 * アラートメッセージ型！✨
 * ユーザーへの通知を表現するよ！💖
 */
export interface AlertMessage {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
} 