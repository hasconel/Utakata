/**
 * 画像プロキシAPI！✨
 * 外部ドメインの画像にキラキラアクセス！💖
 */
import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "画像URLが必要だよ！💦" },
        { status: 400 }
      );
    }
    // 画像URLが内部ドメインの場合は
    // 外部ドメインの画像にアクセス
    if(imageUrl.startsWith(process.env.APPWRITE_ENDPOINT!)) {
        const { storage } = await createSessionClient()
        //console.log("imageUrl", imageUrl)
        // URLからファイルIDを抽出 urlの例＝https://appwrite.utakata.net/files/646464646464646464646464/view?project=646464646464646464646464
        const fileIdIndex = imageUrl.split("/").findIndex((item:string) => (item.startsWith("files")))
        const fileId = imageUrl.split("/")[fileIdIndex+1]
        const file = await storage.getFileView(process.env.APPWRITE_STORAGE_ID!, fileId);
        return new NextResponse(file, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
          },
        })

    }
    const response = await fetch(imageUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Utakata/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "画像の取得に失敗したよ！💦" },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // 画像データをそのまま返す
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=3600", // 1時間キャッシュ
      },
    });
  } catch (error) {
    console.error("画像プロキシエラー:", error);
    return NextResponse.json(
      { error: "画像の取得に失敗したよ！💦" },
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}