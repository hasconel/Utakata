/**
 * ブースト（ActivityPub の Announce）を保存する shares コレクションを作る。
 * 項目は likes と同じ形:
 *   id     : Announce アクティビティのID
 *   actor  : ブーストした人
 *   object : ブーストされた投稿のID（activityId）
 *
 * コレクションが無いあいだも、inbox はブーストの通知だけ出して件数は数えないので、先にデプロイしても壊れない。
 *
 *   確認のみ:  node --env-file=.env.production scripts/create-shares-collection.mjs
 *   実行:      node --env-file=.env.production scripts/create-shares-collection.mjs --apply
 *
 * 実行したら、表示されるIDを .env.production の APPWRITE_SHARES_COLLECTION_ID に入れてね。
 * 何度実行しても大丈夫（あるものは飛ばす）。
 */
import { Client, Databases, IndexType, Permission, Role } from "node-appwrite";

const APPLY = process.argv.includes("--apply");
const required = ["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "APPWRITE_DATABASE_ID"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`環境変数が足りません: ${missing.join(", ")}`);
  process.exit(1);
}

const db = process.env.APPWRITE_DATABASE_ID;
const collection = process.env.APPWRITE_SHARES_COLLECTION_ID || "shares";
const databases = new Databases(
  new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY)
);

const ATTRIBUTES = [
  { key: "id", create: () => databases.createUrlAttribute(db, collection, "id", true) },
  { key: "actor", create: () => databases.createUrlAttribute(db, collection, "actor", true) },
  { key: "object", create: () => databases.createUrlAttribute(db, collection, "object", true) },
];

// 件数を数える・自分がブーストしたか調べる・取り消すときに使う
const INDEXES = [
  { key: "idx_object", attributes: ["object"] },
  { key: "idx_actor_object", attributes: ["actor", "object"] },
  { key: "idx_id", attributes: ["id"] },
];

/** 項目が使えるようになるまで待つ（作った直後はインデックスを作れない） */
async function waitForAttributes(keys) {
  for (let i = 0; i < 30; i++) {
    const { attributes } = await databases.listAttributes(db, collection);
    if (keys.every((key) => attributes.find((a) => a.key === key)?.status === "available")) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("項目の準備が終わりませんでした。少し待ってからもう一度実行してください。");
}

async function main() {
  const existing = await databases.getCollection(db, collection).catch(() => null);
  if (!existing) {
    if (!APPLY) {
      console.log(`  コレクション ${collection}: 作ります（--apply で実行）`);
      console.log("確認のみで終わります。実行するには --apply を付けてください。");
      return;
    }
    // 読むのは誰でも（件数を外に見せる）。作るのはログインユーザー（likes と同じ）
    await databases.createCollection(db, collection, "shares", [Permission.read(Role.any()), Permission.create(Role.users())], true);
    console.log(`  コレクション ${collection}: 作りました`);
  } else {
    console.log(`  コレクション ${collection}: もうあります`);
  }

  const { attributes } = await databases.listAttributes(db, collection);
  const existingAttributes = new Set(attributes.map((a) => a.key));
  for (const { key, create } of ATTRIBUTES) {
    if (existingAttributes.has(key)) {
      console.log(`  ${key}: もうあります`);
      continue;
    }
    if (!APPLY) {
      console.log(`  ${key}: 足します（--apply で実行）`);
      continue;
    }
    await create();
    console.log(`  ${key}: 足しました`);
  }

  const { indexes } = await databases.listIndexes(db, collection);
  const missingIndexes = INDEXES.filter(({ attributes: keys }) => !indexes.some((i) => keys.every((a, n) => i.attributes[n] === a)));
  if (missingIndexes.length > 0 && APPLY) await waitForAttributes(ATTRIBUTES.map((a) => a.key));
  for (const { key, attributes: keys } of INDEXES) {
    if (!missingIndexes.some((i) => i.key === key)) {
      console.log(`  インデックス ${keys.join(" + ")}: もうあります`);
      continue;
    }
    if (!APPLY) {
      console.log(`  インデックス ${keys.join(" + ")}: 作ります（--apply で実行）`);
      continue;
    }
    await databases.createIndex(db, collection, key, IndexType.Key, keys);
    console.log(`  インデックス ${keys.join(" + ")}: 作りました（使えるようになるまで少しかかります）`);
  }

  if (!APPLY) {
    console.log("確認のみで終わります。実行するには --apply を付けてください。");
  } else if (!process.env.APPWRITE_SHARES_COLLECTION_ID) {
    console.log(`\n.env.production に次の1行を足してね🫧\nAPPWRITE_SHARES_COLLECTION_ID=${collection}`);
  }
}

main().catch((error) => {
  console.error("失敗しました:", error?.message ?? error);
  process.exit(1);
});
