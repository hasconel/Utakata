import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 日付をフォーマットする関数！✨
 * @param date フォーマットする日付
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * クラス名を結合する関数！✨ 
 * 怪しい！！後で確認！！
 * @param inputs クラス名の配列
 * @returns 結合されたクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// URLが内部ドメインか検証する関数！✨
export function isInternalUrl(url: string): boolean {
  try {
    return new URL(url).origin === new URL(`${process.env.NEXT_PUBLIC_DOMAIN}`).origin;
  } catch {
    return false;
  }
}

// 外部メディアURLを内部ドメインに変換する関数！✨
export function convertToInternalUrl(url: string): string {
  // 空、サイト内のパス、選択中ファイルのプレビューは変換しない
  if(!url || url.startsWith("/") || url.startsWith("blob:") || url.startsWith("data:") || isInternalUrl(url)) {
    return url;
  }
  return `/api/image?url=${encodeURIComponent(url)}`;
}

/**
 * 画面に出すメディアのURL。外部のものは /api/image を通し、
 * このサーバーのファイルは width を付けると縮めた画像にする（アイコンや背景に元の大きな写真を送らない）。
 * width は lib/media/sizes.ts の MEDIA_WIDTHS に丸められる。
 */
export function mediaUrl(url: string | undefined | null, width?: number): string {
  if (!url) return "";
  const converted = convertToInternalUrl(url);
  if (!width) return converted;
  try {
    const parsed = new URL(converted, process.env.NEXT_PUBLIC_DOMAIN);
    if (parsed.origin !== new URL(`${process.env.NEXT_PUBLIC_DOMAIN}`).origin || !parsed.pathname.startsWith("/files/")) return converted;
    parsed.searchParams.set("w", String(width));
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return converted;
  }
}

// 外部URLを内部URLに変換する関数！✨
export function convertToExternalUrl(url: string): string {
  if(isInternalUrl(url)) {
    return url;
  }
  return `${process.env.NEXT_PUBLIC_DOMAIN}/api/actor?url=${encodeURIComponent(url)}`;
}
/**
 * プロフィール画面へのリンク先。
 * ローカルのユーザーは /@ユーザー名（/users/<id> だと middleware でもう一度リダイレクトされる）、
 * 外部のユーザーは /@name@host（このサイトのユーザーページ）。
 */
export function profileHref(actorId?: string | null, preferredUsername?: string | null): string {
  if (!actorId) return "#";
  if (isInternalUrl(actorId)) {
    return preferredUsername ? `/@${preferredUsername}` : `/users/${actorId.split("/").pop()}`;
  }
  // 外のサーバーの人も、このサイトのユーザーページ（/@name@host）で開く
  return preferredUsername ? `/@${actorHandle(actorId, preferredUsername)}` : actorId;
}

/** 画面に出す @ の後ろ。外のサーバーの人は name@host */
export function actorHandle(actorId: string, preferredUsername: string): string {
  if (isInternalUrl(actorId)) return preferredUsername;
  try {
    return `${preferredUsername}@${new URL(actorId).hostname}`;
  } catch {
    return preferredUsername;
  }
}

/**
 * HTML（外部サーバーのプロフィール文など）を、表示用のただの文字にする。
 * 改行だけ残してタグは捨てる。画面では文字として表示するので、タグが動くことはない。
 */
export function htmlToPlainText(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}
