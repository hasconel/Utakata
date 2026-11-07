/**
 * ユーザー認証アクション！✨
 * ギャルSNSのキラキラ登録とログインをサポート！💖
 */
"use server";
import {  Models,   Query } from "node-appwrite";
import { createAdminClient, createSessionClient, deletePost } from "./serverConfig";
import { cookies } from "next/headers";   
import { deletePrivateKey } from "@/lib/activitypub/privateKeyStore";
import { Actor, Post } from "@/types/appwrite";


export async function signInWithEmail(formData:{email:string,password:string}) {
  const email = formData.email;
  const password = formData.password;
  const { account } = await createAdminClient();
  try {
    const session = await account.createEmailPasswordSession(email, password);

    (await cookies()).set("my-custom-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30日間
      expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000) // 30日後
    });
    // session.secret をブラウザに渡さないよう、セッション本体は返さない
    return { success: true };
  } catch (error: any) {
    console.error("ログインエラー:", error);
    if (error.code === 401) {
      throw new Error("メールアドレスかパスワードが間違ってるよ！💦");
    }
    throw new Error("ログインに失敗したよ！もう一度試してみてね！��");
  }
}

/**
 * サインアウト
 * @returns サインアウト成功かどうか
 */
export async function signOut() {

  const { account } = await createSessionClient();

  (await cookies()).delete("my-custom-session");
  await account.deleteSession("current");
}

/**
 * メールアドレスの変更
 * @param email 新しいメールアドレス
 * @param password パスワード
 * @returns メールアドレスの変更成功かどうか
 */
export async function changeEmail(email:string,password:string) {
try{
  const { account } = await createSessionClient();
  await account.updateEmail(email,password);
  return true;
}catch(error:any){
  throw new Error("メールアドレスの変更に失敗したわ！💦");
}
}

/**
 * パスワードの変更
 * @param password 新しいパスワード
 * @param oldPassword 古いパスワード
 * @returns パスワードの変更成功かどうか
 */
export async function changePassword(password:string ,oldPassword:string) {
try{
  const { account } = await createSessionClient();
  await account.updatePassword(password, oldPassword);
  return true;
}catch(error:any){
  throw new Error("パスワードの変更に失敗したわ！💦");
}
}

/**
 * アカウントの削除
 * @returns アカウントの削除成功かどうか
 */
export async function deleteAccount() {
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
    await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!, targetActor.$id);
    await deletePrivateKey(targetUser);
    await account.deleteSession("current");
    const { users } = await createAdminClient();
    await users.delete(targetUser);
    return true;
  }catch(error:any){
    throw new Error("アカウントの削除に失敗したわ！💦");
  }
}