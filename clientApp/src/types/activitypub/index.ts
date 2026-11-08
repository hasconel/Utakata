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
  /** 表示名・自己紹介のカスタム絵文字（{name,url} のJSON文字列） */
  emojis?: string[];
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
  /** 閲覧注意（CW）の説明文。あれば本文と画像は最初たたんでおく */
  summary?: string,
  /** カスタム絵文字（JSON文字列 {name,url}） */
  emojis?: string[],
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
  /** ブースト（Announce）したアクティビティのコレクション */
  shares?: {
    totalItems: number,
    first?: string,
    last?: string,
  } | string,
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
  /** 閲覧者がブースト済みか */
  _isShared?: boolean,
  /** タイムラインでブーストとして出すとき、ブーストした人 */
  _boostedBy?: ActivityPubActor | null,
  /** ブーストした時刻 */
  _boostedAt?: string,
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