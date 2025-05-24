/**
 * Appwrite関連の型定義！✨
 */

/**
 * ユーザー型！アプリケーションのユーザーを表現！👤
 */
export interface User {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  registration: string;
  status: boolean;
  labels: string[];
  passwordUpdate: string;
  email: string;
  phone: string;
  emailVerification: boolean;
  phoneVerification: boolean;
  prefs: Record<string, any>;
}

/**
 * 投稿型！ユーザーの投稿を表現！📝
 */
export interface Post {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  content: string;
  userId: string;
  visibility: "public" | "followers" | "private";
  attachments?: string[];
  likes?: string[];
  replies?: string[];
}
/**
 * フォロー関係型！ユーザー間の関係を表現！🤝
 */
export interface Follow {
  $id: string;
  $createdAt: string;
  followerId: string;
  followingId: string;
  status: "pending" | "accepted" | "rejected";
} 

