/**
 * ActivityPubのコレクション型定義！✨
 * データベースのスキーマを型安全に！💎
 */

export interface CreateActivity {
  "@context": string;
  id: string;
  type: "Create";
  actor: string;
  published: string;
  to: string | string[];
  cc: string | string[];
  object: ActivityPubNote;
}

export interface ActivityPubActor {
  "@context": string | string[];
  id: string; // 例：https://domain/users/alice
  type: string; // 例："Person"
  preferredUsername: string;
  name?: string; // displayName相当
  inbox: string; // 例：https://domain/users/alice/inbox
  outbox: string; // 例：https://domain/users/alice/outbox
  followers: string; // 例：https://domain/users/alice/followers
  following: string; // 例：https://domain/users/alice/following
  publicKey: {
    id: string; // 例：https://domain/users/alice#main-key
    owner: string;
    publicKeyPem: string;
  };
}

export interface ActivityPubImage {
  type: "Image"|"Video"|"Audio";
  mediaType: string;
  url: string;
  name: string;
  width?: number;
  height?: number;
  blurhash?: string;
}

export interface ActivityPubNote {
  "@context": string | string[];
  id: string;
  type: "Note";
  content: string;
  summary?: string; // 投稿の要約
  attributedTo: string;
  to: string | string[];
  cc?: string | string[];
  published: string;
  inReplyTo?: string;
  sensitive?: boolean; // NSFWフラグ
  attachment?: ActivityPubImage[];
} 