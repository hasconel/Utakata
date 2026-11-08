import { isPublicAudience } from "@/lib/activitypub/audience";
/**
 * 保存済みのローカル投稿を、外部サーバーへ返すActivityPubの形にする。
 * 配信時（createNote）と同じIDと形にすること。違うと相手側で別の投稿として扱われる。
 */

export const PUBLIC_COLLECTION = "https://www.w3.org/ns/activitystreams#Public";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// URLに使える半角文字だけを拾う（日本語の句読点や括弧の手前で止まる）
const URL_PATTERN = /https?:\/\/[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+/g;
// 文末の句読点や閉じ括弧はURLに含めない
const TRAILING_PUNCTUATION = /[.,!?;:'")\]]+$/;

function linkify(line: string): string {
  let html = "";
  let lastIndex = 0;
  for (const match of line.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING_PUNCTUATION, "");
    const start = match.index!;
    html += escapeHtml(line.slice(lastIndex, start));
    const escaped = escapeHtml(url);
    html += `<a href="${escaped}" rel="nofollow noopener noreferrer" target="_blank">${escaped}</a>`;
    lastIndex = start + url.length;
  }
  return html + escapeHtml(line.slice(lastIndex));
}

/**
 * プレーンテキストの本文をActivityPubのcontent（HTML）にする。
 * 外部サーバーはcontentをHTMLとして読むので、そのまま入れると < や改行が崩れる。
 * 空行で段落（<p>）、改行で <br> にし、URLはリンクにする。
 */
export function textToHtml(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "";
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.split("\n").map(linkify).join("<br>")}</p>`)
    .join("");
}

export function isPublicPost(post: any): boolean {
  return isPublicAudience(post?.to, post?.cc);
}

/** 添付はJSON文字列で保存されているので、オブジェクトに戻す。読めないものは外す。 */
function parseAttachments(attachments: unknown): object[] {
  if (!Array.isArray(attachments)) return [];
  const results: object[] = [];
  for (const attachment of attachments) {
    try {
      const parsed = typeof attachment === "string" ? JSON.parse(attachment) : attachment;
      if (parsed && typeof parsed === "object" && typeof parsed.url === "string") results.push(parsed);
    } catch {
      // 壊れた添付は返さない
    }
  }
  return results;
}

export function postToNote(post: any) {
  const attachment = parseAttachments(post.attachment);
  return {
    id: post.activityId as string,
    type: "Note",
    published: post.published || post.$createdAt,
    attributedTo: post.attributedTo as string,
    content: textToHtml(post.content ?? ""),
    to: post.to ?? [],
    cc: post.cc ?? [],
    ...(post.inReplyTo ? { inReplyTo: post.inReplyTo } : {}),
    ...(attachment.length > 0 ? { attachment } : {}),
  };
}

export function postToCreate(post: any) {
  const note = postToNote(post);
  return {
    id: `${note.id}#create`,
    type: "Create",
    actor: note.attributedTo,
    published: note.published,
    to: note.to,
    cc: note.cc,
    object: note,
  };
}
