/**
 * ラジオ配信者の本人確認に使う短命トークンを発行する。
 * シグナリングサーバーはこのJWTをAppwriteに問い合わせてユーザーを確認する。
 */
import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";

export async function POST(request: Request) {
  try {
    const { account } = await createSessionClient(request);
    const { jwt } = await account.createJWT();
    return NextResponse.json({ jwt }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "ログインが必要だよ！💦" }, { status: 401 });
  }
}
