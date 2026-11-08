/**
 * よく使う問い合わせに、Appwrite のインデックスがあるかを確かめる（無いと件数が増えるほど遅くなる）。
 *
 *   確認のみ:  node --env-file=.env.production scripts/check-indexes.mjs
 *   足りないものを作る:  node --env-file=.env.production scripts/check-indexes.mjs --apply
 *
 * 同じ項目を先頭に持つインデックスがあれば「ある」とみなす。何度実行しても大丈夫。
 */
import { Client, Databases, IndexType } from "node-appwrite";

const APPLY = process.argv.includes("--apply");
const env = (k) => process.env[k];
const required = ["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "APPWRITE_DATABASE_ID"];
const missing = required.filter((k) => !env(k));
if (missing.length > 0) {
  console.error(`環境変数が足りません: ${missing.join(", ")}`);
  process.exit(1);
}
const db = env("APPWRITE_DATABASE_ID");
const databases = new Databases(new Client().setEndpoint(env("APPWRITE_ENDPOINT")).setProject(env("APPWRITE_PROJECT_ID")).setKey(env("APPWRITE_API_KEY")));

// [環境変数のコレクションID, インデックスの名前, 項目, 並び（任意）]
const WANTED = [
  ["APPWRITE_POSTS_COLLECTION_ID", "idx_activityId", ["activityId"]],
  ["APPWRITE_POSTS_COLLECTION_ID", "idx_attributedTo_created", ["attributedTo", "$createdAt"], ["ASC", "DESC"]],
  ["APPWRITE_POSTS_COLLECTION_ID", "idx_inReplyTo_created", ["inReplyTo", "$createdAt"], ["ASC", "ASC"]],
  ["APPWRITE_POSTS_SUB_COLLECTION_ID", "idx_activityId", ["activityId"]],
  ["APPWRITE_LIKES_COLLECTION_ID", "idx_object", ["object"]],
  ["APPWRITE_LIKES_COLLECTION_ID", "idx_actor_object", ["actor", "object"]],
  ["APPWRITE_SHARES_COLLECTION_ID", "idx_object", ["object"]],
  ["APPWRITE_SHARES_COLLECTION_ID", "idx_actor_object", ["actor", "object"]],
  ["APPWRITE_SHARES_COLLECTION_ID", "idx_id", ["id"]],
  ["APPWRITE_NOTIFICATIONS_COLLECTION_ID", "idx_to_created", ["to", "$createdAt"], ["ASC", "DESC"]],
  ["APPWRITE_ACTORS_COLLECTION_ID", "idx_actorId", ["actorId"]],
  ["APPWRITE_ACTORS_COLLECTION_ID", "idx_preferredUsername", ["preferredUsername"]],
  ["APPWRITE_ACTORS_COLLECTION_ID", "idx_userId", ["userId"]],
];

async function main() {
  const byCollection = new Map();
  let todo = 0;
  for (const [envKey, key, attributes, orders] of WANTED) {
    const collection = env(envKey);
    if (!collection) {
      console.log(`- ${envKey} が無いので飛ばします`);
      continue;
    }
    if (!byCollection.has(collection)) {
      const { indexes } = await databases.listIndexes(db, collection);
      byCollection.set(collection, indexes);
    }
    const indexes = byCollection.get(collection);
    const has = indexes.some((i) => attributes.every((a, n) => i.attributes[n] === a));
    const label = `${envKey.replace(/^APPWRITE_|_COLLECTION_ID$/g, "").toLowerCase()}: ${attributes.join(" + ")}`;
    if (has) {
      console.log(`  ある   ${label}`);
      continue;
    }
    todo++;
    if (!APPLY) {
      console.log(`  ない   ${label}`);
      continue;
    }
    await databases.createIndex(db, collection, key, IndexType.Key, attributes, orders);
    console.log(`  作った ${label}（使えるようになるまで少しかかります）`);
  }
  if (!APPLY && todo > 0) console.log(`足りないインデックスが ${todo} 個あります。作るには --apply を付けてください。`);
  if (todo === 0) console.log("全部そろっています🫧");
}

main().catch((error) => {
  console.error("失敗しました:", error?.message ?? error);
  process.exit(1);
});
