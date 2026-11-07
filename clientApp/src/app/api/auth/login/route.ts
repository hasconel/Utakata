/**
 * ログインのAPI！🫧
 * POST /api/auth/login  { email, password }  →  200 { ok: true } / 4xx { error }
 *
 * 以前はサーバーアクションでログインしていたけど、
 * ・本番ではサーバーアクションのエラー文が隠されて「パスワードが違う」が表示されない
 * ・回数制限を掛けにくい（URLが決まっていないので Cloudflare のルールも書きにくい）
 * ので、APIにした。
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite/serverConfig";
import { setSessionCookie } from "@/lib/auth/sessionCookie";
import { clientIp, hitRateLimit } from "@/lib/auth/rateLimit";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT_PER_IP = 20;
const LIMIT_PER_EMAIL = 10;

const tooMany = () =>
  NextResponse.json({ error: "ログインの試行が多すぎるわ！💦 10分くらい待ってからもう一度試してね" }, { status: 429 });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password || email.length > 320 || password.length > 256) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してね！💦" }, { status: 400 });
  }

  if (!hitRateLimit(`login:ip:${clientIp(request)}`, LIMIT_PER_IP, WINDOW_MS)) return tooMany();
  if (!hitRateLimit(`login:email:${email}`, LIMIT_PER_EMAIL, WINDOW_MS)) return tooMany();

  try {
    // セッションの secret はAPIキー付きのクライアントでしか受け取れない
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);
    await setSessionCookie(session.secret, session.expire);
    // secret はブラウザに渡さない（クッキーだけで持つ）
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 401 || error?.code === 400) {
      return NextResponse.json({ error: "メールアドレスかパスワードが間違ってるわ！💦" }, { status: 401 });
    }
    if (error?.code === 429) return tooMany();
    console.error("ログインに失敗:", error?.message);
    return NextResponse.json({ error: "ログインに失敗したわ！💦 時間をおいてもう一度試してね" }, { status: 500 });
  }
}
