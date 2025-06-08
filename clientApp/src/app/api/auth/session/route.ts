import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * セッション情報を取得するAPI！✨
 * クライアント側で使うセッション情報を返すよ！💖
 */
export async function GET() {
  try {
    const session = cookies().get("my-custom-session");
    if (!session) {
      return NextResponse.json(
        { error: "セッションが見つからないよ！💦" },
        { status: 401 }
      );
    }
    return NextResponse.json({ secret: session.value });
  } catch (error) {
    return NextResponse.json(
      { error: "セッションの取得に失敗したよ！💦" },
      { status: 500 }
    );
  }
} 