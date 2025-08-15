/**
 * ActivityPubの基本型定義！✨
 */

export interface ActivityPubObject {
  "@context": string | string[];
  id: string;
  type: string;
}

/**
 * ActivityPubのActor型！✨
 * 外部に公開するときに使うよ！💖
 */
export interface ActivityPubActor extends ActivityPubObject {
  type: "Person" | "Service" | "Organization";
  preferredUsername: string;
  name?: string;
  displayName?: string;
  summary?: string;
  icon?: {
    type: "Image";
    url: string;
  };
  image?: {
    type: "Image";
    url: string;
  };
  inbox: string;
  outbox: string;
  followers: string;
  following: string;
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}

/**
 * ActivityPubのNote型！✨
 * 外部に公開するときに使うよ！💖
 */
export interface ActivityPubNote extends ActivityPubObject {
  "@context": ["https://www.w3.org/ns/activitystreams"],
  "type": "Note",
  id: string,
  attributedTo:  string,
  content: string,
  published: string,
  url?: string,
  to: string[],
  cc: string[],
  inReplyTo: string ,
  attachment: string[],
  likes?: {
    totalItems: number,
    first: string,
    last: string,
  } | string,
  replies?: {
    totalItems: number,
    first: string,
    last: string,
  } | string,
  repost?: {
    totalItems: number,
    first: string,
    last: string,
  } ,
}

/**
 * ActivityPubのNote型！✨
 * 内部で使うときに使うよ！
 * PostCardとかPostDetailCardのインポートで使うよ！💖
 */
export interface ActivityPubNoteInClient extends ActivityPubNote {
  likes?: {
    totalItems: number,
    first: string,
    last: string,
  } ,
  replies?: {
    totalItems: number,
    first: string,
    last: string,
  } ,
  _isLiked: boolean,
  _user: ActivityPubActor,
  _canDelete: boolean,
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