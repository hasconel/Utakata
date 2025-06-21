
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
  
  /**
 * ActivityPubの型定義！✨
 * Noteとアクティビティを型安全に！💎
 */
  /**
 * ActivityPubの型定義！✨
 * ActivityPub仕様（https://www.w3.org/TR/activitypub/）に基づくキラキラ型！💖
 */
export interface ActivityPubActor {
    "@context": string | string[];
    id: string; // 例：https://domain/users/alice
    type: string; // 例："Person"
    preferredUsername: string;
    name?: string; // displayName相当
    inbox: string; // 例：https://domain/users/alice/inbox
    outbox: string; // 例：https://domain/users/alice/outbox
    followers: string; // 例：https://domain/users/alice/followers
    publicKey: {
      id: string; // 例：https://domain/users/alice#main-key
      owner: string;
      publicKeyPem: string;
    };
  }
  
  export interface ActivityPubNote {
    "@context": string | string[];
    id: string;
    type: "Note";
    content: string;
    attributedTo: string;
    to: string | string[];
    cc?: string | string[];
    published: string;
    inReplyTo?: string;
  }

  export interface ActivityPubActivity {
    "@context": string | string[];
    summary?: string;
    type: 
    "Accept"|
    "Add"|
    "Announce"|
    "Arrive"|
    "Block"|
    "Create"|
    "Delete"|
    "Dislike"|
    "Flag"|
    "Follow"|
    "Ignore"|
    "Invite"|
    "Join"|
    "Leave"|
    "Like"|
    "Listen"|
    "Move"|
    "Offer"|
    "Reject"|
    "Read"|
    "Remove"|
    "TentativeReject"|
    "TentativeAccept"|
    "Travel"|
    "Undo"|
    "Update"|
    "View";
    actor: string;
    object:string;
  }