/**
 * 検索インデックス "notes" を作り直す。
 *   ・インデックスの設定（日本語の分かち書き、日時での絞り込みと新しい順の並び替え）
 *   ・Appwrite にあるローカルの投稿を全部入れ直す
 *   ・（任意）以前の "posts" インデックスを消す
 *   ・（任意）アプリ用のキー（検索だけ / 追加・削除だけ）を作る
 *
 * Meilisearch の設定を変えるので、マスターキー（または管理用キー）が必要。
 * MEILISEARCH_ADMIN_KEY があればそれを、無ければ MEILISEARCH_API_KEY を使う。
 *
 *   確認のみ（何も変更しない）:
 *     node --env-file=.env.production scripts/reindex-search.mjs
 *   設定と入れ直しを実行:
 *     node --env-file=.env.production scripts/reindex-search.mjs --apply
 *   あわせて古い "posts" インデックスを消す:
 *     node --env-file=.env.production scripts/reindex-search.mjs --apply --drop-old
 *   アプリ用のキーを作って表示する（表示されたキーは Vercel の環境変数に登録する）:
 *     node --env-file=.env.production scripts/reindex-search.mjs --create-keys
 *
 * 何度実行しても大丈夫（同じIDの投稿は上書きされる）。
 * ここの設定と toDocument は src/lib/search/meili.ts と同じにしておくこと。
 */
import { Client, Databases, Query } from "node-appwrite";
import { MeiliSearch } from "meilisearch";
import { randomUUID } from "node:crypto";

const APPLY = process.argv.includes("--apply");
const DROP_OLD = process.argv.includes("--drop-old");
const CREATE_KEYS = process.argv.includes("--create-keys");

const INDEX = "notes";
const OLD_INDEX = "posts";
const PUBLIC = "https://www.w3.org/ns/activitystreams#Public";
const PAGE = 100;
const BATCH = 1000;

const HOST = process.env.MEILISEARCH_HOST || process.env.NEXT_PUBLIC_MEILISEARCH_HOST;
const ADMIN_KEY = process.env.MEILISEARCH_ADMIN_KEY || process.env.MEILISEARCH_API_KEY;

const required = {
  "MEILISEARCH_HOST（または NEXT_PUBLIC_MEILISEARCH_HOST）": HOST,
  "MEILISEARCH_ADMIN_KEY（または MEILISEARCH_API_KEY）": ADMIN_KEY,
  NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
  APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
  APPWRITE_POSTS_COLLECTION_ID: process.env.APPWRITE_POSTS_COLLECTION_ID,
};
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
if (missing.length > 0) {
  console.error(`環境変数が足りません: ${missing.join(", ")}`);
  process.exit(1);
}

// http → https へリダイレクトされると、fetch が Authorization ヘッダーを捨ててしまい
// 「The Authorization header is missing」になる。手元のサーバー以外は https で書くこと
if (/^http:\/\//i.test(HOST) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(HOST)) {
  console.error(`Meilisearch のURLが http になっています（${HOST}）。https:// に書き換えてください。`);
  process.exit(1);
}

const SETTINGS = {
  searchableAttributes: ["content"],
  filterableAttributes: ["publishedAt", "attributedTo", "isPublic"],
  sortableAttributes: ["publishedAt"],
  // 新しい順を最優先にする（検索語はすべて含む投稿だけに絞ってから並べる）
  rankingRules: ["sort", "words", "typo", "proximity", "attribute", "exactness"],
  // 漢字が多い文が中国語と判定されないように、本文は日本語として区切る
  localizedAttributes: [{ attributePatterns: ["content"], locales: ["jpn"] }],
};

const origin = new URL(process.env.NEXT_PUBLIC_DOMAIN).origin;
const isLocal = (url) => {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
};

function toDocument(post) {
  if (!post?.$id || !post?.activityId || !isLocal(post.activityId)) return null;
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

const meili = new MeiliSearch({ host: HOST, apiKey: ADMIN_KEY });
const databases = new Databases(
  new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
);

async function fail(task, what) {
  if (task.status !== "succeeded") {
    console.error(`${what}に失敗しました:`, task.error?.message ?? task.status);
    process.exit(1);
  }
}

async function createKeys() {
  // キーの値は Meilisearch が「キーのID（uid）とマスターキー」から作る。
  // uid は暗号学的に安全な乱数で作って渡す（マスターキーが漏れていなければ、キーは推測できない）
  const make = (description, actions) =>
    meili.createKey({ uid: randomUUID(), description, actions, indexes: [INDEX], expiresAt: null });
  try {
    const search = await make("utakata: search notes", ["search"]);
    const write = await make("utakata: write notes", ["documents.add", "documents.delete"]);
    console.log("キーを作りました。Vercel の環境変数に登録してください（この画面以外には保存されません）。");
    console.log(`  MEILISEARCH_SEARCH_KEY=${search.key}`);
    console.log(`  MEILISEARCH_API_KEY=${write.key}`);
    console.log("登録して再デプロイしたら、古いキー（NEXT_PUBLIC_MEILISEARCH_API_KEY など）は Meilisearch から消してください。");
  } catch (error) {
    console.error("キーを作れませんでした。マスターキーを MEILISEARCH_ADMIN_KEY に入れて実行してください:", error?.message);
    process.exit(1);
  }
}

async function main() {
  await meili.health().catch((error) => {
    console.error("Meilisearch に接続できません:", error?.message);
    process.exit(1);
  });

  if (CREATE_KEYS) {
    await createKeys();
    return;
  }

  // Appwrite からローカルの投稿を全部集める
  const documents = [];
  let scanned = 0;
  let cursor = null;
  for (;;) {
    const { documents: page } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID, process.env.APPWRITE_POSTS_COLLECTION_ID, [
      Query.limit(PAGE),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ]);
    scanned += page.length;
    for (const post of page) {
      const doc = toDocument(post);
      if (doc) documents.push(doc);
    }
    if (page.length < PAGE) break;
    cursor = page[page.length - 1].$id;
  }
  console.log(`投稿 ${scanned} 件のうち、ローカルの投稿 ${documents.length} 件を入れます。`);

  const existing = await meili.getIndexes({ limit: 100 }).then((r) => r.results.map((i) => i.uid));
  console.log(`いまあるインデックス: ${existing.join(", ") || "（なし）"}`);

  if (!APPLY) {
    console.log("確認のみで終わります。実行するには --apply を付けてください。");
    return;
  }

  if (!existing.includes(INDEX)) {
    await fail(await meili.createIndex(INDEX, { primaryKey: "id" }).waitTask(), "インデックスの作成");
    console.log(`インデックス "${INDEX}" を作りました。`);
  }
  const index = meili.index(INDEX);
  await fail(await index.updateSettings(SETTINGS).waitTask({ timeout: 120_000 }), "インデックスの設定");
  console.log("インデックスを設定しました。");

  for (let i = 0; i < documents.length; i += BATCH) {
    const batch = documents.slice(i, i + BATCH);
    await fail(await index.addDocuments(batch, { primaryKey: "id" }).waitTask({ timeout: 300_000 }), "投稿の追加");
    console.log(`  ${Math.min(i + BATCH, documents.length)} / ${documents.length}`);
  }
  console.log("投稿を入れ直しました。");

  if (DROP_OLD && existing.includes(OLD_INDEX)) {
    await fail(await meili.deleteIndex(OLD_INDEX).waitTask(), `"${OLD_INDEX}" の削除`);
    console.log(`古いインデックス "${OLD_INDEX}" を消しました。`);
  }
}

main().catch((error) => {
  console.error("失敗しました:", error?.message ?? error);
  process.exit(1);
});
