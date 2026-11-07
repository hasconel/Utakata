/**
 * Meilisearch による投稿検索🫧
 *
 * サーバー専用。"use server" を付けないこと（外部から呼べる関数として公開されてしまう）。
 *
 * 環境変数
 *   MEILISEARCH_HOST        Meilisearch のURL（無ければ旧名の NEXT_PUBLIC_MEILISEARCH_HOST）
 *   MEILISEARCH_API_KEY     追加・削除用のキー（documents.add / documents.delete ができるもの）
 *   MEILISEARCH_SEARCH_KEY  検索用のキー（search だけのもの。無ければ MEILISEARCH_API_KEY を使う）
 *
 * インデックス "notes"（主キー id = Appwrite の $id）にはローカルの投稿だけを入れる。
 * 以前の "posts" インデックスは日時が文字列で、絞り込みや並び替えができなかった。
 * 設定と既存投稿の入れ直しは scripts/reindex-search.mjs で行う（設定はそちらと同じにしておくこと）。
 */
import { MeiliSearch } from "meilisearch";
import { isInternalUrl } from "@/lib/utils";

export const SEARCH_INDEX = "notes";
const PUBLIC = "https://www.w3.org/ns/activitystreams#Public";

const host = () => process.env.MEILISEARCH_HOST || process.env.NEXT_PUBLIC_MEILISEARCH_HOST || "";

let writer: MeiliSearch | null = null;
let reader: MeiliSearch | null = null;

function writeClient() {
  if (!host() || !process.env.MEILISEARCH_API_KEY) return null;
  writer ??= new MeiliSearch({ host: host(), apiKey: process.env.MEILISEARCH_API_KEY });
  return writer;
}

function searchClient() {
  const apiKey = process.env.MEILISEARCH_SEARCH_KEY || process.env.MEILISEARCH_API_KEY;
  if (!host() || !apiKey) return null;
  reader ??= new MeiliSearch({ host: host(), apiKey });
  return reader;
}

export interface SearchDocument {
  id: string;
  activityId: string;
  attributedTo: string;
  content: string;
  /** 投稿日時（ミリ秒）。絞り込みと並び替えに使う */
  publishedAt: number;
  isPublic: boolean;
}

/** Appwrite の投稿ドキュメントを検索用の形にする。ローカルの投稿でなければ null */
export function toSearchDocument(post: any): SearchDocument | null {
  if (!post?.$id || !post?.activityId || !isInternalUrl(post.activityId)) return null;
  const publishedAt = Date.parse(post.published || post.$createdAt);
  return {
    id: post.$id,
    activityId: post.activityId,
    attributedTo: post.attributedTo,
    content: post.content || "",
    publishedAt: Number.isFinite(publishedAt) ? publishedAt : Date.now(),
    isPublic: Array.isArray(post.to) && post.to.includes(PUBLIC),
  };
}

/**
 * 投稿をインデックスに追加する。失敗しても投稿の処理は止めない。
 * 必ず await すること（Vercel では返事を返したあとの処理が止められることがある）。
 */
export async function addPostToIndex(post: any) {
  const document = toSearchDocument(post);
  const client = writeClient();
  if (!document || !client) return;
  try {
    // 主キーを明示する（id と activityId の両方があるので、推測させるとエラーになる）
    await client.index(SEARCH_INDEX).addDocuments([document], { primaryKey: "id" });
  } catch (error: any) {
    console.error("検索インデックスへの追加に失敗:", error?.message);
  }
}

/** 投稿をインデックスから消す。失敗しても止めない。必ず await すること */
export async function removePostFromIndex(documentId: string) {
  const client = writeClient();
  if (!documentId || !client) return;
  try {
    await client.index(SEARCH_INDEX).deleteDocument(documentId);
  } catch (error: any) {
    console.error("検索インデックスからの削除に失敗:", error?.message);
  }
}

/**
 * 本文で検索して、新しい順の投稿IDを返す。
 * @param since この日時（ミリ秒）より新しい投稿だけ
 */
export async function searchPostIds(query: string, { since, limit, offset }: { since: number; limit: number; offset: number }) {
  const client = searchClient();
  if (!client) throw new Error("Meilisearch の設定がありません");
  const result = await client.index(SEARCH_INDEX).search<SearchDocument>(query, {
    filter: `publishedAt > ${Math.floor(since)}`,
    sort: ["publishedAt:desc"],
    // 言葉がすべて含まれる投稿だけにする（新しい順に並べるので、ゆるく当てると関係ない投稿が混ざる）
    matchingStrategy: "all",
    attributesToRetrieve: ["id"],
    limit,
    offset,
  });
  return {
    ids: result.hits.map((hit) => hit.id),
    hasMore: (result.estimatedTotalHits ?? 0) > offset + result.hits.length,
  };
}
