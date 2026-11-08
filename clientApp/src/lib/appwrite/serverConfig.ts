"use server";
import { Client, Account, Databases, Storage, Users, Query, ID, Models } from "node-appwrite";
import { cookies } from "next/headers";
import { after } from "next/server";
import { prepareProfileUpdate } from "../activitypub/profileUpdate";
import { removePostFromIndex } from "@/lib/search/meili";
import { Actor, Post  } from "@/types/appwrite";
import { signRequest } from "../activitypub/crypto";
import { getEncryptedPrivateKey } from "../activitypub/privateKeyStore";
import { fetchActivityDocument, fetchRemoteActor } from "../activitypub/remoteActor";
import { isInternalUrl } from "../utils";
import { ActivityPubNote, ActivityPubNoteInClient } from "@/types/activitypub";

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
    const headers = await signRequest(actorInbox, activity, await getEncryptedPrivateKey(currentUser.$id), `${currentUser.actorId}#main-key`)

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
    const headers = await signRequest(actorInbox, activity, await getEncryptedPrivateKey(currentUser.$id), `${currentUser.actorId}#main-key`)
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
    // 以前は await していなかったので、消した投稿が検索に残ることがあった
    await removePostFromIndex(postId);
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
/**
 * いいねを届ける先（投稿者の inbox）を、サーバー側で投稿から調べる。
 * 画面から受け取った inbox は使わない（好きなURLに、署名付きで送らせることができてしまうため）。
 */
async function inboxForPost(databases: Databases, postId: string, signerUserId: string): Promise<string | null> {
  const { documents } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, [
    Query.equal("activityId", postId),
    Query.limit(1),
  ]);
  let author = (documents[0] as any)?.attributedTo;
  // 保存していない投稿（外部のユーザーのページから見たもの）は、投稿そのものを読んで投稿者を調べる
  if (typeof author !== "string" && !isInternalUrl(postId)) {
    const response = await fetchActivityDocument(postId, { signer: signerUserId, timeoutMs: 5_000 }).catch(() => null);
    const note = response?.ok ? JSON.parse(response.body.toString("utf-8")) : null;
    const attributedTo = typeof note?.attributedTo === "string" ? note.attributedTo : note?.attributedTo?.id;
    // 投稿と投稿者が同じサーバーのときだけ信用する
    if (note?.id === postId && typeof attributedTo === "string" && new URL(attributedTo).origin === new URL(postId).origin) {
      author = attributedTo;
    }
  }
  if (typeof author !== "string") return null;
  if (isInternalUrl(author)) return `${author}/inbox`;
  const actor = await fetchRemoteActor(author, signerUserId);
  return typeof actor?.inbox === "string" ? actor.inbox : null;
}

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
    void actorInbox; // 画面からの値は使わない
    const inbox = await inboxForPost(databases, postId, currentUser.$id);
    if (!inbox) throw new Error("いいねを届ける先が見つからないわ！💦");
    const headers = await signRequest(inbox, activity, await getEncryptedPrivateKey(currentUser.$id), `${currentUser.actorId}#main-key`)
    const response = await fetch(inbox, {
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
      void actorInbox; // 画面からの値は使わない
      const inbox = await inboxForPost(databases, postId, currentUser.$id);
      if (!inbox) throw new Error("いいねを届ける先が見つからないわ！💦");
      const headers = await signRequest(inbox, activity, await getEncryptedPrivateKey(currentUser.$id), `${currentUser.actorId}#main-key`)
      const response = await fetch(inbox, {
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
 * プロフィールを保存する。
 * 渡さなかった項目（undefined）は変えない。backgroundUrl / avatarUrl に null を渡すと消す。
 * 以前の updateProfile は、保存するたびにヘッダー画像を消してしまい、自己紹介を空にもできなかった。
 */
export async function saveProfile(input: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const displayName = input.displayName?.trim();
  const bio = input.bio?.trim();
  if (displayName !== undefined && (displayName.length === 0 || displayName.length > 100)) {
    return { ok: false, error: "表示名は1〜100文字にしてね💦" };
  }
  if (bio !== undefined && bio.length > 500) {
    return { ok: false, error: "自己紹介は500文字までだよ💦" };
  }
  // 画像は、このサーバーにアップロードしたものだけ受け付ける
  const isOwnFile = (url: string) => url.startsWith(`${process.env.NEXT_PUBLIC_DOMAIN}/files/`);
  for (const url of [input.avatarUrl, input.backgroundUrl]) {
    if (typeof url === "string" && !isOwnFile(url)) return { ok: false, error: "画像を保存できなかったわ💦" };
  }
  try {
    const { account, databases } = await createSessionClient();
    const session = await account.get();
    const update: Record<string, string | null> = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (bio !== undefined) update.bio = bio;
    if (input.avatarUrl !== undefined) update.avatarUrl = input.avatarUrl ?? "";
    if (input.backgroundUrl !== undefined) update.backgroundUrl = input.backgroundUrl;
    if (Object.keys(update).length === 0) return { ok: true };
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      session.$id,
      update
    );
    // フォロワーのサーバーにも知らせる。配信は返事のあとに行うので、保存は待たせない
    try {
      const deliver = await prepareProfileUpdate(session.$id);
      if (deliver) after(() => deliver().catch((e) => console.error("プロフィールの配信に失敗:", e?.message)));
    } catch (e: any) {
      console.error("プロフィールの配信の準備に失敗:", e?.message);
    }
    return { ok: true };
  } catch (error: any) {
    console.error("プロフィールの更新に失敗:", error?.message);
    return { ok: false, error: "プロフィールを保存できなかったわ💦" };
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
    // リモート投稿はURLの末尾がドキュメントIDではないので、activityIdで探す
    let appwritePostId = postId.split("/").pop();
    if(postId.startsWith("http") && !isInternalUrl(postId)){
      const { documents: [remotePost] } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_COLLECTION_ID!,
        [Query.equal("activityId", postId)]
      );
      appwritePostId = remotePost?.$id;
    }
    if(!appwritePostId){
      throw new Error("投稿が見つからないわ！💦");
    }

  const noteData = await getPost(appwritePostId, databases);
  const { documents : [actorDocument] }: Models.DocumentList<Actor>   = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    [Query.equal("actorId", noteData.attributedTo)]
  )
  const remoteActor = actorDocument ? null : await fetchRemoteActor(noteData.attributedTo, session.$id);
  if(!actorDocument && !remoteActor){
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
    "_user": remoteActor ?? {
      "@context": "https://www.w3.org/ns/activitystreams",
      "type": "Person",
      "id": actorDocument.actorId,
      "preferredUsername": actorDocument.preferredUsername,
      "displayName": actorDocument.displayName,
      "followers": actorDocument.actorId + "/followers",
      "following": actorDocument.actorId + "/following",
      "inbox": actorDocument.actorId + "/inbox",
      "outbox": actorDocument.actorId + "/outbox",
      "publicKey": {
        "id": actorDocument.actorId + "#main-key",
        "owner": actorDocument.actorId,
        "publicKeyPem": actorDocument.publicKey,
      },
      "icon":{
        "type": "Image",
        "url": actorDocument.avatarUrl || "",
      }
    },
    "_canDelete": actorDocument?.$id === session.$id
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