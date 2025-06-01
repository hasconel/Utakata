/**
 * サーバーサイドのAPI設定ファイル！✨
 * Appwriteのサーバーサイド設定をキラキラに管理するよ！💖
 */

import { Client, Databases, Account, Storage, Users } from "node-appwrite";
import { cookies } from "next/headers";

// クライアント設定！✨
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// セッションクライアントを作成！✨
export async function createSessionClient() {
  try {
    const session = cookies().get("my-custom-session");
    if (!session?.value) throw new Error("セッションが見つからないよ！💦");
    client.setSession(session.value);
    return {
      account: new Account(client),
      databases: new Databases(client),
      storage: new Storage(client),
    };
  } catch (error) {
    throw error;
  }
}

// 管理者クライアントを作成！✨
export async function createAdminClient() {
  const adminClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return {
    account: new Account(adminClient),
    databases: new Databases(adminClient),
    users: new Users(adminClient),
  };
} 