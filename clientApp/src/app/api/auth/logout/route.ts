/**
 * ログアウトのAPI！🫧
 * POST /api/auth/logout  →  200 { ok: true }
 * Appwrite側のセッションの削除に失敗しても、クッキーは必ず消す（ログアウトできない状態にしない）。
 */
import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { clearSessionCookie } from "@/lib/auth/sessionCookie";

export async function POST(request: NextRequest) {
  try {
    const { account } = await createSessionClient(request);
    await account.deleteSession("current");
  } catch (error: any) {
    // 期限切れなどでセッションが既に無いときもここに来る
    if (error?.code !== 401) console.error("セッションの削除に失敗:", error?.message);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
