/**
 * WebFingerプロキシAPI！✨
 * 外部ドメインのWebFingerエンドポイントにキラキラアクセス！💖
 */
import { NextRequest, NextResponse } from "next/server";
import { BlockedUrlError, safeFetch } from "@/lib/security/safeFetch";

/**
 * ドメインからWebFingerのURLを作る。
 * ホスト名（とポート）以外が混ざっていれば、別のパスを取得させられるので null を返す。
 */
function buildWebfingerUrl(domain: string, resource: string): string | null {
  try {
    const url = new URL(`https://${domain}/.well-known/webfinger`);
    if (url.host !== domain.toLowerCase()) return null;
    url.searchParams.set("resource", resource);
    return url.toString();
  } catch {
    return null;
  }
}

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

    const webfingerUrl = buildWebfingerUrl(domain, resource);
    if (!webfingerUrl) {
      return NextResponse.json(
        { error: "ドメインの形式が正しくないよ！💦" },
        { status: 400 }
      );
    }

    // 外部ドメインのWebFingerエンドポイントにアクセス
    const response = await safeFetch(webfingerUrl, {
      headers: {
        "Accept": "application/activity+json, application/jrd+json",
        "User-Agent": "Utakata/1.0",
      },
      maxBytes: 1024 * 1024,
      timeoutMs: 5_000,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "WebFingerの取得に失敗したよ！💦" },
        { status: response.status }
      );
    }

    const data = JSON.parse(response.body.toString("utf-8"));

    // CORSヘッダーを設定
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
      },
    });
  } catch (error) {
    if (error instanceof BlockedUrlError) {
      return NextResponse.json(
        { error: "このドメインは取得できないよ！💦" },
        { status: 400 }
      );
    }
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