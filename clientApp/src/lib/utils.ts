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
  if(url.startsWith(`${process.env.NEXT_PUBLIC_DOMAIN}`)){
    return true;
  }
  //if(url.startsWith(`https://pbs.hasconel.com`)){
  //  return true;
  //}
  return false;
}

// 外部メディアURLを内部ドメインに変換する関数！✨
export function convertToInternalUrl(url: string): string {
  if(isInternalUrl(url)) {
    return url;
  }
  return `${process.env.NEXT_PUBLIC_DOMAIN}/api/image?url=${encodeURIComponent(url)}`;
}

// 外部URLを内部URLに変換する関数！✨
export function convertToExternalUrl(url: string): string {
  if(isInternalUrl(url)) {
    return url;
  }
  return `${process.env.NEXT_PUBLIC_DOMAIN}/api/actor?url=${encodeURIComponent(url)}`;
}