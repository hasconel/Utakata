/**
 * 投稿の基本型！✨
 * 投稿の内容を定義するよ！💖
 */
export interface Post {
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
}

/**
 * 投稿入力の型！✨
 * 投稿作成時の入力値を定義するよ！💖
 */
export interface PostInput {
  content: string;
  visibility: "public" | "followers";
  inReplyTo?: string;
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
} 