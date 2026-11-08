/**
 * ユーザー認証アクション！✨
 * ギャルSNSのキラキラ登録とログインをサポート！💖
 */
"use server";
import {  Models,   Query } from "node-appwrite";
import { createAdminClient, createSessionClient, deletePost } from "./serverConfig";
import { cookies } from "next/headers";
import { SESSION_COOKIE, clearSessionCookie } from "@/lib/auth/sessionCookie";
import { deletePrivateKey } from "@/lib/activitypub/privateKeyStore";
import { Actor, Post } from "@/types/appwrite";


/** サーバーアクションの結果。本番ではエラー文が隠されるので、例外は投げずにこの形で返す */
export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * ログイン中のユーザーを返す。ログインしていなければ null（例外は投げない）。
 * クッキーが無いときは Appwrite に問い合わせないので速い。
 */
export async function getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
  if (!(await cookies()).get(SESSION_COOKIE)?.value) return null;
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error: any) {
    if (error?.code === 401) {
      // 期限切れのクッキーは消しておく（残っていると毎回問い合わせてしまう）
      await clearSessionCookie().catch(() => {});
      return null;
    }
    console.error("ログイン状態の確認に失敗:", error?.message);
    return null;
  }
}

/**
 * サインアウト（ログインは /api/auth/login、ログアウトは /api/auth/logout でもできる）
 * Appwrite側の削除に失敗しても、クッキーは必ず消す。
 */
export async function signOut(): Promise<ActionResult> {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession("current");
  } catch (error: any) {
    if (error?.code !== 401) console.error("セッションの削除に失敗:", error?.message);
  }
  await clearSessionCookie();
  return { ok: true };
}

/**
 * メールアドレスの変更
 * @param email 新しいメールアドレス
 * @param password パスワード
 * @returns メールアドレスの変更成功かどうか
 */
export async function changeEmail(email: string, password: string): Promise<ActionResult> {
  try {
    const { account } = await createSessionClient();
    await account.updateEmail(email, password);
    return { ok: true };
  } catch (error: any) {
    if (error?.code === 401) return { ok: false, error: "パスワードが違うわ！💦" };
    if (error?.code === 409) return { ok: false, error: "そのメールアドレスはもう使われてるわ！💦" };
    if (error?.code === 400) return { ok: false, error: "メールアドレスの形が正しくないわ！💦" };
    return { ok: false, error: "メールアドレスの変更に失敗したわ！💦" };
  }
}

/**
 * パスワードの変更
 * @param password 新しいパスワード
 * @param oldPassword 古いパスワード
 * @returns パスワードの変更成功かどうか
 */
export async function changePassword(password: string, oldPassword: string): Promise<ActionResult> {
  try {
    const { account } = await createSessionClient();
    await account.updatePassword(password, oldPassword);
    return { ok: true };
  } catch (error: any) {
    if (error?.code === 401) return { ok: false, error: "いまのパスワードが違うわ！💦" };
    if (error?.code === 400) return { ok: false, error: "新しいパスワードは8文字以上にしてね！💦" };
    return { ok: false, error: "パスワードの変更に失敗したわ！💦" };
  }
}

/**
 * アカウントの削除
 * @returns アカウントの削除成功かどうか
 */
export async function deleteAccount(): Promise<ActionResult> {
  try{
    const { account, databases } = await createSessionClient();
    const targetUser = (await account.get()).$id;
    const targetActor : Actor = await databases.getDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, targetUser) as Actor;
    while(true){
      const targetPosts : Models.DocumentList<Post> = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, [
        Query.equal("attributedTo", targetActor.actorId),
      ]);
      if(targetPosts.documents.length === 0){
        break;
      }
      for(const post of targetPosts.documents){
        await deletePost(post.$id);
      }
    }
    await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, targetActor.$id);
    // actors_sub はドキュメントごとの権限を使わないコレクションなので、管理者の権限で消す（消すのはログイン中の本人の分だけ）
    const { users, databases: adminDatabases } = await createAdminClient();
    await adminDatabases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!, targetActor.$id);
    await deletePrivateKey(targetUser);
    await account.deleteSession("current");
    await users.delete(targetUser);
    await clearSessionCookie();
    return { ok: true };
  }catch(error:any){
    console.error("アカウントの削除に失敗:", error?.message);
    return { ok: false, error: "アカウントの削除に失敗したわ！💦" };
  }
}