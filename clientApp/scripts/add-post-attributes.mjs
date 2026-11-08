/**
 * posts コレクションに、外部の投稿用の項目を足す。
 *   summary : 閲覧注意（CW）の説明文
 *   emojis  : カスタム絵文字（{name,url} のJSON文字列の配列）
 *
 * 足す前に届いた投稿は、いままで通り本文の先頭に [説明文] が付いた形のまま。
 * 項目が無いあいだも、inbox は以前の形で保存するので、先にデプロイしても壊れない。
 *
 *   確認のみ:  node --env-file=.env.production scripts/add-post-attributes.mjs
 *   実行:      node --env-file=.env.production scripts/add-post-attributes.mjs --apply
 *
 * 何度実行しても大丈夫（ある項目は飛ばす）。
 */
import { Client, Databases } from "node-appwrite";

const APPLY = process.argv.includes("--apply");
const required = ["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "APPWRITE_DATABASE_ID", "APPWRITE_POSTS_COLLECTION_ID"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`環境変数が足りません: ${missing.join(", ")}`);
  process.exit(1);
}

const db = process.env.APPWRITE_DATABASE_ID;
const collection = process.env.APPWRITE_POSTS_COLLECTION_ID;
const databases = new Databases(
  new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY)
);

const ATTRIBUTES = [
  { key: "summary", create: () => databases.createStringAttribute(db, collection, "summary", 300, false) },
  { key: "emojis", create: () => databases.createStringAttribute(db, collection, "emojis", 600, false, undefined, true) },
];

async function main() {
  const { attributes } = await databases.listAttributes(db, collection);
  const existing = new Set(attributes.map((a) => a.key));
  for (const { key, create } of ATTRIBUTES) {
    if (existing.has(key)) {
      console.log(`  ${key}: もうあります`);
      continue;
    }
    if (!APPLY) {
      console.log(`  ${key}: 足します（--apply で実行）`);
      continue;
    }
    await create();
    console.log(`  ${key}: 足しました（使えるようになるまで少しかかります）`);
  }
  if (!APPLY) console.log("確認のみで終わります。実行するには --apply を付けてください。");
}

main().catch((error) => {
  console.error("失敗しました:", error?.message ?? error);
  process.exit(1);
});
