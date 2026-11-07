/**
 * 投稿の検索API！🫧
 * GET /api/search?q=<言葉>&offset=<続きの位置>
 *   → { notes, nextOffset }   （nextOffset が null なら続きはない）
 *
 * ・ログインが必要
 * ・絞り込み（直近84時間）と新しい順の並び替えは Meilisearch 側で行う
 *   （以前は上位20件を受け取ってから絞り込んでいたので、古い投稿が多いと結果が空になった）
 * ・結果の投稿は Appwrite からまとめて取り直す。閲覧者の権限で読むので、読めない投稿は出ない
 * ・ミュートしている人の投稿は出さない
 */
import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { toClientNotes } from "@/lib/activitypub/clientNotes";
import { searchPostIds } from "@/lib/search/meili";
import { POST_WINDOW_MS } from "@/lib/postWindow";

const PAGE_SIZE = 20;
const MAX_QUERY_LENGTH = 200;
const MAX_OFFSET = 500;

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const offset = Math.min(MAX_OFFSET, Math.max(0, Number(request.nextUrl.searchParams.get("offset")) || 0));

  try {
    const { databases, account } = await createSessionClient(request);
    const user = await account.get().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "ログインしてないよ！💦" }, { status: 401 });
    }
    // 空の言葉で検索すると全件が対象になってしまうので、何も返さない
    if (!q) return NextResponse.json({ notes: [], nextOffset: null });

    const dbId = process.env.APPWRITE_DATABASE_ID!;
    const [{ ids, hasMore }, viewer] = await Promise.all([
      searchPostIds(q, { since: Date.now() - POST_WINDOW_MS, limit: PAGE_SIZE, offset }),
      databases.getDocument(dbId, process.env.APPWRITE_ACTORS_COLLECTION_ID!, user.$id).catch(() => null),
    ]);
    const nextOffset = hasMore ? offset + PAGE_SIZE : null;
    if (ids.length === 0) return NextResponse.json({ notes: [], nextOffset });

    // 検索結果の投稿をまとめて取得（消された投稿は見つからないので自然に除かれる）
    const { documents } = await databases.listDocuments(dbId, process.env.APPWRITE_POSTS_COLLECTION_ID!, [
      Query.equal("$id", ids),
      Query.limit(ids.length),
    ]);
    const muted = new Set<string>((viewer as any)?.mutedUsers ?? []);
    const byId = new Map(documents.map((doc: any) => [doc.$id, doc]));
    // Meilisearch の順番（新しい順）を保つ
    const posts = ids.map((id) => byId.get(id)).filter((post: any) => post && !muted.has(post.attributedTo));

    const notes = await toClientNotes(posts, databases, user.$id);
    return NextResponse.json({ notes, nextOffset });
  } catch (error: any) {
    console.error("検索に失敗:", error?.message);
    return NextResponse.json({ error: "検索できなかったわ！💦" }, { status: 500 });
  }
}
