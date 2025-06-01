/**
 * 投稿の型定義！✨
 * 投稿のデータ構造をキラキラに定義するよ！💖
 */

// 基本的な投稿の型！✨
export interface BasePost {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  content: string;
  username: string;
  published: string;
  avatar?: string;
}

// アクティビティ関連の型！✨
export interface ActivityPost extends BasePost {
  activityId: string;
  to: string;
  cc: string[];
  inReplyTo: string | null;
  replyCount: number;
  attributedTo: string;
}

// 添付ファイル関連の型！✨
export interface AttachmentPost extends ActivityPost {
  attachment: string[];
}

// いいね関連の型！✨
export interface LikePost extends AttachmentPost {
  LikedActors?: string[];
  isLiked: boolean;
}

// 削除権限関連の型！✨
export interface Post extends LikePost {
  canDelete: boolean;
}

/**
 * 通知の型定義！✨
 * 通知のデータ構造をキラキラに定義するよ！💖
 */
export interface Notification {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  type: string; // like, follow, reply, mention
  from: string; // アクターID
  to: string; // アクターID
  target: string; // 投稿ID
  message?: string; // メッセージ
  read: boolean; // 既読かどうか
} 