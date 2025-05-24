/**
 * 投稿の型定義！✨
 * 投稿のデータ構造をキラキラに定義するよ！💖
 */
export interface Post  {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  content: string;
  username: string;
  activityId: string;
  to: string;
  cc: string[];
  published: string;
  inReplyTo: string | null;
  replyCount: number;
  attributedTo: string;
  attachment: string[];
  LikedActors?: string[];
  avatar?: string;
  canDelete: boolean;
  isLiked: boolean;
}

/**
 * 通知の型定義！✨
 * 通知のデータ構造をキラキラに定義するよ！💖
 */
export interface Notification{
  $id:string;
  $createdAt:string;
  $updatedAt:string;
  type:string;//like,follow,reply,mention
  from:string;//アクターID
  to:string;//アクターID
  target:string;//投稿ID
  message?:string;//メッセージ
  read:boolean;//既読かどうか
}