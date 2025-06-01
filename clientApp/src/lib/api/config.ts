/**
 * API設定ファイル！✨
 * Appwriteの設定をキラキラに管理するよ！💖
 */

import { Client, Databases, Account, Storage } from "node-appwrite";

// クライアント設定！✨
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// データベース設定！✨
export const databases = new Databases(client);

// アカウント設定！✨
export const account = new Account(client);

// ストレージ設定！✨
export const storage = new Storage(client);

// 環境変数の型定義！✨
export const ENV = {
  DATABASE_ID: process.env.APPWRITE_DATABASE_ID!,
  ACTORS_COLLECTION_ID: process.env.APPWRITE_ACTORS_COLLECTION_ID!,
  ACTORS_SUB_COLLECTION_ID: process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
  POSTS_COLLECTION_ID: process.env.APPWRITE_POSTS_COLLECTION_ID!,
  POSTS_SUB_COLLECTION_ID: process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
  NOTIFICATIONS_COLLECTION_ID: process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
  DOMAIN: process.env.APPWRITE_DOMAIN!,
  ENCRYPTION_KEY: process.env.APPWRITE_ENCRYPTION_KEY!,
  ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  STORAGE_ID: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!,
} as const; 