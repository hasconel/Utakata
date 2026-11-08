/**
 * すでに届いている外部の投稿（直近84時間）に、カスタム絵文字と CW の説明文をあとから入れる。
 * posts に summary / emojis の項目を足す前に届いた投稿は、本文の :emoji: が文字のままで、
 * CW は本文の先頭に [説明文] が付いた形になっている。元の投稿を相手のサーバーから読み直して直す。
 *
 *   確認のみ:  node --env-file=.env.production scripts/backfill-remote-notes.mjs
 *   実行:      node --env-file=.env.production scripts/backfill-remote-notes.mjs --apply
 *
 * 読めない投稿（消えた・署名が必要なサーバー）は飛ばす。何度実行しても大丈夫。
 * 絵文字の取り出し方は src/lib/activitypub/emoji.ts、本文の作り方は remoteNote.ts と同じにしておくこと。
 */
import { Client, Databases, Query } from "node-appwrite";
import sanitizeHtml from "sanitize-html";

const APPLY = process.argv.includes("--apply");
const WINDOW_MS = 84 * 60 * 60 * 1000;
const PAGE = 100;
const MAX_CONTENT = 500;
const MAX_SUMMARY = 200;
const MAX_EMOJIS = 30;

const env = (k) => process.env[k];
const required = ["NEXT_PUBLIC_DOMAIN", "APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "APPWRITE_DATABASE_ID", "APPWRITE_POSTS_COLLECTION_ID"];
const missing = required.filter((k) => !env(k));
if (missing.length > 0) {
  console.error(`環境変数が足りません: ${missing.join(", ")}`);
  process.exit(1);
}
const db = env("APPWRITE_DATABASE_ID");
const posts = env("APPWRITE_POSTS_COLLECTION_ID");
const origin = new URL(env("NEXT_PUBLIC_DOMAIN")).origin;
const databases = new Databases(new Client().setEndpoint(env("APPWRITE_ENDPOINT")).setProject(env("APPWRITE_PROJECT_ID")).setKey(env("APPWRITE_API_KEY")));

const clip = (t, max) => (t.length > max ? `${t.slice(0, max - 1)}…` : t);
function htmlToText(html) {
  if (typeof html !== "string") return "";
  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p[^>]*>/gi, "\n\n");
  return sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} })
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .trim();
}
function iconUrl(icon) {
  const c = Array.isArray(icon?.url) ? icon.url[0] : icon?.url;
  const url = typeof c === "string" ? c : c?.href;
  try {
    return typeof url === "string" && /^https?:$/.test(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
}
function buildEmojis(tags) {
  const list = Array.isArray(tags) ? tags : tags ? [tags] : [];
  const out = [];
  for (const tag of list) {
    if (out.length >= MAX_EMOJIS) break;
    if (tag?.type !== "Emoji" || typeof tag.name !== "string") continue;
    const name = tag.name.replace(/^:|:$/g, "");
    if (!/^[A-Za-z0-9_+-]{1,64}$/.test(name)) continue;
    const url = iconUrl(tag.icon);
    if (url) out.push(JSON.stringify({ name, url }));
  }
  return out;
}

async function fetchNote(id) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(id, {
      headers: { Accept: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"', "User-Agent": "Utakata/1.0 (backfill)" },
      signal: controller.signal,
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const note = await res.json();
    return note?.id === id ? { note } : { error: "id mismatch" };
  } catch (e) {
    return { error: e?.name === "AbortError" ? "timeout" : e?.message };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const targets = [];
  let cursor = null;
  for (;;) {
    const { documents } = await databases.listDocuments(db, posts, [
      Query.greaterThan("$createdAt", since),
      Query.limit(PAGE),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ]);
    for (const d of documents) {
      if (typeof d.activityId !== "string" || d.activityId.startsWith(origin)) continue;
      // 絵文字が入っていない投稿のうち、:name: か先頭の [説明文] がありそうなものだけ
      const needsEmoji = (!d.emojis || d.emojis.length === 0) && /:[A-Za-z0-9_+-]{1,64}:/.test(d.content || "");
      const needsCw = !d.summary && /^\[[^\]]+\]\n/.test(d.content || "");
      if (needsEmoji || needsCw) targets.push(d);
    }
    if (documents.length < PAGE) break;
    cursor = documents[documents.length - 1].$id;
  }
  console.log(`直しそうな外部の投稿: ${targets.length} 件`);

  let fixed = 0;
  let skipped = 0;
  for (const d of targets) {
    const { note, error } = await fetchNote(d.activityId);
    if (!note) {
      skipped++;
      console.log(`  とばす ${d.activityId}（${error}）`);
      continue;
    }
    const update = {
      emojis: buildEmojis(note.tag),
      summary: clip(htmlToText(note.summary), MAX_SUMMARY),
      content: clip(htmlToText(note.content), MAX_CONTENT),
    };
    if (!APPLY) {
      console.log(`  直す   ${d.activityId}（絵文字 ${update.emojis.length} 個${update.summary ? "・CWあり" : ""}）`);
      continue;
    }
    await databases.updateDocument(db, posts, d.$id, update);
    fixed++;
  }
  if (APPLY) console.log(`直しました: ${fixed} 件、とばしました: ${skipped} 件`);
  else console.log("確認のみで終わります。実行するには --apply を付けてください。");
}

main().catch((error) => {
  console.error("失敗しました:", error?.message ?? error);
  process.exit(1);
});
