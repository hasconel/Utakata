/**
 * もうある画像の権限をそろえる🫧
 *   ・このサーバーの公開投稿（to / cc に Public）に付いている画像
 *   ・ユーザーのアイコン（avatarUrl）と背景（backgroundUrl）
 * を、read("any")（誰でも読める）にする。持ち主の書き換え・削除の権限はそのまま残す。
 *
 *   確認のみ:  node --env-file=.env.production scripts/publicize-files.mjs
 *   実行:      node --env-file=.env.production scripts/publicize-files.mjs --apply
 *
 * 何度実行しても大丈夫（もう公開のものは飛ばす）。
 */
import { Client, Databases, Permission, Query, Role, Storage } from "node-appwrite";

const APPLY = process.argv.includes("--apply");
const required = [
  "APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "APPWRITE_DATABASE_ID",
  "APPWRITE_POSTS_COLLECTION_ID", "APPWRITE_ACTORS_COLLECTION_ID", "APPWRITE_STORAGE_ID", "NEXT_PUBLIC_DOMAIN",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`環境変数が足りません: ${missing.join(", ")}`);
  process.exit(1);
}

const env = process.env;
const client = new Client().setEndpoint(env.APPWRITE_ENDPOINT).setProject(env.APPWRITE_PROJECT_ID).setKey(env.APPWRITE_API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);
const PUBLIC = "https://www.w3.org/ns/activitystreams#Public";
const FILE_PREFIX = `${env.NEXT_PUBLIC_DOMAIN}/files/`;

const fileIdOf = (url) => {
  if (typeof url !== "string" || !url.startsWith(FILE_PREFIX)) return null;
  const id = url.slice(FILE_PREFIX.length).split(/[?#/]/)[0];
  return /^[A-Za-z0-9._-]{1,36}$/.test(id) ? id : null;
};

/** コレクションを全部たどる */
async function* all(collection, queries = []) {
  let cursor = null;
  for (;;) {
    const page = await databases.listDocuments(env.APPWRITE_DATABASE_ID, collection, [
      Query.limit(100),
      ...queries,
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ]);
    yield* page.documents;
    if (page.documents.length < 100) return;
    cursor = page.documents[page.documents.length - 1].$id;
  }
}

async function main() {
  /** ファイルID → 持ち主のユーザーID */
  const targets = new Map();

  for await (const post of all(env.APPWRITE_POSTS_COLLECTION_ID, [Query.startsWith("activityId", `${env.NEXT_PUBLIC_DOMAIN}/`)])) {
    if (![...(post.to ?? []), ...(post.cc ?? [])].some((r) => [PUBLIC, "as:Public", "Public"].includes(r))) continue;
    const owner = String(post.attributedTo ?? "").split("/").pop();
    for (const raw of post.attachment ?? []) {
      let url = null;
      try { url = JSON.parse(raw)?.url; } catch { /* 壊れた添付は飛ばす */ }
      const id = fileIdOf(url);
      if (id && owner) targets.set(id, owner);
    }
  }
  for await (const actor of all(env.APPWRITE_ACTORS_COLLECTION_ID)) {
    for (const url of [actor.avatarUrl, actor.backgroundUrl]) {
      const id = fileIdOf(url);
      if (id) targets.set(id, actor.$id);
    }
  }

  let changed = 0, already = 0, skipped = 0, failed = 0;
  for (const [id, owner] of targets) {
    try {
      const file = await storage.getFile(env.APPWRITE_STORAGE_ID, id);
      const permissions = file.$permissions ?? [];
      if (permissions.includes('read("any")')) { already++; continue; }
      if (!permissions.some((p) => /^(delete|write)\(/.test(p) && p.endsWith(`("user:${owner}")`))) {
        console.log(`  ${id}: 持ち主がちがうので飛ばします`);
        skipped++;
        continue;
      }
      if (APPLY) {
        const rest = permissions.filter((p) => !p.startsWith("read("));
        await storage.updateFile(env.APPWRITE_STORAGE_ID, id, undefined, [...rest, Permission.read(Role.any())]);
      }
      console.log(`  ${id}: ${APPLY ? "公開にしました" : "公開にします"}`);
      changed++;
    } catch (error) {
      console.log(`  ${id}: 失敗 (${error?.message ?? error})`);
      failed++;
    }
  }

  console.log(`\n対象 ${targets.size} 件 / ${APPLY ? "変更" : "変更予定"} ${changed} / もう公開 ${already} / 飛ばした ${skipped} / 失敗 ${failed}`);
  if (!APPLY) console.log("確認のみで終わります。実行するには --apply を付けてください。");
}

main().catch((error) => {
  console.error("失敗しました:", error?.message ?? error);
  process.exit(1);
});
