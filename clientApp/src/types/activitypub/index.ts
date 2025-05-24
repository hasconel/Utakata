/**
 * ActivityPubの基本型定義！✨
 */

/**
 * ActivityPubのActor型！ユーザーやボットを表現！👤
 */
export interface Actor {
  "@context": string | string[];
  id: string;
  type: "Person" | "Service" | "Application";
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

/**
 * ActivityPubのActivity型！アクションを表現！🎭
 */
export interface Activity {
  "@context": string | string[];
  id: string;
  type: string;
  actor: string;
  object: string | object;
  to?: string[];
  cc?: string[];
  published?: string;
}

/**
 * ActivityPubのObject型！投稿やメッセージを表現！📝
 */
export interface Object {
  "@context": string | string[];
  id: string;
  type: string;
  content: string;
  attributedTo: string;
  to?: string[];
  cc?: string[];
  published?: string;
}

/**
 * ActivityPubの署名関連の型！セキュリティを確保！🔒
 */
export interface Signature {
  keyId: string;
  algorithm: string;
  headers: string[];
  signature: string;
} 