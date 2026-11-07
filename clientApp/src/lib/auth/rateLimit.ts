/**
 * ログインと新規登録の回数制限（簡易版）。
 * サーバーのAPIキーで Appwrite を呼ぶと Appwrite 側の回数制限が効かないので、こちらで数える。
 *
 * 注意：記録はサーバーのメモリにあるので、Vercel のインスタンスごとに別々に数えられる。
 * あくまで補助で、本命は Cloudflare のレート制限ルール。
 */
import { NextRequest } from "next/server";

const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

/** 1回分を記録して、制限内なら true を返す */
export function hitRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  // メモリが増え続けないように、古いものから捨てる
  if (buckets.size > MAX_KEYS) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }
  return true;
}

/** 接続元のIP（Cloudflare 経由なら cf-connecting-ip が本物） */
export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
