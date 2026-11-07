/**
 * ログインのクッキーの設定を1か所にまとめたもの。
 * ログイン時と新規登録時で設定がバラバラだったので、どちらもここを使う。
 *
 * サーバー専用。"use server" を付けないこと（外部から呼べる関数として公開されてしまう）。
 */
import { cookies } from "next/headers";

export const SESSION_COOKIE = "my-custom-session";

/** クッキーの最長の有効期間。Appwriteのセッションの期限のほうが短ければそちらに合わせる */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function setSessionCookie(secret: string, sessionExpire?: string) {
  let maxAge = MAX_AGE_SECONDS;
  const expireMs = sessionExpire ? Date.parse(sessionExpire) : NaN;
  if (Number.isFinite(expireMs)) {
    maxAge = Math.max(0, Math.min(maxAge, Math.floor((expireMs - Date.now()) / 1000)));
  }
  (await cookies()).set(SESSION_COOKIE, secret, {
    path: "/",
    httpOnly: true,
    // strict だと、他のサーバーからのリンクで来たときにログアウト状態に見えてしまう
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
