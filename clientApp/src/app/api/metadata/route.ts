import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

/**
 * メタデータを取得するAPIエンドポイント！✨
 * URLからメタデータを取得して返すよ！💖
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URLが指定されていないわ！💦" },
        { status: 400 }
      );
    }

    // URLからHTMLを取得
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // メタデータを取得
    const metadata = {
      title: getMetaContent(document, "og:title") || document.title,
      description: getMetaContent(document, "og:description") || getMetaContent(document, "description"),
      image: getMetaContent(document, "og:image"),
      siteName: getMetaContent(document, "og:site_name"),
      favicon: getFavicon(document, url),
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("メタデータの取得に失敗したわ！", error);
    return NextResponse.json(
      { error: "メタデータの取得に失敗したわ！💦" },
      { status: 500 }
    );
  }
}

/**
 * メタタグの内容を取得する関数！✨
 */
function getMetaContent(document: Document, property: string): string | null {
  const meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  return meta?.getAttribute("content") || null;
}

/**
 * ファビコンを取得する関数！✨
 */
function getFavicon(document: Document, baseUrl: string): string | null {
  // リンクタグからファビコンを探す
  const link = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  if (link) {
    const href = link.getAttribute("href");
    if (href) {
      return new URL(href, baseUrl).toString();
    }
  }

  // デフォルトのファビコンを返す
  return new URL("/favicon.ico", baseUrl).toString();
} 