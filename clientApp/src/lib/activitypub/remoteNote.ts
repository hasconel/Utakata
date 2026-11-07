/**
 * リモートサーバーから届いたNoteを、このアプリの保存形式に変換する。
 */
import sanitizeHtml from "sanitize-html";

/** ローカル投稿の上限（PostSchema）に合わせる */
const MAX_CONTENT_LENGTH = 500;
const MAX_ATTACHMENTS = 4;
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

/** 本文を保存できる形にする。閲覧注意の説明文があれば先頭に付ける。 */
export function buildContent(note: { content?: unknown; summary?: unknown }): string {
  const summary = htmlToText(note.summary);
  const body = htmlToText(note.content);
  const content = summary ? `[${summary}]\n${body}` : body;
  return content.length > MAX_CONTENT_LENGTH ? `${content.slice(0, MAX_CONTENT_LENGTH - 1)}…` : content;
}

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
export function buildAttachments(attachments: unknown): string[] {
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
        width: 0,
        height: 0,
        blurhash: "",
      })
    );
  }
  return results;
}
