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
  const { searchParams } = new URL(request.url);
  //console.log("searchParams", searchParams);
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";
  const inReplyTo = searchParams.get("inReplyTo") ;
  const userId = searchParams.get("userId") ;
  const searchReplyTo = inReplyTo? [`${ENV.DOMAIN}/posts/${inReplyTo}`] : "";
  const inReplyToQuery = inReplyTo? Query.equal('inReplyTo',searchReplyTo) : "";
  const attributedTo = searchParams.get("attributedTo") ;
  //console.log("ENV.DOMAIN",ENV.DOMAIN);
  //console.log("attributedTo",attributedTo);
  const searchAttributedTo = attributedTo? [attributedTo] : "";
  const attributedToQuery = attributedTo? Query.equal('attributedTo',searchAttributedTo) : "";
  const lastId = searchParams.get("lastId") ;
  const lastIdQuery = lastId? Query.cursorAfter(lastId) :"";
  const firstId = searchParams.get("firstId") ;
  const firstIdQuery = firstId? Query.cursorBefore(firstId) :"";
  const queries = [
    Query.orderDesc("$createdAt"),
    Query.limit(parseInt(limit)),
    Query.offset(parseInt(offset)),
    Query.greaterThan("$createdAt",dateString)
  ]
  if (inReplyTo) {
    queries.push(inReplyToQuery)
  }
  if (attributedTo) {
    queries.push(attributedToQuery)
  }
  if (lastId) {
    queries.push(lastIdQuery)
  }
  if (firstId) {
    queries.push(firstIdQuery)
  }
  try {
    const { databases } = await createSessionClient(request);    
    if(userId){
      const currentUserActor = await getActorByUserId(userId);
      if(currentUserActor?.mutedUsers && currentUserActor.mutedUsers.length > 0){
        queries.push(Query.notEqual("attributedTo", currentUserActor.mutedUsers))
      }
    }

    const posts = await databases.listDocuments(
      ENV.DATABASE_ID,
      ENV.POSTS_COLLECTION_ID,
      queries
    );
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
