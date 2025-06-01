/**
 * ユーザー認証アクション！✨
 * ギャルSNSのキラキラ登録とログインをサポート！💖
 */
"use server";
import {  Query } from "node-appwrite";
import { createAdminClient, createSessionClient, deletePost } from "./serverConfig";
import { cookies } from "next/headers";
import {  createDecipheriv } from "crypto";
const ENCRYPTION_KEY = Buffer.from(process.env.APPWRITE_ENCRYPTION_KEY!, "hex");

/**
 * 復号化！🔓
 * 暗号化された秘密鍵をキラキラ取り出す！✨
 */
function decrypt(encrypted: string): string {
  const [ivHex, encryptedHex, authTagHex] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function signInWithEmail(formData:{email:string,password:string}) {
  const email = formData.email;
  const password = formData.password;
  const { account } = await createAdminClient();
  try {
    const session = await account.createEmailPasswordSession(email, password);

    (await cookies()).set("my-custom-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    return session;
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

export async function getActorByUserId(userId: string) {
  const { databases} = await createSessionClient();
  const { documents } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, [
    Query.equal("userId", userId),
  ]);
  if (documents[0]) {
    const actor = documents[0];
    actor.privateKey = decrypt(actor.privateKey);
    return actor;
  }
  return null;
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
    const targetActor = await databases.getDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, targetUser);
    while(true){
      const targetPosts = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, [
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
    await account.deleteSession("current");
    const { users } = await createAdminClient();
    await users.delete(targetUser);
    return true;
  }catch(error:any){
    throw new Error("アカウントの削除に失敗したわ！💦");
  }
}