"use server";
import { Client, Account, Databases, Storage, Users, Query, ID,  } from "node-appwrite";
import { cookies } from "next/headers";
import { MeiliSearch } from "meilisearch";
import { Actor, Post } from "@/types/appwrite";
import { signRequest } from "../activitypub/crypto";
import { ActivityPubNoteInClient, ActivityPubActor, ActivityPubNote } from "@/types/activitypub";
import { Databases as AppwriteDatabases, Models } from "node-appwrite";

const meilisearch = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!,
});
/**
 * Appwriteのクライアント設定！✨
 * セッション管理とデータベース接続をキラキラに設定！💖
 */
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!);

/**
 * セッションクライアントを作成！✨ 
 * ログイン済みユーザーのセッションで接続するよ！💖
 */
export async function createSessionClient(cookie?: Request) {
  try {
    let session: string | undefined;
    
    if (cookie) {
      // リクエストヘッダーからセッションクッキーを取得
      const cookieHeader = cookie.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split("; ").reduce((acc: any, cookie) => {
          const [key, value] = cookie.split("=");
          acc[key] = value;
          return acc;
        }, {});
        session = cookies["my-custom-session"];
        //console.log("🔍 リクエストヘッダーからセッション取得:", !!session);
      }
    } else {
      // Next.jsのcookies()からセッションクッキーを取得
      session = (await cookies()).get("my-custom-session")?.value;
      //console.log("🔍 Next.js cookies()からセッション取得:", !!session);
    }
    
    if (session) {
      client.setSession(session);
    } else {
      //console.log("⚠️ セッションが見つかりません - ゲストユーザーとして扱われます");
      // セッションがない場合はゲストユーザーとして扱う
      // ただし、認証が必要な操作は制限される
    }
    
    return {
      account: new Account(client),
      databases: new Databases(client),
      storage: new Storage(client),
    };
  } catch (error: any) {
    console.error("セッションエラー:", error);
    if (error.code === 401) {
      throw new Error("ログインが必要だよ！💦 もう一度ログインしてね！✨");
    }
    throw new Error("セッションの取得に失敗したよ！💦");
  }
}

/**
 * セッション状態を確認！✨
 * 現在のセッションが有効かどうかをキラキラに確認するよ！💖
 */
export async function checkSessionStatus(cookie?: Request) {
  try {
    const { account } = await createSessionClient(cookie);
    const user = await account.get();
    return {
      isValid: true,
      user: user,
      message: "セッションが有効です"
    };
  } catch (error: any) {
    return {
      isValid: false,
      user: null,
      message: error.message || "セッションが無効です"
    };
  }
}

/**
 * セッションクッキーを返す！✨
 * セッションクッキーを返すよ！💖
 */
export async function getSessionCookie() {
  return (await cookies()).get("my-custom-session")?.value;
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
    //console.error("セッションエラー:", error);
    if (error.code === 401) {
      throw new Error("ログインが必要だよ！💦 もう一度ログインしてね！✨");
    }
    throw new Error("セッションの取得に失敗したよ！💦");
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
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
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

/**
 * 静的ファイルを取得！✨
 * 指定したファイルの内容をキラキラに読み込むよ！💖
 */
export async function getStaticFile(fileName: string) {
  // Next.js環境では相対パスで静的ファイルを読み込む
  const fs = require('fs');
  const path = require('path');
  const staticFolder = path.join(process.cwd(), 'src/lib/appwrite/static');
  return fs.readFileSync(path.join(staticFolder, fileName)).toString();
}

/**
 * テンプレートの置換！✨
 * プレースホルダーをキラキラに置き換えるよ！💖
 */
export async function interpolate(template: string, values: Record<string, string | undefined>) {
  return template.replace(/{{([^}]+)}}/g, (_, key: string) => values[key] || '');
}

// フォロー
export async function followUser(userId: string){
  try {
    const { account, databases } = await createSessionClient();
    const session = await account.get();
    const currentUser: Actor = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id
    );
    if(!currentUser){
      throw new Error("ユーザーが見つからないわ！💦");
    }
    const activity = {
      "@context": "https://www.w3.org/ns/activitystreams",
      "type": "Follow",
      "id": `${currentUser.inbox}/${ID.unique()}`,
      "actor": currentUser.id,
      "object": userId,
      "published": new Date().toISOString()
    };
    const actorInbox = userId+"/inbox";
    const headers = await signRequest(actorInbox, activity, currentUser.privateKey, `${currentUser.actorId}#main-key`)
    const response = await fetch(actorInbox, {
      method: "POST",
      headers: headers.headers,
      body: JSON.stringify(activity)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`アクティビティの送信に失敗したわ！💦:${error.error}`);
    }
    const { documents: [actorSub] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
      [Query.equal("id", currentUser.actorId)]
    );
    if(actorSub){
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        actorSub.$id,
        {
          "followingCount": actorSub.followingCount + 1
        }
      );
    }
    const { documents: [follow] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      [Query.equal("object", userId), Query.equal("actor", currentUser.actorId)]
    );
    if(follow){
      return follow.id;
    }
    const newFollow = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      ID.unique(),
      {
        "id": activity.id,
        "actor": currentUser.actorId,
        "object": userId,
      }
    )
    if(!newFollow){
      throw new Error("フォローの作成に失敗したわ！💦");
    }
    return newFollow.id;
  } catch (error) {
    console.error("フォローに失敗したわ！💦", error);
    return { error: "フォローに失敗したわ！💦" };
  }
}

// フォロー解除
export async function unfollowUser(activityId: string){
  try {
    const { account, databases } = await createSessionClient();
    const session = await account.get();
    const currentUser : Actor = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id
    );
    if (!currentUser) {
      throw new Error("ユーザーが見つからないわ！💦");
    }
    const { documents: [follow] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      [Query.equal("id", activityId)]
    );
    if(!follow){
      throw new Error("フォローが見つからないわ！💦");
    }
    const actorInbox = follow.object+"/inbox";
    const activity = {
      "@context": "https://www.w3.org/ns/activitystreams",
      "type": "Undo",
      "id": `${currentUser.actorId}/inbox/${ID.unique()}`,
      "actor": currentUser.id,
      "object": {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "Follow",
        "id": activityId,
        "actor": follow.actor,
        "object": follow.object,
        "published": follow.$createdAt
      },
      "published": new Date().toISOString()
    };
    const headers = await signRequest(actorInbox, activity, currentUser.privateKey, `${currentUser.actorId}#main-key`)
    const response = await fetch(actorInbox, {
      method: "POST",
      headers: headers.headers,
      body: JSON.stringify(activity)
    });
    if (!response.ok) {
      throw new Error(`アクティビティの送信に失敗したわ！💦`);
    }
    const { documents: [actorSub] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
      [Query.equal("id", follow.actor)]
    );
    if(actorSub){
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        actorSub.$id,
        {
          "followingCount": actorSub.followingCount - 1
        }
      );
    }
    const { documents: [deletedFollow] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      [Query.equal("id", activityId)]
    );
    if(deletedFollow){
      await databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        deletedFollow.$id
      );
      return true;
    }
    return true;
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
    const currentUser : Actor = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id
    );

    if (!currentUser) {
      return false;
    }

    // ミュート処理
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id,
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
    const myActor = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id
    );
    if (!myActor) {
      //console.log("ユーザーが見つからないわ！💦");
      return { error: "ユーザーが見つからないわ！💦" };
    }
    //console.log("targetActor", targetActor);
    //console.log((targetActor.mutedUsers || []).filter((actor: string) => actor !== ActorId));
    // ミュート解除処理
    //console.log("targetUser", ActorId);
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id,
      {
        mutedUsers: (myActor.mutedUsers || []).filter((actor: string) => actor !== ActorId)
      }
    );
    //console.log("ミュート解除処理成功！✨");
    return { message: "ミュート解除成功！✨" };
  } catch (error) {
    console.error("ミュート解除に失敗したわ！💦", error);
    return { error: "ミュート解除に失敗したわ！💦" };
  }
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
 * ライクを確認する。
 * @param postId ライクを確認する投稿の$id
 * @returns ライクが存在するかどうか
 */
export async function checkLike(postId: string) {
  try {
    const { databases, account } = await createSessionClient();
    const session = await account.get();
    const currentUser : Actor = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id
    );
    if (!currentUser) {
      throw new Error("ユーザーが見つからないわ！💦");
    }
    
    // 現在のユーザーがいいねしてるかチェック
    const { documents } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_LIKES_COLLECTION_ID!,
      [Query.equal("object", postId), Query.equal("actor", currentUser.actorId)]
    );
    
    // 投稿に対する総いいね数を取得
    const { total } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_LIKES_COLLECTION_ID!,
      [Query.equal("object", postId)]
    );
    
    //console.log(`checkLike結果: postId=${postId}, isLiked=${documents.length > 0}, likeCount=${total}`);
    
    return { isLiked: documents.length > 0, likeCount: total };
  } catch (error) {
    //console.error("checkLikeエラー:", error);
    return { isLiked: false, likeCount: 0 };
  }
}
/**
 * ライク処理
 * @param postId ライクする投稿の$id
 * @returns ライク成功かどうか
 */
export async function likePost(postId: string ,actorInbox: string) {
  try {
    const { databases ,account} = await createSessionClient();
    const session = await account.get();
    const currentUser : Actor = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id
    );
    if (!currentUser) {
      throw new Error("ユーザーが見つからないわ！💦");
    }

    const activity = {
      "@context": "https://www.w3.org/ns/activitystreams",
      "type": "Like",
      "id": `${currentUser.actorId}/inbox/${ID.unique()}`,
      "actor": currentUser.actorId,
      "object": postId,
      "published": new Date().toISOString()
    };
    const newLike = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_LIKES_COLLECTION_ID!,
      ID.unique(),
      {
        "id": activity.id,
        "actor": currentUser.actorId,
        "object": postId,
      }
    )
    if(!newLike){
      throw new Error("ライクの作成に失敗したわ！💦");  
    }
    const headers = await signRequest(actorInbox, activity, currentUser.privateKey, `${currentUser.actorId}#main-key`)
    const response = await fetch(actorInbox, {
      method: "POST",
      headers: headers.headers,
      body: JSON.stringify(activity)
    });
    if (!response.ok) {
      throw new Error("アクティビティの送信に失敗したわ！💦");
    }

    
    return true;
  } catch (error) {
    console.error("ライクに失敗したわ！💦", error);
    return false;
  }
}

export async function getUserPostCount(userId: string) {
  const { databases } = await createSessionClient();
  //console.log("userId", userId);
  const { total } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_POSTS_COLLECTION_ID!,
    [Query.equal("attributedTo", userId)]
  );
  return total;
}

/**
 * ライク解除
 * @param postId ライク解除する投稿の$id
 * @param actorInbox ライク解除する投稿のactorInbox
 * @returns ライク解除成功かどうか
 */
export async function unlikePost(postId: string, actorInbox: string) {
  try {
    const { databases } = await createSessionClient();
    const session = await getLoggedInUser();
    if (!session) {
      throw new Error("セッションが見つからないわ！💦");
    }
    const currentUser : Actor = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id
    );
    if (!currentUser) {
      throw new Error("ユーザーが見つからないわ！💦");
    }
    // 投稿の情報を取得
    const { documents: likes } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_LIKES_COLLECTION_ID!,
      [Query.equal("object", postId), Query.equal("actor", currentUser.actorId)]
    );
    if (likes.length === 0) {
      throw new Error("ライクが見つからないわ！💦");
    }
    for (const like of likes) {
      const activity = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "Undo",
        "id": `${currentUser.actorId}/inbox/${ID.unique()}`,
        "actor": currentUser.actorId,
        "object": {
          "@context": "https://www.w3.org/ns/activitystreams",
          "type": "Like",
          "id": like.id,
          "actor": like.actor,
          "object": like.object,
          "published": like.$createdAt
        },
        "published": new Date().toISOString()
      };
      const headers = await signRequest(actorInbox, activity, currentUser.privateKey, `${currentUser.actorId}#main-key`)
      const response = await fetch(actorInbox, {
        method: "POST",
        headers: headers.headers,
        body: JSON.stringify(activity)
      });
      if (!response.ok) {
        throw new Error("アクティビティの送信に失敗したわ！💦");
      }
      if(!like.id.startsWith(process.env.NEXT_PUBLIC_DOMAIN!)){
      await databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        like.$id
      );
      }
    }

    return true;  
  } catch (error) {
    console.error("ライク解除に失敗したわ！💦", error);
    return false;
  }
} 

/**
 * 通知を作成する関数
 * @param type 通知の種類
 * @param from 通知を送信したユーザーのactorId
 * @param to 通知を受信するユーザーのactorId
 * @param target 通知の対象のアクティビティID
 * @param message 通知のメッセージ
 * @param read 通知が既読かどうか
 */
export async function createNotification(type: string, from: string, to: string, target: string, {/*message: string*/}, read: boolean) {
  try {
    const { databases } = await createAdminClient();
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
      ID.unique(),
      { 
        type,
        from,
        to,
        target,
        read
      }
    );
    return true;
  } catch (error) {
    console.error("通知の作成に失敗したわ！💦", error);
    return false;
  }
}
/**
 * プロフィールの更新
 * @param actorId プロフィールを更新するユーザーのactorId
 * @param displayName 表示名
 * @param bio 自己紹介
 * @param avatarUrl アバターのURL
 * @param backgroundUrl 背景画像のURL
 * @returns プロフィールの更新成功かどうか
 */
export async function updateProfile( displayName?: string, bio?: string, avatarUrl?: string,backgroundUrl?: string) {
  if(!displayName && !bio && !avatarUrl){
    throw new Error("更新する内容がないわ！💦");
  }
  try {
    const {account, databases } = await createSessionClient();
    const session = await account.get();
    const currentUser : Actor = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id
    );
    if (!currentUser) {
      throw new Error("ユーザーが見つからないわ！💦");
    }
    const updateData = {
      displayName: currentUser.displayName,
      bio: currentUser.bio,
      avatarUrl: currentUser.avatarUrl,
      backgroundUrl: currentUser.backgroundUrl || null
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
    if(backgroundUrl && backgroundUrl !== ""){
      updateData.backgroundUrl = backgroundUrl;
    }
    if(backgroundUrl === ""){
      updateData.backgroundUrl = null;
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
  const { databases ,account} = await createSessionClient();
  const session = await account.get();
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    [Query.orderDesc("$createdAt"),Query.greaterThan("$updatedAt",new Date(Date.now()-1000*60*60*84).toISOString()),Query.equal("to", process.env.NEXT_PUBLIC_DOMAIN+"/users/"+session.$id)]
  );
  console.log("documents",documents);
  return documents
}

export async function getUnreadNotifications() {
  const { databases ,account} = await createSessionClient();
  const session = await account.get();
  const { total } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    [Query.equal("read", false),Query.equal("to", `${process.env.NEXT_PUBLIC_DOMAIN}/users/${session.$id}`),Query.greaterThan("$createdAt",new Date(Date.now()-1000*60*60*84).toISOString())]
  );
  return total;
}

/**
 * 通知を既読にする
 * @param notificationId 既読にする通知の$id
 * @returns 既読にする通知の成功かどうか
 */
export async function readNotification(notificationId: string) {
  const { databases } = await createSessionClient();
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    [Query.equal("$id", notificationId)]
  );
  if(documents.length === 0){
    throw new Error("通知が見つからないわ！💦");
  }
  await databases.updateDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    documents[0].$id,
    { id: documents[0].id,
      type: documents[0].type,
      from: documents[0].from,
      to: documents[0].to,
      target: documents[0].target,
      read: true }
  );
}

/**
 * アクティビティIDからポストを取得する 
 * @param activityId アクティビティID
 * @returns ポスト
 */
export async function getPostFromActivityId(activityId:string): Promise<ActivityPubNote> {
  try{
  const { databases } = await createSessionClient();  
  const { documents : [document] }  : Models.DocumentList<Post> = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_POSTS_COLLECTION_ID!,
    [Query.equal("activityId", activityId)]
  );
  if(!document){
    throw new Error("ポストが見つからないわ！💦");
  }
  const post : ActivityPubNote = {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    type: "Note",
    id: document.activityId,
    attributedTo: document.attributedTo || document.username,
    content: document.content,
    published: document.published,
    inReplyTo: document.inReplyTo || "",
    attachment: document.attachment || [],
    to: document.to || [],
    cc: document.cc || [],
    url: document.id,
    likes: document.activityId + "/likes",
    replies: document.activityId + "/replies",
  }
  return post;
} catch (error) {
  console.error("ポストの取得に失敗したわ！💦", error);
  throw error;
} 
}

/**
 * タイムラインの投稿を取得！✨
 * 投稿をキラキラに取得するよ！💖
 */
export async function getTimelinePosts(sessionId: string, limit: number = 10, offset: number = 0) : Promise<{notes:ActivityPubNoteInClient[],total:number}> {
  try {
    const { databases } = await createSessionClient();
    const { documents, total } : Models.DocumentList<Post> = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      [Query.orderDesc("$createdAt"),Query.limit(limit),Query.offset(offset)]
    );
    const actors :ActivityPubActor[] = [];
    const posts : ActivityPubNoteInClient[] = [];
    
    // mapをfor...ofに変更して順次処理に
    for (const document of documents) {
      //actorsリストにactorIdがない場合
      if(!actors.find(actor => actor.id === document.attributedTo)){
        if(document.attributedTo){
          const actor = await getActor(document.attributedTo, databases);
          if(actor && actor.id === document.attributedTo){
            actors.push(actor);
          }
        }
      }
      const actor = actors.find(actor => actor.id === document.attributedTo);
      const totalLikes = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        [Query.equal("object", document.activityId)]
      );
      const totalReplies = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_COLLECTION_ID!,
        [Query.equal("inReplyTo", document.activityId)]
      );
      const sessionActorId = process.env.NEXT_PUBLIC_DOMAIN+"/users/"+sessionId;
      const isLiked = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        [Query.equal("object", document.activityId),Query.equal("actor", sessionActorId)]
      );
      if(actor){
      const note : ActivityPubNoteInClient = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        type: "Note",
        id: document.activityId,
        attributedTo: document.attributedTo || document.username,
        content: document.content,
        published: document.published,
        inReplyTo: document.inReplyTo || "",
        attachment: document.attachment || [],
        to: document.to || [],
        cc: document.cc || [],
        url: document.id,
        likes: {
          totalItems: totalLikes.total || 0,
          first: document.id + "/likes?page=1",
          last: document.id + "/likes?page=" + Math.ceil(totalLikes.total / 20),
        },
        replies: {
          totalItems: totalReplies.total || 0,
          first: document.id + "/replies?page=1",
          last: document.id + "/replies?page=" + Math.ceil(totalReplies.total / 20),
        },
        _isLiked: isLiked.total > 0,
        _user: actor!,
        _canDelete: actor!.id === sessionActorId
      }
      posts.push(note)}
    }
    //console.log("posts",posts);
    return {notes :posts,total:total};
  } catch (error) {
    throw new Error('タイムラインの取得に失敗したよ！💦');
  }
}
/**
 * アクターを取得！✨
 * @param actorId アクターのid
 * @param databases データベース
 * @returns アクター
 */
async function getActor(actorId: string, databases: AppwriteDatabases) : Promise<ActivityPubActor> {
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    [Query.equal("actorId", actorId)]
  );
  if(documents.length === 0){
    throw new Error("アクターが見つからないわ！💦");
  }
  const actor : ActivityPubActor = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Person",
    id: documents[0].actorId,
    displayName: documents[0].displayName,
    preferredUsername: documents[0].preferredUsername,
    icon: {
      type: "Image",
      url: documents[0].avatarUrl,
    },
    followers: documents[0].actorId + "/followers",
    following: documents[0].actorId + "/following",
    inbox: documents[0].actorId + "/inbox",
    outbox: documents[0].actorId + "/outbox",
    publicKey: {
      id: documents[0].actorId + "#main-key",
      owner: documents[0].actorId,
      publicKeyPem: documents[0].publicKey,
    },
  }
  return actor;
}
/**
 * 投稿を生のActivityPubNoteで取得！✨
 * @param postId 投稿の$id
 * @param databases データベース
 * @returns 投稿
 * 投稿をキラキラに取得するよ！💖
 */
async function getPost(postId: string, databases: AppwriteDatabases) : Promise<ActivityPubNote> {
  try {
    const document : Post = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      postId
    );
    const { total : likeCount } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_LIKES_COLLECTION_ID!,
      [Query.equal("object", postId)]
    );
    const note : ActivityPubNote = {
      id: document.activityId,
      type: "Note",
      published: document.published,
      attributedTo: document.attributedTo || document.username,
      content: document.content,
      inReplyTo: document.inReplyTo || "",  
      replies: {
        totalItems: document.replies?.totalItems || 0,
        first: document.id + "/replies?page=1",
        last: document.id + "/replies?page=" + Math.ceil(document.replies?.totalItems / 20),
      },
      attachment: document.attachment || [],
      to: document.to || [],
      cc: document.cc || [],
      "@context": document["@context"],
      url: document.id,
      likes: {
        totalItems: likeCount || 0,
        first: document.id + "/likes?page=1",
        last: document.id + "/likes?page=" + Math.ceil(likeCount / 20),
      },
      repost: {
        totalItems: document.repost?.totalItems || 0,
        first: document.id + "/repost?page=1",
        last: document.id + "/repost?page=" + Math.ceil(document.repost?.totalItems / 20),
      },
    }   
    return note;
  } catch (error) {
    throw new Error('投稿の取得に失敗したよ！💦');
  }
}
/**
 * 投稿のいいね数といいねしたかどうかを取得！✨
 * @param postId 投稿のid
 * @param userId ユーザーのid
 * @param databases データベース
 * @returns いいね数といいねしたかどうか
 */
const getLikeCountAndIsLiked = async (postId: string, userId: string, databases: AppwriteDatabases) : Promise<{likeCount: number, isLiked: boolean}>  => {
  const { total : likeCount } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_LIKES_COLLECTION_ID!,
    [Query.equal("object", postId)]
  );
  const { total : isLiked } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_LIKES_COLLECTION_ID!,
    [Query.equal("object", postId),Query.equal("actor", userId)]
  );
  return {
    likeCount,
    isLiked: isLiked > 0
  }
}
/**
 * 投稿の詳細を取得！✨
 * 投稿をキラキラに取得するよ！💖
 */
export async function getInternalPostWithActor(postId: string) : Promise<ActivityPubNoteInClient> {
  const { databases,account } = await createSessionClient();
  const session = await account.get();
  const actorId = process.env.NEXT_PUBLIC_DOMAIN+"/users/"+session.$id;
  try{
    const appwritePostId = postId.split("/").pop();
    if(!appwritePostId){
      throw new Error("投稿が見つからないわ！💦");
    }

  const noteData = await getPost(appwritePostId, databases);
  console.log("noteData",noteData.id);
  //console.log("noteData",noteData.content);
  const { documents : [actorDocument] }: Models.DocumentList<Actor>   = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    [Query.equal("actorId", noteData.attributedTo)]
  )
  if(!actorDocument){
    //console.log("ユーザーが見つからないわ！💦");
    throw new Error("ユーザーが見つからないわ！💦");
  };
  const { likeCount, isLiked } = await getLikeCountAndIsLiked(postId, actorId, databases);
  console.log("likeCount",likeCount);
  console.log("isLiked",isLiked);
  const note : ActivityPubNoteInClient = {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: noteData.id,
    type: noteData.type,
    published: noteData.published,
    attributedTo: noteData.attributedTo,
    content: noteData.content,
    inReplyTo: noteData.inReplyTo,
    attachment: noteData.attachment,
    to: noteData.to,
    cc: noteData.cc,
    url: noteData.url,
    likes: {
      totalItems: likeCount || 0,
      first: noteData.id + "/likes?page=1",
      last: noteData.id + "/likes?page=" + Math.ceil(likeCount / 20),
    },
    replies:{
      totalItems: 0,
      first: noteData.id + "/replies?page=1",
      last: noteData.id + "/replies?page=" + Math.ceil(0 / 20),
    },
    "_isLiked": isLiked,
    "_user": {
      "@context": "https://www.w3.org/ns/activitystreams",
      "type": "Person",
      "id": actorId,
      "preferredUsername": actorDocument.preferredUsername,
      "displayName": actorDocument.displayName,
      "followers": actorId + "/followers",
      "following": actorId + "/following",
      "inbox": actorId + "/inbox",
      "outbox": actorId + "/outbox",
      "publicKey": {
        "id": actorId + "#main-key",
        "owner": actorId,
        "publicKeyPem": actorDocument.publicKey,
      },
      "icon":{
        "type": "Image",
        "url": actorDocument.avatarUrl || "",
      }
    },
    "_canDelete": actorDocument.$id === session.$id
  } ;
  console.log("note", note.id);
    return note;
  } catch (error) {
    console.error("投稿の詳細の取得に失敗したよ！💦", error);
    throw new Error("投稿の詳細の取得に失敗したよ！💦");
  }
}


/**
 * 投稿を作成！✨
 * 投稿をキラキラに作成するよ！💖
 */
export async function createPost(content: string, userId: string, images?: File[]) {
  try {
    const { databases } = await createSessionClient();
    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      'unique()',
      {
        content,
        images: images || [],
        createdAt: new Date().toISOString(),
        published: new Date().toISOString(),
        to: '',
        cc: [],
        inReplyTo: null,
        replyCount: 0,
        attributedTo: userId,
        attachment: [],
        LikedActors: []
      }
    );
    return document;
  } catch (error) {
    throw new Error('投稿の作成に失敗したよ！💦');
  }
}

/**
 * 投稿を削除！✨
 * 投稿をキラキラに削除するよ！💖
 */
export async function deletePostById(postId: string) {
  try {
    const { databases } = await createSessionClient();
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      postId
    );
  } catch (error) {
    throw new Error('投稿の削除に失敗したよ！💦');
  }
}

/**
 * ユーザーの投稿を取得！✨
 * ユーザーの投稿をキラキラに取得するよ！💖
 */
export async function getUserPosts(userId: string) {
  try {
    const { databases } = await createSessionClient();
    const { documents } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      [
        Query.equal('$id', userId),
        Query.orderDesc('$createdAt')
      ]
    );
    return documents;
  } catch (error) {
    throw new Error('ユーザーの投稿の取得に失敗したよ！💦');
  }
}

/**
 * プロフィールを更新！✨
 * プロフィールをキラキラに更新するよ！💖
 */
export async function updateUserProfile(actorId: string, data: { displayName: string; bio: string }) {
  try {
    const { databases } = await createSessionClient();
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      actorId,
      {
        displayName: data.displayName,
        bio: data.bio,
      }
    );
    return true;
  } catch (error) {
    throw new Error('プロフィールの更新に失敗したよ！💦');
  }
}

/**
 * リプライの投稿を取得！✨
 * リプライの投稿をキラキラに取得するよ！💖
 */
export async function getReplyPostsFromActivityId(activityId: string)  {
  const { databases } = await createSessionClient();
  const { documents } : Models.DocumentList<Post> = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_POSTS_COLLECTION_ID!,
    [Query.equal("inReplyTo", activityId)]
  );
  return documents.map((document) => {
    return {
      $id: document.$id,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt,
      content: document.content,
      username: document.username,
      activityId: document.activityId,
      to: document.to,
      cc: document.cc,
      published: document.published,
      attributedTo: document.attributedTo,
      avatar: document.avatar,
      attachment: document.attachment,
    } ;
  });
}

export async function getLikedActivities(postId: string) {
  const { databases } = await createSessionClient();
  //console.log("postId",postId);
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_LIKES_COLLECTION_ID!,
    [Query.equal("object", postId)]
  );
  //console.log("documents",documents);
  return documents;
}