/**
 * 日付関連のユーティリティ！✨
 * 日付のフォーマットとかをキラキラに処理するよ！💖
 */

/**
 * ISO 8601形式の日付文字列を取得！🌟
 */
export function getISODateString(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * 日付をフォーマットする関数！✨
 * かわいい形式で日付を表示するよ！💖
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 相対時間を取得する関数！✨
 * 投稿からどれくらい経ったかを表示するよ！💫
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "たった今 ✨";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前 💫`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前 ⏰`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}日前 🌙`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}週間前 📅`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}ヶ月前 📆`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}年前 🎉`;
} 

/**
 * 日付をフォーマットする関数！✨
* 日付をURLで表記できる形に変換する関数
*/
export function formatDateForUrl(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().replace(/[-:Z]/g, "");
}

/**
 * 日付をフォーマットする関数！✨
 * 日付をフォーマットして、16進数に変換する関数
 */
export function formatDateForHex(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear().toString(16);
  const month = (d.getMonth() + 1).toString(16);
  const day = d.getDate().toString(16);
  const hour = d.getHours().toString(16);
  const minute = d.getMinutes().toString(16);
  const second = d.getSeconds().toString(16);
  return `${year}${month}${day}${hour}${minute}${second}`;
}