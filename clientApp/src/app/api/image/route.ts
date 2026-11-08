/**
 * 画像プロキシAPI！✨
 * 外部ドメインの画像にキラキラアクセス！💖
 */
import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { BlockedUrlError, safeFetch } from "@/lib/security/safeFetch";
import { rangeResponse } from "@/lib/media/range";

const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

/** 自サイトのページとして表示されないよう、返してよい形式はメディアだけに限る（SVGはスクリプトを含めるので不可） */
function isAllowedMediaType(contentType: string): boolean {
  const type = contentType.split(";")[0].trim().toLowerCase();
  return /^(image|video|audio)\//.test(type) && type !== "image/svg+xml";
}

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
        const [meta, file] = await Promise.all([
          storage.getFile(process.env.APPWRITE_STORAGE_ID!, fileId),
          storage.getFileView(process.env.APPWRITE_STORAGE_ID!, fileId),
        ]);
        if (!isAllowedMediaType(meta.mimeType)) {
          return NextResponse.json({ error: "対応していない形式だよ！💦" }, { status: 415 });
        }
        return new NextResponse(file, {
          status: 200,
          headers: {
            "Content-Type": meta.mimeType,
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; sandbox",
          },
        })

    }
    const response = await safeFetch(imageUrl, {
      headers: {
        "User-Agent": "Utakata/1.0",
      },
      maxBytes: MAX_MEDIA_BYTES,
      timeoutMs: 30_000,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "画像の取得に失敗したよ！💦" },
        { status: response.status }
      );
    }

    const contentType = response.contentType;
    if (!isAllowedMediaType(contentType)) {
      return NextResponse.json(
        { error: "対応していない形式だよ！💦" },
        { status: 415 }
      );
    }

    // そのまま返す。外部の画像は変わらないことが多いので、CDN に1週間覚えてもらう（同じ画像で関数を動かさない）
    // 動画のために Range（一部だけ）にも応える
    return rangeResponse(new Uint8Array(response.body), request, {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    });
  } catch (error) {
    if (error instanceof BlockedUrlError) {
      return NextResponse.json({ error: "このURLは取得できないよ！💦" }, { status: 400 });
    }
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