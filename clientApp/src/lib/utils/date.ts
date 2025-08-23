
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
