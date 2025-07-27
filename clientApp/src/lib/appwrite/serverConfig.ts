"use server";
import { Client, Account, Databases, Storage, Users, Query, ID,  } from "node-appwrite";
import { cookies } from "next/headers";
import { getActorByUserId } from "./database";
import { MeiliSearch } from "meilisearch";
import { Post } from "@/lib/appwrite/posts";
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
      session = cookie.headers.get("cookie")?.split("; ")[0].split("=")[1];
      //console.log("session", session);
    } else {
      session = (await cookies()).get("my-custom-session")?.value;
    }
    if (session) {
      client.setSession(session);
    } else {
      //throw new Error("セッションが見つからないよ！💦");
    }
    //if (!session) throw new Error("セッションが見つからないよ！💦");
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
    console.error("セッションエラー:", error);
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
    const post = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      postId
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
    const currentUser = await getActorByUserId(session.$id);
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
  const { databases,account } = await createSessionClient();
  const session = await account.get();
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    [Query.equal("to", `https://${process.env.APPWRITE_DOMAIN}/users/${session.name}`),Query.orderDesc("$createdAt"),Query.greaterThan("$updatedAt",new Date(Date.now()-1000*60*60*84).toISOString())]
  );
  return documents
}

export async function getUnreadNotifications() {
  const { databases ,account} = await createSessionClient();
  const session = await account.get();
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    [Query.equal("read", false),Query.equal("to", `https://${process.env.APPWRITE_DOMAIN}/users/${session.name}`)]
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
export async function getPostFromActivityId(activityId:string): Promise<Post> {
  try{
  const { databases } = await createSessionClient();  
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_POSTS_COLLECTION_ID!,
    [Query.equal("activityId", activityId)]
  );
  const post : Post = {
    id: documents[0].$id,
    "@context": documents[0]["@context"],
    type: documents[0].type,
    content: documents[0].content,
    published: documents[0].published,
    attributedTo: documents[0].attributedTo,
    to: documents[0].to,
    cc: documents[0].cc,
    inReplyTo: documents[0].inReplyTo,
    attachment: documents[0].attachment,
    tag: documents[0].tag,
    replies: documents[0].replies,
    summary: documents[0].summary,
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
export async function getTimelinePosts(limit: number = 10, offset: number = 0) {
  try {
    const { databases } = await createSessionClient();
    
    // メインの投稿を取得
    const { documents } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ]
    );

    // サブドキュメントをバッチで取得（N+1問題を解決）
    const subDocumentPromises = documents.map(document =>
      databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
        document.$id
      ).catch(() => ({
        replyCount: 0,
        LikedActors: []
      }))
    );

    const subDocuments = await Promise.all(subDocumentPromises);

    // 投稿データを構築
    const posts: Post[] = documents.map((document, index) => {
      const subdocument = subDocuments[index];
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
        inReplyTo: document.inReplyTo,
        replyCount: subdocument.replyCount || 0,
        attributedTo: document.attributedTo,
        attachment: document.attachment,
        LikedActors: subdocument.LikedActors || [],
        avatar: document.avatar,
      } as unknown as Post;
    });

    return posts;
  } catch (error) {
    throw new Error('タイムラインの取得に失敗したよ！💦');
  }
}

/**
 * 投稿の詳細を取得！✨
 * 投稿をキラキラに取得するよ！💖
 */
export async function getPost(postId: string) {
  try {
    const { databases } = await createSessionClient();
    const document = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      postId
    );
    return document;
  } catch (error) {
    throw new Error('投稿の取得に失敗したよ！💦');
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
export async function getReplyPostsFromActivityId(activityId: string) {
  const { databases } = await createSessionClient();
  const { documents } = await databases.listDocuments(
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
    } as unknown as Post;
  });
}