"use server";
import { Client, Account, Databases, Storage, Users, Query, ID, Models } from "node-appwrite";
import { cookies } from "next/headers";
import { MeiliSearch } from "meilisearch";
import { Actor, Post  } from "@/types/appwrite";
import { signRequest } from "../activitypub/crypto";
import { ActivityPubNote, ActivityPubNoteInClient } from "@/types/activitypub";

const meilisearch = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!,
});
/**
 * Appwriteのクライアント設定！✨
 * セッション管理とデータベース接続をキラキラに設定！💖
 */
/**
 * セッションクライアントを作成！✨ 
 * ログイン済みユーザーのセッションで接続するよ！💖
 */
export async function createSessionClient(cookie?: Request) {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!);
    
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
      "actor": currentUser.actorId,
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
      throw new Error(`アクティビティの送信に失敗したわ！💦:${error.error} ${response.statusText}`);
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
      "@context": ["https://www.w3.org/ns/activitystreams"],
      "type": "Undo",
      "id": `${currentUser.actorId}/inbox/${ID.unique()}`,
      "actor": currentUser.actorId,
      "object": {
        "@context": ["https://www.w3.org/ns/activitystreams"],
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
 * 投稿を生のActivityPubNoteで取得！✨
 * @param postId 投稿の$id
 * @param databases データベース
 * @returns 投稿
 * 投稿をキラキラに取得するよ！💖
 */
async function getPost(postId: string, databases: Databases) : Promise<ActivityPubNote> {
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
const getLikeCountAndIsLiked = async (postId: string, userId: string, databases: Databases) : Promise<{likeCount: number, isLiked: boolean}>  => {
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
    return note;
  } catch (error) {
    console.error("投稿の詳細の取得に失敗したよ！💦", error);
    throw new Error("投稿の詳細の取得に失敗したよ！💦");
  }
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