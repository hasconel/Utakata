/**
 * 投稿と通知の表示期間（意図的に3.5日に限っている。古い投稿を掘り返されないようにするため）
 * サーバーと画面の両方から使う。
 */
export const POST_WINDOW_HOURS = 84;
export const POST_WINDOW_MS = POST_WINDOW_HOURS * 60 * 60 * 1000;

export function postWindowStart(): string {
  return new Date(Date.now() - POST_WINDOW_MS).toISOString();
}

/** 表示期間の残りの割合（1 = 投稿したばかり、0 = もうすぐタイムラインから消える） */
export function remainingLife(published: string | Date, now = Date.now()): number {
  const age = now - new Date(published).getTime();
  if (!Number.isFinite(age)) return 0;
  return Math.min(1, Math.max(0, 1 - age / POST_WINDOW_MS));
}
