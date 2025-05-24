"use server";
import { Client, Account, Databases, Storage, ImageFormat,Users, Query, ID, Permission, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { getImageUrl } from "./client";
import { cookies } from "next/headers";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Actor,getActorById,getActorByUserId } from "./database";
import { formatDateForUrl } from "@/lib/utils/date";
import { MeiliSearch } from "meilisearch";
const meilisearch = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!,
});
/**
 * Appwriteのクライアント設定！✨
 * セッション管理とデータベース接続をキラキラに設定！💖
 */
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

/**
 * セッションクライアントを作成！✨
 * ログイン済みユーザーのセッションで接続するよ！💖
 */
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

/**
 * ログイン済みユーザーを取得！✨
 * セッションからユーザー情報をキラキラに取得するよ！💖
 */
export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error: any) {
    throw new Error("セッションが見つからないよ！💦");
    
  }
}

/**
 * 現在のセッションを取得！✨
 * アクティブなセッション情報をキラキラに取得するよ！💖
 */
export async function getCurrentSession() {
  try {
    const { account } = await createSessionClient();
    return await account.getSession("current");
  } catch (error: any) {
    throw new Error("セッションの取得に失敗したよ！💦");
  }
}

/**
 * 管理者クライアントを作成！✨
 * 管理者権限で接続するよ！💖
 */
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

/**
 * 必須フィールドのチェック！✨
 * 必要なフィールドが揃ってるかキラキラに確認するよ！💖
 */
export async function throwIfMissing(obj: any, keys: string[]) {
  const missing = [];
  for (let key of keys) {
    if (!(key in obj) || !obj[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`必須フィールドが足りないよ！💦: ${missing.join(', ')}`);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticFolder = path.join(__dirname, '../static');

/**
 * 静的ファイルを取得！✨
 * 指定したファイルの内容をキラキラに読み込むよ！💖
 */
export async function getStaticFile(fileName: string) {
  return fs.readFileSync(path.join(staticFolder, fileName)).toString();
}

/**
 * テンプレートの置換！✨
 * プレースホルダーをキラキラに置き換えるよ！💖
 */
export async function interpolate(template: string, values: Record<string, string | undefined>) {
  return template.replace(/{{([^}]+)}}/g, (_, key: string) => values[key] || '');
}


/**
 * フォローする
 * @param userId フォローするユーザーのactorID
 * @returns フォロー成功かどうか
 */
export async function followUser(userId: string) {
  try {
    //console.log("フォローします！", userId);
    const { account, databases } = await createSessionClient();
    const session = await account.get();
    // フォローするユーザーの情報を取得
    //console.log("userId", userId);
    const { documents: [targetUser] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      [Query.equal("actorId", [`${userId}`])]
    );
    if (!targetUser) {
      console.log("ユーザーが見つからないわ！💦");
      return { error: "ユーザーが見つからないわ！💦" };
    }
    console.log("session", session);
    // 自分のユーザー情報を取得
    const { documents: [currentUser] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      [Query.equal("actorId", [`https://${process.env.APPWRITE_DOMAIN}/users/${session.name}`])]
    );
    //console.log("currentUser", currentUser);
    
    // フォロー処理
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      currentUser.$id,
      {
        following: [...(currentUser.following || []), `targetUser.actorId`]
      }
    );
    //console.log("フォロー処理成功！✨");
    // フォロワーとして追加
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
      targetUser.$id,
      {
        followers: [...(targetUser.followers || []), `currentUser.actorId`]
      }
    );
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
      ID.unique(),
      {
        type: "follow",
        from: currentUser.actorId,
        to: targetUser.actorId,
        message: `${currentUser.displayName}さんにフォローされました！`,
        read: false
      },
      [Permission.read(Role.user(targetUser.$id)), Permission.write(Role.user(targetUser.$id))]
    );
    //console.log("フォロワーとして追加成功！✨");
    return { message: "フォロー成功！✨" };
  } catch (error) {
    console.error("フォローに失敗したわ！💦", error);
    return { error: "フォローに失敗したわ！" };
  }
}

// フォロー解除
export async function unfollowUser(userId: string){
  try {
    const { account, databases } = await createSessionClient();
    const session = await account.get();
    
    // フォロー解除するユーザーの情報を取得
    const { documents: [targetUser] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      [Query.equal("actorId", [`${userId}`])]
    );
    // 自分のユーザー情報を取得
    const { documents: [currentUser] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      [Query.equal("actorId", [`https://${process.env.APPWRITE_DOMAIN}/users/${session.name}`])]
    );
    if (!targetUser) {
      return { error: "ユーザーが見つからないわ！💦" };
    }

    // フォロー解除処理
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      currentUser.$id,
      {
        following: (currentUser.following || []).filter((id: string) => id !== `targetUser.actorId`)
      }
    );

    // フォロワーから削除
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
      targetUser.$id,
      {
        followers: (targetUser.followers || []).filter((id: string) => id !== `currentUser.actorId`)
      }
    );
    //console.log("フォロワーから削除成功！✨");
    return { message: "フォロー解除成功！✨" };
  } catch (error) {
    console.error("フォロー解除に失敗したわ！💦", error);
    return { error: "フォロー解除に失敗したわ！💦" };
  }
}

/**
 * ミュートする
 * @param userId ミュートするユーザーのactorID
 * @returns ミュート成功かどうか
 */
export async function muteUser(userId: string) {
  try {
    const { databases } = await createSessionClient();
    const session = await getLoggedInUser();
    
    if (!session) {
      return false;
    }

    // 自分の情報を取得
    const currentUser = await getActorByUserId(session.$id);

    if (!currentUser) {
      return false;
    }

    // ミュート処理
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      currentUser.$id,
      {
        mutedUsers: [...(currentUser.mutedUsers || []), userId]
      }
    );

    return true;
  } catch (error) {
    console.error("ミュートに失敗したわ！💦", error);
    return false;
  }
}

/**
 * ミュート解除する
 * @param userId ミュート解除されるユーザーのactorID
 * @returns ミュート解除成功かどうか
 */
export async function unmuteUser(ActorId: string) {
  try {
    const { account, databases } = await createSessionClient();
    const session = await account.get();
    // ミュート解除するユーザーの情報を取得
    const targetActor = await getActorByUserId(session.$id);
    if (!targetActor) {
      console.log("ユーザーが見つからないわ！💦");
      return { error: "ユーザーが見つからないわ！💦" };
    }
    //console.log("targetActor", targetActor);
    //console.log((targetActor.mutedUsers || []).filter((actor: string) => actor !== ActorId));
    // ミュート解除処理
    //console.log("targetUser", ActorId);
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      targetActor.$id,
      {
        mutedUsers: (targetActor.mutedUsers || []).filter((actor: string) => actor !== ActorId)
      }
    );
    //console.log("ミュート解除処理成功！✨");
    return { message: "ミュート解除成功！✨" };
  } catch (error) {
    console.error("ミュート解除に失敗したわ！💦", error);
    return { error: "ミュート解除に失敗したわ！💦" };
  }
}

function isActor(user:any): user is Actor {
  if(user.$id !== undefined && user.actorId !== undefined && user.preferredUsername !== undefined && user.displayName !== undefined && user.followers !== undefined && user.privateKey !== undefined && user.userId !== undefined && user.mutedUsers !== undefined && user.following !== undefined){
    return true;
  }
  return false;
}

/**
 * 投稿の削除
 * @param postId 削除する投稿の$id
 * @returns 投稿の削除成功かどうか
 */
export async function deletePost(postId: string) {
  try {
    const { databases } = await createSessionClient();
    const session = await getLoggedInUser();
    if (!session) {
      throw new Error("セッションが見つからないわ！💦");
    }
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      postId
    );
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
      postId
    );
    meilisearch.index("posts").deleteDocument(postId);
    return true;
  } catch (error) {
    console.error("投稿の削除に失敗したわ！💦", error);
    return false;
  }
}

/**
 * ライク処理
 * @param postId ライクする投稿の$id
 * @returns ライク成功かどうか
 */
export async function likePost(postId: string) {
  try {
    const { databases } = await createSessionClient();
    const session = await getLoggedInUser();
    if (!session) {
      throw new Error("セッションが見つからないわ！💦");
    }
    const currentUser = await getActorByUserId(session.$id);
    if (!currentUser) {
      throw new Error("ユーザーが見つからないわ！💦");
    }
    // 投稿の情報を取得
    const { documents: [post] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      [Query.equal("$id", [postId])]
    );
    if (!post) {
      throw new Error("投稿が見つからないわ！💦");
    }

    // ライク処理
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
      postId,
      {
        LikedActors: [...(post.LikedActors || []), currentUser.actorId]
      }
    );
    const targetActorID = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, [
      Query.equal("actorId", post.attributedTo),
    ]).then(res=>res.documents[0].$id);
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
      ID.unique(),
      {
        type: "like",
        from: currentUser.actorId,
        to: post.attributedTo,
        target: post.activityId,
        message: `${currentUser.displayName}さんがあなたの投稿をいいねしました！`,
        read: false
      },
      [Permission.read(Role.user(targetActorID)), Permission.write(Role.user(targetActorID))]
    )

    return true;
  } catch (error) {
    console.error("ライクに失敗したわ！💦", error);
    return false;
  }
}

/**
 * ライク解除
 * @param postId ライク解除する投稿の$id
 * @returns ライク解除成功かどうか
 */
export async function unlikePost(postId: string) {
  try {
    const { databases } = await createSessionClient();
    const session = await getLoggedInUser();
    if (!session) {
      throw new Error("セッションが見つからないわ！💦");
    }
    const currentUser = await getActorByUserId(session.$id);
    if (!currentUser) {
      throw new Error("ユーザーが見つからないわ！💦");
    }
    // 投稿の情報を取得
    const { documents: [post] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,  
      [Query.equal("$id", [postId])]
    );
    if (!post) {
      throw new Error("投稿が見つからないわ！💦");
    } 

    // ライク解除処理
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
      postId, 
      {
        LikedActors: (post.LikedActors || []).filter((actor: string) => actor !== currentUser.actorId)
      }
    );

    return true;  
  } catch (error) {
    console.error("ライク解除に失敗したわ！💦", error);
    return false;
  }
} 

/**
 * 画像のアップロード
 * @param file アップロードする画像のファイルのバイナリデータ
 * @returns アップロードされた画像のURL
 */
export async function uploadImage(file: string) {
  try {
    const { storage } = await createSessionClient();
    const session = await getLoggedInUser();
    if (!session) {
      throw new Error("セッションが見つからないわ！💦");
    }
    const currentUser = await getActorByUserId(session.$id);
    if (!currentUser) {
      throw new Error("ユーザーが見つからないわ！💦");
    }
    const fileId = `avatar-${currentUser.actorId.split("/").pop()}-${formatDateForUrl(new Date())}`;
    const uploadedFile = await storage.createFile(
      process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!,
      fileId,
      InputFile.fromBuffer(Buffer.from(file, 'base64'), "image.jpg")
    );
    const url = await getImageUrl(uploadedFile.$id);
    return url;
  } catch (error) {
    console.error("画像のアップロードに失敗したわ！💦", error);
    return false;
  }
}

/**
 * プロフィールの更新
 * @param actorId プロフィールを更新するユーザーのactorId
 * @param displayName 表示名
 * @param bio 自己紹介
 * @param avatarUrl アバターのURL
 * @returns プロフィールの更新成功かどうか
 */
export async function updateProfile( displayName?: string, bio?: string, avatarUrl?: string) {
  if(!displayName && !bio && !avatarUrl){
    throw new Error("更新する内容がないわ！💦");
  }
  try {
    const {account, databases } = await createSessionClient();
    const session = await account.get();
    const currentUser = await getActorByUserId(session.$id);
    if (!currentUser) {
      throw new Error("ユーザーが見つからないわ！💦");
    }
    const updateData = {
      displayName: currentUser.displayName,
      bio: currentUser.bio,
      avatarUrl: currentUser.avatarUrl
    };
    if(displayName){
      updateData.displayName = displayName;
    }
    if(bio){
      updateData.bio = bio;
    }
    if(avatarUrl){
      updateData.avatarUrl = avatarUrl;
    }
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      currentUser.$id,
      updateData
    );
    return true;
  } catch (error) {
    console.error("プロフィールの更新に失敗したわ！💦", error);
    return false;
  }
}


/**
 * ユーザーの通知を取得する関数！✨
 * @param userId ユーザーID
 * @returns 通知一覧
 */
export async function getUserNotifications() {
  const { databases } = await createSessionClient();
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!
  );
  return documents
}

export async function getUnreadNotifications() {
  const { databases } = await createSessionClient();
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    [Query.equal("read", false)]
  );
  return documents;
}

/**
 * 通知を既読にする
 * @param notificationId 既読にする通知の$id
 * @returns 既読にする通知の成功かどうか
 */
export async function readNotification(notificationId: string) {
  const { databases } = await createSessionClient();
  await databases.updateDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    notificationId,
    { read: true }
  );
}

/**
 * アクティビティIDからポストを取得する 
 * @param activityId アクティビティID
 * @returns ポスト
 */
export async function getPostFromActivityId(activityId:string): Promise<{
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  content: string;
  username: string;
  activityId: string;
  to: string;
  cc: string[];
  published: string;
  inReplyTo: string | null;
  replyCount: number;
  attributedTo: string;
  attachment: string[];
  LikedActors: string[];
  avatar?: string;
  canDelete: boolean;
  isLiked: boolean;
}> {
  const { databases,account } = await createSessionClient();
  const session = await account.get();
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_POSTS_COLLECTION_ID!,
    [Query.equal("activityId", activityId)]
  );
  
  const subdocument = await databases.getDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
    documents[0].$id
  );
  const post = {
    $id: documents[0].$id,
    $createdAt: documents[0].$createdAt,
    $updatedAt: documents[0].$updatedAt,
    content: documents[0].content,
    username: documents[0].username,
    activityId: documents[0].activityId,
    to: documents[0].to,
    cc: documents[0].cc,
    published: documents[0].published,
    inReplyTo: documents[0].inReplyTo,
    replyCount: subdocument.replyCount,
    attributedTo: documents[0].attributedTo,
    attachment: documents[0].attachment,
    LikedActors: subdocument.LikedActors,
    avatar: documents[0].avatar,
    canDelete: documents[0].attributedTo.split("/").pop() === session.name,
    isLiked: subdocument.LikedActors.map((actor:string)=>actor.split("/").pop() || "").includes(session.name),
  }
  return post;
}