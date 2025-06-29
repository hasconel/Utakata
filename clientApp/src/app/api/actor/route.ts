/**
 * ActorプロキシAPI！✨
 * 外部ドメインのActorエンドポイントにキラキラアクセス！💖
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actorUrl = searchParams.get("url");

    if (!actorUrl) {
      return NextResponse.json(
        { error: "Actor URLが必要だよ！💦" },
        { status: 400 }
      );
    }

    // 外部ドメインのActorエンドポイントにアクセス
    const response = await fetch(actorUrl, {
      method: "GET",
      headers: {
        "Accept": "application/activity+json",
        "User-Agent": "Utakata/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Actorの取得に失敗したよ！💦" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // CORSヘッダーを設定
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
      },
    });
  } catch (error) {
    console.error("Actorプロキシエラー:", error);
    return NextResponse.json(
      { error: "Actorの取得に失敗したよ！💦" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  });
} 