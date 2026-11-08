/**
 * 投稿APIエンドポイント！✨
 * POSTリクエストを受け取り、投稿ロジックをpost.tsに委譲！💖
 * シンプルでキラキラ、ギャル風エラーで親しみやすく！😎
 */
import {  NextResponse } from "next/server";
import { createSessionClient,  } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";
import { savePost, deliverActivity, validatePostInput } from "@/lib/activitypub/post";
import { getEncryptedPrivateKey } from "@/lib/activitypub/privateKeyStore";
import { isPublicDocument, postWindowStart, toClientNotes, viewerClient } from "@/lib/activitypub/clientNotes";
import { ENV } from "@/lib/api/config";
import { makeFilesPublic } from "@/lib/appwrite/filePermissions";
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

    const body = await request.json().catch(() => null);
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
    // 本文の長さ・公開範囲・添付（このサーバーのファイルだけ）を確かめる
    const parsed = (() => {
      try {
        return { ok: true as const, value: validatePostInput(body) };
      } catch {
        return { ok: false as const };
      }
    })();
    if (!parsed.ok) {
      return NextResponse.json({ error: "投稿の内容が正しくないみたい💦" }, { status: 400 });
    }
    const { content, visibility, images, inReplyTo } = parsed.value;
    // 投稿を保存
    const { document, activity } = await savePost(
      { content: content.trim(), visibility, inReplyTo },
      {
        userId: user.$id,
      },
      images,
      databases
    );
    // 公開の投稿の画像は、誰でも読めるようにしておく（外のサーバーが取りに来る前に）
    if (visibility === "public") {
      await makeFilesPublic(images.map((image) => image.url), user.$id);
    }
    // ActivityPubで配信
    await deliverActivity(activity, {
      id: user.actorId,
      privateKey: await getEncryptedPrivateKey(user.$id),
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
 *
 * クエリ: limit, attributedTo, inReplyTo（投稿の$id）, lastId（続きを取得するときのカーソル）, scope（local で自サーバーの投稿だけ）
 * 返り値: { notes, total, nextCursor }。nextCursor が null なら続きはない。
 * 表示するのは直近84時間の投稿だけ（意図的な仕様）。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1), 50);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
  const inReplyTo = url.searchParams.get("inReplyTo");
  const attributedTo = url.searchParams.get("attributedTo");
  const lastId = url.searchParams.get("lastId");
  // local: このサーバーの投稿だけ / それ以外: 連合（届いた投稿もすべて）
  const scope = url.searchParams.get("scope");

  const queries = [
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.greaterThan("$createdAt", postWindowStart()),
    ...(inReplyTo ? [Query.equal("inReplyTo", `${ENV.DOMAIN}/posts/${inReplyTo}`)] : []),
    ...(attributedTo ? [Query.equal("attributedTo", attributedTo)] : []),
    ...(scope === "local" ? [Query.startsWith("activityId", `${ENV.DOMAIN}/`)] : []),
    // カーソルがあればそれを使う（件数のずらし方式は、新しい投稿が来ると重複やずれが出る）
    ...(lastId ? [Query.cursorAfter(lastId)] : offset > 0 ? [Query.offset(offset)] : []),
  ];

  try {
    const { databases, userId } = await viewerClient(request);
    // ログインしていない人に見せるのは、ユーザーページの公開投稿とリプライだけ（タイムラインは見せない）
    if (!userId && !attributedTo && !inReplyTo) throw Object.assign(new Error("unauthorized"), { code: 401 });
    const [posts, viewer] = await Promise.all([
      databases.listDocuments(ENV.DATABASE_ID, ENV.POSTS_COLLECTION_ID, queries) as Promise<Models.DocumentList<Post>>,
      userId ? databases.getDocument(ENV.DATABASE_ID, actorsId(), userId).catch(() => null) : Promise.resolve(null),
    ]);
    // ミュートしたユーザーの投稿は返さない
    const muted = new Set<string>(viewer?.mutedUsers ?? []);
    const visible = posts.documents.filter(
      (post: any) => !muted.has(post.attributedTo) && (userId || isPublicDocument(post))
    );
    const notes = await toClientNotes(visible, databases, userId ?? "");
    const last = posts.documents[posts.documents.length - 1];
    return NextResponse.json({
      notes,
      total: posts.total,
      nextCursor: posts.documents.length === limit && last ? last.$id : null,
    }, {
      headers: {
        'Content-Type': 'application/activity+json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
      }
    });
  } catch (error: any) {
    const status = error?.code === 401 ? 401 : 500;
    return NextResponse.json(
      { error: status === 401 ? "ログインしてないよ！💦" : "投稿の取得に失敗したよ！💦" },
      {
        status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
        }
      }
    );
  }
}

const actorsId = () => process.env.APPWRITE_ACTORS_COLLECTION_ID || "";
