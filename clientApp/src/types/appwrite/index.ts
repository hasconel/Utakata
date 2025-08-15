
import { Models } from "node-appwrite";

export interface Actor extends Models.Document {
  userId: string;
  preferredUsername: string;
  actorId: string;
  publicKey: string;
  privateKey: string;
  displayName?: string;
  mutedUsers?: string[];
  avatarUrl?: string;
  backgroundUrl?: string;
  bio?: string;
  userUrl?: string;
}

export interface Follow extends Models.Document {
  object: string;
  actor: string;
  id: string;
}

export interface Like extends Models.Document {
  object: string;
  actor: string;
  id: string;
}

export interface Notification extends Models.Document {
  type: string;
  from: string;
  to: string;
  target?: string;
  read: boolean;
  id: string;
}

export interface Post extends Models.Document {
  content: string;
  username: string;
  activityId: string;
  published: string;
  inReplyTo?: string;
  attributedTo?: string;
  attachment?: string[];
  avatar?: string;
  raw?: string;
  to?: string[];
  cc?: string[];
  deleted?: boolean;
}

export interface ActorSub extends Models.Document {
  followersCount: number;
  followingCount: number;
  id: string;
}

export interface PostSub extends Models.Document {
  repliesCount?: number;
  likedActors?: string[];
  activityId: string;
  likeCount?: number;
}