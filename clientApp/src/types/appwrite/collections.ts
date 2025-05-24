/**
 * Appwriteコレクションの型定義！✨
 * データベースのスキーマを型安全に！💎
 */

export interface ActorCollection {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  preferredUsername: string;
  name?: string;
  summary?: string;
  inbox: string;
  outbox: string;
  followers?: string;
  following?: string;
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
} 