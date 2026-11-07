/**
 * 秘密鍵を actors コレクションから専用コレクションへ移行する。
 * 秘密鍵の値は画面に出力しない。何度実行しても既存の移行先は上書きしない。
 *
 *   確認のみ（何も変更しない）:
 *     node --env-file=.env.production scripts/migrate-private-keys.mjs
 *   コピーを実行（actors の値はまだ消さない）:
 *     node --env-file=.env.production scripts/migrate-private-keys.mjs --apply
 *   actors から privateKey 属性を削除（全員分のコピーを確認してから行う）:
 *     node --env-file=.env.production scripts/migrate-private-keys.mjs --apply --finalize
 */
import { Client, Databases, Query } from "node-appwrite";

const APPLY = process.argv.includes("--apply");
const FINALIZE = process.argv.includes("--finalize");

const required = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_ACTORS_COLLECTION_ID",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`環境変数が足りません: ${missing.join(", ")}`);
  process.exit(1);
}

const DB = process.env.APPWRITE_DATABASE_ID;
const ACTORS = process.env.APPWRITE_ACTORS_COLLECTION_ID;
const KEYS = process.env.APPWRITE_ACTOR_KEYS_COLLECTION_ID || "actor_private_keys";

const databases = new Databases(
  new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
);

const isNotFound = (err) => err?.code === 404;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForAttribute(collectionId, key) {
  for (let i = 0; i < 60; i++) {
    const attribute = await databases.getAttribute(DB, collectionId, key);
    if (attribute.status === "available") return;
    if (attribute.status === "failed") throw new Error(`属性の作成に失敗しました: ${key}`);
    await sleep(1000);
  }
  throw new Error(`属性の準備が終わりません: ${key}`);
}

/** 専用コレクションを用意する。誰かに読める設定なら、鍵を入れる前に止める。 */
async function ensureKeysCollection() {
  try {
    const collection = await databases.getCollection(DB, KEYS);
    if (collection.$permissions.length > 0 || collection.documentSecurity) {
      throw new Error(`${KEYS} に権限が設定されています。権限を空にし、documentSecurity を無効にしてください。`);
    }
    console.log(`移行先コレクション: ${KEYS}（作成済み）`);
    return true;
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }
  if (!APPLY) {
    console.log(`移行先コレクション: ${KEYS}（--apply で作成します）`);
    return false;
  }
  // 権限なし + documentSecurity 無効 = APIキーでしかアクセスできない
  await databases.createCollection(DB, KEYS, "Actor Private Keys", [], false, true);
  await databases.createStringAttribute(DB, KEYS, "privateKey", 8192, true);
  await waitForAttribute(KEYS, "privateKey");
  console.log(`移行先コレクション: ${KEYS}（作成しました）`);
  return true;
}

async function legacyAttribute() {
  try {
    return await databases.getAttribute(DB, ACTORS, "privateKey");
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

async function* allActors() {
  let cursor;
  while (true) {
    const queries = [Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const { documents } = await databases.listDocuments(DB, ACTORS, queries);
    if (documents.length === 0) return;
    yield* documents;
    cursor = documents[documents.length - 1].$id;
  }
}

async function hasKey(userId) {
  try {
    await databases.getDocument(DB, KEYS, userId);
    return true;
  } catch (err) {
    if (isNotFound(err)) return false;
    throw err;
  }
}

const collectionReady = await ensureKeysCollection();

const legacy = await legacyAttribute();
// 新規登録では actors に privateKey を書かないので、必須を外しておく
if (legacy?.required) {
  if (APPLY) {
    await databases.updateStringAttribute(DB, ACTORS, "privateKey", false, null);
    await waitForAttribute(ACTORS, "privateKey");
    console.log("actors.privateKey を任意項目に変更しました");
  } else {
    console.log("actors.privateKey は必須項目です（--apply で任意に変更します）");
  }
}

let total = 0;
let copied = 0;
let existing = 0;
const noKey = [];
for await (const actor of allActors()) {
  total++;
  const migrated = collectionReady && (await hasKey(actor.$id));
  if (migrated) {
    existing++;
  } else if (!actor.privateKey) {
    noKey.push(actor.$id);
  } else if (APPLY) {
    await databases.createDocument(DB, KEYS, actor.$id, { privateKey: actor.privateKey }, []);
    copied++;
  }
}
const pending = total - existing - copied - noKey.length;
console.log(`actors: ${total}件 / 移行済み: ${existing}件 / 今回コピー: ${copied}件 / 未コピー: ${pending}件 / 鍵なし: ${noKey.length}件`);
if (noKey.length > 0) {
  console.log(`鍵が見つからないユーザー: ${noKey.join(", ")}`);
}

if (FINALIZE) {
  if (!APPLY) {
    console.error("--finalize には --apply が必要です");
    process.exit(1);
  }
  if (noKey.length > 0 || pending > 0) {
    console.error("コピーできていないユーザーがいるので、属性は削除しませんでした");
    process.exit(1);
  }
  if (legacy) {
    await databases.deleteAttribute(DB, ACTORS, "privateKey");
    console.log("actors から privateKey 属性を削除しました");
  } else {
    console.log("privateKey 属性はすでに削除されています");
  }
}

if (!APPLY) {
  console.log("確認のみです。変更するには --apply を付けてください。");
}
console.log(`.env に設定してください: APPWRITE_ACTOR_KEYS_COLLECTION_ID=${KEYS}`);
