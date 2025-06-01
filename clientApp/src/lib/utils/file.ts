/**
 * ファイル関連のユーティリティ！✨
 * ファイルサイズのフォーマットとかをキラキラに処理するよ！💖
 */

/**
 * ファイルサイズをフォーマットする関数！✨
 * バイト数をかわいい形式に変換するよ！💫
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 