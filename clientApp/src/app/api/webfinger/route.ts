/**
 * WebFingerプロキシAPI！✨
 * 外部ドメインのWebFingerエンドポイントにキラキラアクセス！💖
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const domain = searchParams.get("domain");

    if (!resource || !domain) {
      return NextResponse.json(
        { error: "リソースとドメインが必要だよ！💦" },
        { status: 400 }
      );
    }

    // 外部ドメインのWebFingerエンドポイントにアクセス
    const webfingerUrl = `https://${domain}/.well-known/webfinger?resource=${encodeURIComponent(resource)}`;
    
    const response = await fetch(webfingerUrl, {
      method: "GET",
      headers: {
        "Accept": "application/activity+json, application/jrd+json",
        "User-Agent": "Utakata/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "WebFingerの取得に失敗したよ！💦" },
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
    console.error("WebFingerプロキシエラー:", error);
    return NextResponse.json(
      { error: "WebFingerの取得に失敗したよ！💦" },
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