/**
 * 投稿APIエンドポイント！✨
 * POSTリクエストを受け取り、投稿ロジックをpost.tsに委譲！💖
 * シンプルでキラキラ、ギャル風エラーで親しみやすく！😎
 */
import {  NextResponse } from "next/server";
import { createSessionClient,  } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";
import {  savePost, deliverActivity } from "@/lib/activitypub/post";
import { getActorByUserId } from "@/lib/appwrite/database";
import { ENV } from "@/lib/api/config";
import { ActivityPubNote } from "@/types/activitypub";


// CORSの設定を追加するよ！✨
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
    },
  });
}

/**
 * 投稿API！✨
 * 画像付きの投稿を処理するよ！💖
 */
export async function POST(request: Request) {
  try {
    // セッションクライアントを作成
    const { account } = await createSessionClient(request);
    if (!account) {
      throw new Error("セッションが見つからないよ！💦");
    }

    // ログインユーザーを取得
    const user = await account.get();
    if (!user) {
      throw new Error("ユーザーが見つからないよ！💦");
    }

    const actor = await getActorByUserId(user.$id);
    if (!actor) {
      throw new Error("アクターが見つからないよ！💦");
    }
    const { content, visibility, images, inReplyTo, attributedTo } = await request.json();
    
    // 投稿を保存
    const { document, activity } = await savePost(
      { content, visibility, inReplyTo, attributedTo },
      {
        actorId: actor.actorId,
        preferredUsername: actor.preferredUsername,
        displayName: actor.displayName || "",
        followers: actor.followers || "",
        avatarUrl: actor.avatarUrl || "",
      },
      images
    );
    // ActivityPubで配信
    await deliverActivity(activity, {
      id: actor.actorId,
      privateKey: actor.privateKey,
      followers: actor.followers || "",
    });
    console.log("success");
    return NextResponse.json({ success: true, document }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
      }
    });
  } catch (error: any) {
    console.error("投稿に失敗したよ！💦", error);
    return NextResponse.json(
      { error: error.message || "投稿に失敗したよ！もう一度試してみてね！💦" },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
        }
      }
    );
  }
}

/**
 * 投稿一覧を取得するAPIエンドポイント！✨
 * ActivityPubのNote形式で投稿データを返すよ〜💖
 */
export async function GET(request: Request) {
  const date = Date.now();
  const LimitDate = new Date(date);
  LimitDate.setHours(LimitDate.getHours() - 84);
  const dateString = LimitDate.toISOString();
  
  // クエリビルダークラスでクエリ構築を最適化！✨
  class PostQueryBuilder {
    private queries: any[] = [];
    
    addPagination(limit: number, offset: number) {
      this.queries.push(Query.limit(limit), Query.offset(offset));
      return this;
    }
    
    addTimeFilter(dateString: string) {
      this.queries.push(Query.greaterThan("$createdAt", dateString));
      return this;
    }
    
    addOrdering() {
      this.queries.push(Query.orderDesc("$createdAt"));
      return this;
    }
    
    addInReplyTo(inReplyTo: string | null) {
      if (inReplyTo) {
        const searchReplyTo = `${ENV.DOMAIN}/posts/${inReplyTo}`;
        this.queries.push(Query.equal('inReplyTo', searchReplyTo));
      }
      return this;
    }
    
    addAttributedTo(attributedTo: string | null) {
      if (attributedTo) {
        this.queries.push(Query.equal('attributedTo', attributedTo));
      }
      return this;
    }
    
    addCursorPagination(lastId: string | null, firstId: string | null) {
      if (lastId) {
        this.queries.push(Query.cursorAfter(lastId));
      }
      if (firstId) {
        this.queries.push(Query.cursorBefore(firstId));
      }
      return this;
    }
    
    addMutedUsersFilter(mutedUsers: string[]) {
      if (mutedUsers && mutedUsers.length > 0) {
        this.queries.push(Query.notEqual("attributedTo", mutedUsers));
      }
      return this;
    }
    
    build() {
      return this.queries;
    }
  }
  
  // URLからクエリパラメータを直接パース
  let limit: string = "20";
  let offset: string = "0";
  let inReplyTo: string | null = null;
  let attributedTo: string | null = null;
  let lastId: string | null = null;
  let firstId: string | null = null;
  
  try {
    const url = new URL(request.url);
    limit = url.searchParams.get("limit") || "20";
    offset = url.searchParams.get("offset") || "0";
    inReplyTo = url.searchParams.get("inReplyTo");
    attributedTo = url.searchParams.get("attributedTo");
    lastId = url.searchParams.get("lastId");
    firstId = url.searchParams.get("firstId");
  } catch (error) {
    console.error("URLパースエラー:", error);
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  
  // クエリビルダーを使用してクエリを構築
  const queryBuilder = new PostQueryBuilder()
    .addOrdering()
    .addPagination(parseInt(limit), parseInt(offset))
    .addTimeFilter(dateString)
    .addInReplyTo(inReplyTo)
    .addAttributedTo(attributedTo)
    .addCursorPagination(lastId, firstId);
    
  const queries = queryBuilder.build();
  try {
    let userId: string | null = null;
    const { databases, account } = await createSessionClient(request);    
    const user = await account.get();
    if(!user){
      return NextResponse.json({ error: "ログインしてないよ！💦" }, { status: 400 });
    }
    userId = process.env.NEXT_PUBLIC_DOMAIN + "/users/" + user.$id;
    const         posts = await databases.listDocuments(
      ENV.DATABASE_ID,
      ENV.POSTS_COLLECTION_ID,
      queries
    );
    
    // ActivityPubのNote形式に変換！✨
    const notes = await convertPostsToNotes(posts.documents, databases, userId);
    return NextResponse.json({ notes, total: posts.total }, {
      headers: {
        'Content-Type': 'application/activity+json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
      }
    });
    
  } catch (error) {
    //console.error("投稿の取得に失敗したよ！💦", error);
    return NextResponse.json(
      { error: "投稿の取得に失敗したよ！💦" },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
        }
      }
    );
  }
}


/**
 * 投稿をActivityPubのNote形式に変換する関数！✨
 */
const convertPostsToNotes = async (posts: any[], databases: any, userId: string ) => {
  
  const notes :ActivityPubNote[] = [];
  const actors :any[] = [];
  try{
  for (const post of posts) {
    if(post.attributedTo){
      if(!actors.find((actor) => actor.id === post.attributedTo)){
        const {documents : [actorDocument]} = await databases.listDocuments(
          ENV.DATABASE_ID,
          ENV.ACTORS_COLLECTION_ID,
          [Query.equal("actorId", post.attributedTo)]
        );
        const actor = {
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
            "url": actorDocument.avatarUrl,
          }
        }
        actors.push(actor);
      }
    }
    const {total: totalLikes} = await databases.listDocuments(
      ENV.DATABASE_ID,
      process.env.APPWRITE_LIKES_COLLECTION_ID || "",
      [Query.equal("object", post.activityId)]
    );
    let isLiked = false;
    if(userId){
      //console.log("userId", userId);
      //console.log("post.activityId", post.activityId);
      const {total: totalIsLiked} = await databases.listDocuments(
        ENV.DATABASE_ID,
        process.env.APPWRITE_LIKES_COLLECTION_ID || "",
        [Query.equal("object", post.activityId), Query.equal("actor", userId)]
      );
      //console.log("totalIsLiked", totalIsLiked);
      isLiked = totalIsLiked > 0;
    }
    const note :ActivityPubNote = {
      "@context": "https://www.w3.org/ns/activitystreams",
      "type": "Note",
      "id": post.activityId,
      "attributedTo":  post.attributedTo,
      "content": post.content,
      "published": post.published || post.$createdAt,
      "url": post.activityId,
      "to": post.to,
      "cc": post.cc,
      "inReplyTo": post.inReplyTo,
      "attachment": post.attachment,
      "likes": {
        "totalItems": totalLikes || 0,
        "first": post.activityId + "/likes?page=1",
        "last": post.activityId + "/likes?page=" + Math.ceil(totalLikes / 20),
      },
      "replies": {
        "totalItems": post.replies?.totalItems || 0,
        "first": post.activityId + "/replies?page=1",
        "last": post.activityId + "/replies?page=" + Math.ceil(post.replies?.totalItems / 20),
      },
      "repost": {
        "totalItems": post.repost?.totalItems || 0,
        "first": post.activityId + "/repost?page=1",
        "last": post.activityId + "/repost?page=" + Math.ceil(post.repost?.totalItems / 20),
      },
      "_isLiked": isLiked,
      "_user": actors.find((actor) => actor.id === post.attributedTo) || null,
    }
    notes.push(note);
    }
      //console.log("notes", notes);
    return notes;
  } catch (error) {
    console.error("投稿の変換に失敗したよ！💦", error);
    return [];
  }
};