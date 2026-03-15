/**
 * 投稿APIエンドポイント！✨
 * POSTリクエストを受け取り、投稿ロジックをpost.tsに委譲！💖
 * シンプルでキラキラ、ギャル風エラーで親しみやすく！😎
 */
import {  NextResponse } from "next/server";
import { createSessionClient,  } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";
import {  savePost, deliverActivity } from "@/lib/activitypub/post";
import { ENV } from "@/lib/api/config";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import { Post } from "@/types/appwrite";
import { Models } from "node-appwrite";

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
    const { account, databases } = await createSessionClient(request);
    if (!account) {
      throw new Error("セッションが見つからないよ！💦");
    }

    // ログインユーザーを取得
    const userId = await account.get();
    if (!userId) {
      throw new Error("ユーザーが見つからないよ！💦");
    }
    const user = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || "",
      process.env.APPWRITE_ACTORS_COLLECTION_ID || "",
      userId.$id
    );
    if (!user) {
      throw new Error("ユーザーが見つからないよ！💦");
    }
    const { content, visibility, images, inReplyTo, attributedTo } = await request.json();
    // 投稿を保存
    const { document, activity } = await savePost(
      { content, visibility, inReplyTo, attributedTo },
      {
        userId: user.$id,
      },
      images,
      databases
    );
    // ActivityPubで配信
    await deliverActivity(activity, {
      id: user.actorId,
      privateKey: user.privateKey,
      followers: user.actorId + "/followers",
    });
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
  let skipLikes = false;

  try {
    const url = new URL(request.url);
    limit = url.searchParams.get("limit") || "20";
    offset = url.searchParams.get("offset") || "0";
    inReplyTo = url.searchParams.get("inReplyTo");
    attributedTo = url.searchParams.get("attributedTo");
    lastId = url.searchParams.get("lastId");
    firstId = url.searchParams.get("firstId");
    skipLikes = url.searchParams.get("skipLikes") === "1";
  } catch (error) {
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
    const         posts : Models.DocumentList<Post> = await databases.listDocuments(
      ENV.DATABASE_ID,
      ENV.POSTS_COLLECTION_ID,
      queries
    );
    
    // ActivityPubのNote形式に変換！✨ skipLikes=1 でいいね取得を省略して高速化
    const notes = await convertPostsToNotes(posts.documents, databases, userId, skipLikes);
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

const dbId = () => process.env.APPWRITE_DATABASE_ID || "";
const actorsId = () => process.env.APPWRITE_ACTORS_COLLECTION_ID || "";
const likesId = () => process.env.APPWRITE_LIKES_COLLECTION_ID || "";

/**
 * 投稿をActivityPubのNote形式に変換！✨
 * skipLikes=true のときはいいね取得をスキップ（20 クエリ省略で 2〜3 秒短縮）💖
 * アクターは直列取得（並列だと接続で遅くなることがある）
 */
const convertPostsToNotes = async (posts: any[], databases: any, userId: string, skipLikes = false): Promise<ActivityPubNoteInClient[]> => {
  try {
    const uniqueAttributedTo = [...new Set(posts.map((p) => p.attributedTo).filter(Boolean))] as string[];
    const actorMap = new Map<string, any>();

    for (const actorId of uniqueAttributedTo) {
      try {
        const { documents } = await databases.listDocuments(dbId(), actorsId(), [Query.equal("actorId", actorId)]);
        const doc = documents[0];
        if (doc) {
          actorMap.set(actorId, {
            "@context": "https://www.w3.org/ns/activitystreams",
            type: "Person",
            id: doc.actorId,
            preferredUsername: doc.preferredUsername,
            displayName: doc.displayName,
            followers: doc.actorId + "/followers",
            following: doc.actorId + "/following",
            inbox: doc.actorId + "/inbox",
            outbox: doc.actorId + "/outbox",
            publicKey: { id: doc.actorId + "#main-key", owner: doc.actorId, publicKeyPem: doc.publicKey },
            icon: { type: "Image", url: doc.avatarUrl },
          });
        }
      } catch {
        /* 1件失敗しても続行 */
      }
    }

    let likeResults: { totalLikes: number; isLiked: boolean }[];
    if (skipLikes) {
      likeResults = posts.map(() => ({ totalLikes: 0, isLiked: false }));
    } else {
      likeResults = [];
      for (const post of posts) {
        try {
          const [likesRes, isLikedRes] = await Promise.all([
            databases.listDocuments(dbId(), likesId(), [Query.equal("object", post.activityId)]),
            userId ? databases.listDocuments(dbId(), likesId(), [Query.equal("object", post.activityId), Query.equal("actor", userId)]) : Promise.resolve({ total: 0 }),
          ]);
          likeResults.push({ totalLikes: likesRes.total ?? 0, isLiked: (isLikedRes.total ?? 0) > 0 });
        } catch {
          likeResults.push({ totalLikes: 0, isLiked: false });
        }
      }
    }

    return posts.map((post, i) => {
      const { totalLikes, isLiked } = likeResults[i];
      const actor = post.attributedTo ? actorMap.get(post.attributedTo) ?? null : null;
      return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        type: "Note",
        id: post.activityId,
        attributedTo: post.attributedTo,
        content: post.content,
        published: post.published || post.$createdAt,
        url: post.activityId,
        to: post.to,
        cc: post.cc,
        inReplyTo: post.inReplyTo,
        attachment: post.attachment,
        likes: {
          totalItems: totalLikes,
          first: post.activityId + "/likes?page=1",
          last: post.activityId + "/likes?page=" + Math.ceil(totalLikes / 20),
        },
        replies: {
          totalItems: post.replies?.totalItems || 0,
          first: post.activityId + "/replies?page=1",
          last: post.activityId + "/replies?page=" + Math.ceil((post.replies?.totalItems || 0) / 20),
        },
        repost: {
          totalItems: post.repost?.totalItems || 0,
          first: post.activityId + "/repost?page=1",
          last: post.activityId + "/repost?page=" + Math.ceil((post.repost?.totalItems || 0) / 20),
        },
        _isLiked: isLiked,
        _user: actor,
        _canDelete: post.attributedTo === userId,
      };
    });
  } catch (error) {
    console.error("投稿の変換に失敗したよ！💦", error);
    return [];
  }
};