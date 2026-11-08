/**
 * リモートサーバーから届いたNoteを、このアプリの保存形式に変換する。
 */
import sanitizeHtml from "sanitize-html";

/** ローカル投稿の上限（PostSchema）に合わせる */
const MAX_CONTENT_LENGTH = 500;
const MAX_ATTACHMENTS = 4;
const MAX_SUMMARY_LENGTH = 200;
const PUBLIC_COLLECTIONS = [
  "https://www.w3.org/ns/activitystreams#Public",
  "as:Public",
  "Public",
];

/** to / cc は文字列のことも配列のこともある */
export function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string" ? [value] : [];
}

export function isPublicNote(to: string[], cc: string[]): boolean {
  return [...to, ...cc].some((recipient) => PUBLIC_COLLECTIONS.includes(recipient));
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&"); // 二重に復号しないよう最後に行う
}

/**
 * HTMLの本文をプレーンテキストにする。
 * 画面はテキストとして描画するので、タグを残すとそのまま文字で表示されてしまう。
 */
export function htmlToText(html: unknown): string {
  if (typeof html !== "string") return "";
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n");
  const text = sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} });
  return decodeEntities(text).trim();
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** 本文を保存できる形にする（閲覧注意の説明文は buildSummary で別に持つ） */
export function buildContent(note: { content?: unknown }): string {
  return clip(htmlToText(note.content), MAX_CONTENT_LENGTH);
}

/** 閲覧注意（CW）の説明文。無ければ空 */
export function buildSummary(note: { summary?: unknown }): string {
  return clip(htmlToText(note.summary), MAX_SUMMARY_LENGTH);
}

/**
 * 以前の形（説明文を本文の先頭に [ ] で付ける）。
 * posts コレクションに summary の項目がまだ無いときの保存に使う。
 */
export function buildLegacyContent(note: { content?: unknown; summary?: unknown }): string {
  const summary = htmlToText(note.summary);
  const body = htmlToText(note.content);
  return clip(summary ? `[${summary}]\n${body}` : body, MAX_CONTENT_LENGTH);
}

/** カスタム絵文字は emoji.ts にある（画面からも使うため） */
export { buildEmojis } from "@/lib/activitypub/emoji";

function attachmentUrl(attachment: any): string | null {
  const candidate = Array.isArray(attachment?.url) ? attachment.url[0] : attachment?.url;
  const url = typeof candidate === "string" ? candidate : candidate?.href;
  if (typeof url !== "string") return null;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** 画面は attachment の各要素を JSON.parse して読むので、JSON文字列で保存する */
export function buildAttachments(attachments: unknown, sensitive = false): string[] {
  const list = Array.isArray(attachments) ? attachments : attachments ? [attachments] : [];
  const results: string[] = [];
  for (const attachment of list) {
    if (results.length >= MAX_ATTACHMENTS) break;
    const url = attachmentUrl(attachment);
    if (!url) continue;
    const mediaType = typeof attachment.mediaType === "string" ? attachment.mediaType : "image/jpeg";
    const type = mediaType.startsWith("video") ? "Video" : mediaType.startsWith("audio") ? "Audio" : "Image";
    results.push(
      JSON.stringify({
        type,
        mediaType,
        url,
        name: typeof attachment.name === "string" ? attachment.name.slice(0, 100) : "",
        width: Number.isFinite(attachment.width) ? attachment.width : 0,
        height: Number.isFinite(attachment.height) ? attachment.height : 0,
        blurhash: typeof attachment.blurhash === "string" ? attachment.blurhash.slice(0, 100) : "",
        // 閲覧注意の画像。画面では最初ぼかしておく
        ...(sensitive || attachment.sensitive === true ? { sensitive: true } : {}),
      })
    );
  }
  return results;
}
