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
    const { document, activity, parentActorId } = await savePost(
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
    }, parentActorId || null);

    return NextResponse.json({ success: true, document }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
      }
    });
  } catch (error: any) {
    //console.error("投稿に失敗したよ！💦", error);
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
  let userId: string | null = null;
  let attributedTo: string | null = null;
  let lastId: string | null = null;
  let firstId: string | null = null;
  
  try {
    const url = new URL(request.url);
    limit = url.searchParams.get("limit") || "20";
    offset = url.searchParams.get("offset") || "0";
    inReplyTo = url.searchParams.get("inReplyTo");
    userId = url.searchParams.get("userId");
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
    const { databases } = await createSessionClient(request);    
    let posts: any;
    
    // ミュートユーザーフィルターをクエリビルダーで追加
    if(userId){
      const currentUserActor = await getActorByUserId(userId);
      if(currentUserActor?.mutedUsers && currentUserActor.mutedUsers.length > 0){
        queryBuilder.addMutedUsersFilter(currentUserActor.mutedUsers);
        // 更新されたクエリを取得
        const updatedQueries = queryBuilder.build();
        posts = await databases.listDocuments(
          ENV.DATABASE_ID,
          ENV.POSTS_COLLECTION_ID,
          updatedQueries
        );
      } else {
        posts = await databases.listDocuments(
          ENV.DATABASE_ID,
          ENV.POSTS_COLLECTION_ID,
          queries
        );
      }
    } else {
      posts = await databases.listDocuments(
        ENV.DATABASE_ID,
        ENV.POSTS_COLLECTION_ID,
        queries
      );
    }
    
    const postsAsPostArray: string[] = [];
    for(const post of posts.documents){
      const postId: string = post.activityId;
      postsAsPostArray.push(postId);
    }

    return NextResponse.json({postsAsPostArray}, {
      headers: {
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
