/**
 * 投稿APIエンドポイント！✨
 * POSTリクエストを受け取り、投稿ロジックをpost.tsに委譲！💖
 * シンプルでキラキラ、ギャル風エラーで親しみやすく！😎
 */
import {  NextResponse } from "next/server";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";
import { savePost, deliverActivity, validatePostInput } from "@/lib/activitypub/post";
import { getEncryptedPrivateKey } from "@/lib/activitypub/privateKeyStore";
import { isPublicDocument, postWindowStart, resolveActors, toClientNotes, viewerClient } from "@/lib/activitypub/clientNotes";
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
    // 投稿を保存（posts にはセッションでは作れないので、ログインを確かめたうえで管理者の権限で。
    // 投稿者はセッションのユーザーに固定し、ドキュメントには本人用の権限を付ける）
    const { databases: adminDatabases } = await createAdminClient();
    const { document, activity } = await savePost(
      { content: content.trim(), visibility, inReplyTo },
      {
        userId: user.$id,
      },
      images,
      adminDatabases
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
 * タイムライン（attributedTo / inReplyTo なし）には、ブーストも時間順に混ぜる（_boostedBy 付き）。
 * ブーストで出すのも、投稿されてから84時間以内の投稿だけ（古い投稿を掘り返さない）。
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

  // タイムラインは投稿とブーストを時間で混ぜるので、カーソルは時刻（"t:" 付き）にする
  const isTimeline = !attributedTo && !inReplyTo;
  const before = lastId?.startsWith(TIME_CURSOR) ? lastId.slice(TIME_CURSOR.length) : null;
  const queries = [
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.greaterThan("$createdAt", postWindowStart()),
    ...(before ? [Query.lessThanEqual("$createdAt", before)] : []),
    ...(inReplyTo ? [Query.equal("inReplyTo", `${ENV.DOMAIN}/posts/${inReplyTo}`)] : []),
    ...(attributedTo ? [Query.equal("attributedTo", attributedTo)] : []),
    ...(scope === "local" ? [Query.startsWith("activityId", `${ENV.DOMAIN}/`)] : []),
    // カーソルがあればそれを使う（件数のずらし方式は、新しい投稿が来ると重複やずれが出る）
    ...(lastId && !before ? [Query.cursorAfter(lastId)] : offset > 0 && !before ? [Query.offset(offset)] : []),
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
    if (isTimeline && userId) {
      const timeline = await withBoosts(databases, visible, posts.documents, limit, { before, scope, muted, userId });
      return NextResponse.json({ notes: timeline.notes, total: posts.total, nextCursor: timeline.nextCursor }, { headers: corsHeaders });
    }
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

const TIME_CURSOR = "t:";
const corsHeaders = {
  'Content-Type': 'application/activity+json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
};

/**
 * タイムラインの投稿に、ブーストを時間順に混ぜる。
 * 同じ投稿が何回も出ないよう、いちばん新しい1件（投稿そのものか、ブースト）だけ残す。
 * @param posts 見せてよい投稿 / rawPosts ミュートで外す前の投稿（続きがあるかと、カーソルの計算に使う）
 */
async function withBoosts(
  databases: any,
  posts: any[],
  rawPosts: any[],
  limit: number,
  { before, scope, muted, userId }: { before: string | null; scope: string | null; muted: Set<string>; userId: string }
) {
  const sharesCollection = process.env.APPWRITE_SHARES_COLLECTION_ID;
  const windowStart = postWindowStart();
  // ブーストのドキュメントは本人しか読めない権限なので、管理者で読む（出すのは公開の投稿へのブーストだけ）
  const { databases: adminDatabases } = await createAdminClient();
  const shares: any[] = sharesCollection
    ? await adminDatabases.listDocuments(ENV.DATABASE_ID, sharesCollection, [
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.greaterThan("$createdAt", windowStart),
        ...(before ? [Query.lessThanEqual("$createdAt", before)] : []),
        // local: このサーバーの人のブーストだけ
        ...(scope === "local" ? [Query.startsWith("actor", `${ENV.DOMAIN}/`)] : []),
      ]).then(({ documents }: any) => documents).catch(() => [])
    : [];
  const postsFull = rawPosts.length === limit;
  const sharesFull = shares.length === limit;

  // ブーストされた投稿（投稿されてから84時間以内で、公開のものだけ）
  const objectIds = [...new Set(shares.map((share) => share.object as string))];
  const boostedPosts: any[] = objectIds.length > 0
    ? await databases.listDocuments(ENV.DATABASE_ID, ENV.POSTS_COLLECTION_ID, [
        Query.equal("activityId", objectIds),
        Query.limit(objectIds.length),
      ]).then(({ documents }: any) => documents).catch(() => [])
    : [];
  const boostedById = new Map<string, any>();
  for (const post of boostedPosts) {
    const published = Date.parse(post.published || post.$createdAt);
    if (published < Date.parse(windowStart) || !isPublicDocument(post) || muted.has(post.attributedTo)) continue;
    boostedById.set(post.activityId, post);
  }

  type Entry = { at: string; post: any; share?: any };
  const entries: Entry[] = [
    ...posts.map((post) => ({ at: post.$createdAt as string, post })),
    ...shares
      .filter((share) => boostedById.has(share.object) && !muted.has(share.actor))
      .map((share) => ({ at: share.$createdAt as string, post: boostedById.get(share.object), share })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  // どちらかが limit 件ちょうど取れていたら続きがある。混ぜたので、limit 件までに切る
  const page = entries.slice(0, limit);
  const hasMore = postsFull || sharesFull || entries.length > limit;
  const seen = new Set<string>();
  const unique = page.filter((entry) => {
    if (seen.has(entry.post.activityId)) return false;
    seen.add(entry.post.activityId);
    return true;
  });

  const notePosts = [...new Map(unique.map((entry) => [entry.post.activityId, entry.post])).values()];
  const [notes, boosters] = await Promise.all([
    toClientNotes(notePosts, databases, userId),
    resolveActors(unique.flatMap((entry) => (entry.share ? [entry.share.actor] : [])), databases, userId),
  ]);
  const noteById = new Map(notes.map((note) => [note.id, note]));
  const merged = unique.flatMap((entry) => {
    const note = noteById.get(entry.post.activityId);
    if (!note) return [];
    if (!entry.share) return [note];
    return [{ ...note, _boostedBy: boosters.get(entry.share.actor) ?? null, _boostedAt: entry.at }];
  });
  // ミュートなどで1件も残らなかったときも、取得した分の新しいほうの端から続ける（止まらないように）
  const fallback = [rawPosts.at(-1)?.$createdAt, shares.at(-1)?.$createdAt].filter(Boolean).sort().pop();
  const cursorAt = page.at(-1)?.at ?? fallback;
  return { notes: merged, nextCursor: hasMore && cursorAt ? `${TIME_CURSOR}${cursorAt}` : null };
}
