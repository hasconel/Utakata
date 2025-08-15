/**
 * ActivityPubの基本型定義！✨
 */

export interface ActivityPubObject {
  "@context": string | string[];
  id: string;
  type: string;
}

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

export interface ActivityPubNote extends ActivityPubObject {
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": string,
  "attributedTo":  string,
  "content": string,
  "published": string,
  "url": string,
  "to": string[],
  "cc": string[],
  "inReplyTo": string,
  "attachment": string[],
  "likes": {
    "totalItems": number,
    "first": string,
    "last": string,
  },
  "replies": {
    "totalItems": number,
    "first": string,
    "last": string,
  },
  "repost": {
    "totalItems": number,
    "first": string,
    "last": string,
  },
  "_isLiked": boolean,
  _user?: {
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "Person",
    "id": string,
    "preferredUsername": string,
    "displayName": string,
    "followers": string,
    "following": string,
    "inbox": string,
    "outbox": string,
    "publicKey": {
      "id": string,
      "owner": string,
      "publicKeyPem": string,
    },
    "icon":{
      "type": "Image",
      "url": string,
    }
  };
}

export interface ActivityPubCollection extends ActivityPubObject {
  type: "Collection" | "OrderedCollection";
  totalItems: number;
  items?: any[];
  orderedItems?: any[];
}

export interface ActivityPubCollectionPage extends ActivityPubObject {
  type: "CollectionPage" | "OrderedCollectionPage";
  partOf: string;
  totalItems: number;
  items?: any[];
  orderedItems?: any[];
  next?: string;
  prev?: string;
}

export interface ActivityPubActivity extends ActivityPubObject {
  type: "Create" | "Update" | "Delete" | "Follow" | "Accept" | "Reject" | "Like" | "Announce" | "Undo";
  actor: string;
  object: string | ActivityPubObject;
  target?: string;
  published: string;
  to?: string[];
  cc?: string[];
}

export interface ActivityPubLike extends ActivityPubActivity {
  type: "Like";
  actor: string;
  object: string;
}

export interface ActivityPubUndo extends ActivityPubActivity {
  type: "Undo";
  object: ActivityPubLike;
}

export interface ActivityPubFollow extends ActivityPubActivity {
  type: "Follow";
  actor: string;
  object: string;
}

export interface ActivityPubAccept extends ActivityPubActivity {
  type: "Accept";
  actor: string;
  object: ActivityPubFollow;
}

export interface ActivityPubReject extends ActivityPubActivity {
  type: "Reject";
  actor: string;
  object: ActivityPubFollow;
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