/**
 * バリデーション関連のユーティリティ！✨
 * 入力値のチェックとかをキラキラに処理するよ！💖
 */

/**
 * 必須フィールドのチェック関数！✨
 * 必要なフィールドが揃ってるかチェックするよ！🔍
 */
export function throwIfMissing(obj: Record<string, any>, keys: string[]): void {
  const missing = [];
  for (const key of keys) {
    if (!(key in obj) || !obj[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * テンプレート文字列の補間関数！✨
 * テンプレートに値を埋め込むよ！💫
 */
export function interpolate(template: string, values: Record<string, string | undefined>): string {
  return template.replace(/{{([^}]+)}}/g, (_, key) => values[key] || '');
} 