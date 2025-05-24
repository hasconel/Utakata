/**
 * 文字列関連のユーティリティ関数！✨
 * 文字列の操作を簡単に！📝
 */

/**
 * 文字列を指定した長さで切り詰める！✂️
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * 文字列をHTMLエスケープ！🔒
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 文字列をURLエンコード！🔗
 */
export function encodeUrl(text: string): string {
  return encodeURIComponent(text);
} 