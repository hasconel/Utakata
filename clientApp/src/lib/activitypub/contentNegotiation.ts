/**
 * Acceptヘッダーから、ActivityPubのJSONを求めるリクエストかどうかを判定する。
 * Mastodonなどは複数の形式を並べて送るので、完全一致で比べてはいけない。
 * ミドルウェアからも使うので、Nodeの機能に依存しないこと。
 */
export function wantsActivityJson(accept: string | null | undefined): boolean {
  if (!accept) return false;
  return accept.split(",").some((entry) => {
    const type = entry.split(";")[0].trim().toLowerCase();
    return type === "application/activity+json" || type === "application/ld+json";
  });
}
