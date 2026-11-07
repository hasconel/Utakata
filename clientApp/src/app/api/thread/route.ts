/**
 * 投稿詳細用のAPI！✨
 * GET /api/thread?id=<投稿のURL>
 * 投稿・リプライ先・リプライ一覧を1回で返すよ。{ post, parent, replies }
 * （以前は投稿を表示してからリプライ先を取りに行っていたので遅かった）
 */
import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { postWindowStart, toClientNotes } from "@/lib/activitypub/clientNotes";
import { isInternalUrl } from "@/lib/utils";

const MAX_REPLIES = 50;

const dbId = () => process.env.APPWRITE_DATABASE_ID!;
const postsId = () => process.env.APPWRITE_POSTS_COLLECTION_ID!;

/** 投稿のURLから保存済みの投稿を探す。見つからなければ null。 */
async function findPost(databases: any, id: string) {
  // ローカルの投稿はURLの末尾がドキュメントID
  if (isInternalUrl(id)) {
    const documentId = new URL(id, process.env.NEXT_PUBLIC_DOMAIN).pathname.split("/").pop();
    if (documentId) {
      const post = await databases.getDocument(dbId(), postsId(), documentId).catch(() => null);
      if (post) return post;
    }
  }
  const { documents } = await databases.listDocuments(dbId(), postsId(), [Query.equal("activityId", id), Query.limit(1)]);
  return documents[0] ?? null;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "投稿のIDが必要だよ！💦" }, { status: 400 });
  }
  try {
    const { databases, account } = await createSessionClient(request);
    const user = await account.get().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "ログインしてないよ！💦" }, { status: 401 });
    }

    const post = await findPost(databases, id);
    if (!post) {
      return NextResponse.json({ error: "投稿が見つからなかったよ！💦" }, { status: 404 });
    }
    const [parent, { documents: replies }] = await Promise.all([
      post.inReplyTo ? findPost(databases, post.inReplyTo) : Promise.resolve(null),
      // リプライも、タイムラインと同じく直近の投稿だけ
      databases.listDocuments(dbId(), postsId(), [
        Query.equal("inReplyTo", post.activityId),
        Query.greaterThan("$createdAt", postWindowStart()),
        Query.orderAsc("$createdAt"),
        Query.limit(MAX_REPLIES),
      ]),
    ]);

    const [postNote, ...rest] = await toClientNotes([post, ...(parent ? [parent] : []), ...replies], databases, user.$id);
    return NextResponse.json({
      post: postNote,
      parent: parent ? rest[0] : null,
      replies: parent ? rest.slice(1) : rest,
    });
  } catch (error: any) {
    console.error("投稿詳細の取得に失敗:", error?.message);
    return NextResponse.json({ error: "投稿の取得に失敗したよ！💦" }, { status: 500 });
  }
}
