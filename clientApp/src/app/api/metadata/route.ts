/**
 * リンクカード用に、ページのタイトル・説明・画像を返す。
 *   ・<head> の meta だけを軽く読む（以前は JSDOM でページ全体を組み立てていて重かった）
 *   ・結果は CDN に1日覚えてもらう（同じURLのカードで、毎回相手のサイトを読みに行かない）
 */
import { NextResponse } from "next/server";
import { BlockedUrlError, safeFetch } from "@/lib/security/safeFetch";

const CACHE = { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" };
// 失敗も少しだけ覚えておく（読めないサイトを何度も読みに行かない）
const FAIL_CACHE = { "Cache-Control": "public, max-age=300, s-maxage=3600" };

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

/** タグの属性を { name: value } にする */
function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? m[5] ?? "");
  }
  return result;
}

function absolute(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    const url = new URL(href, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function parseMetadata(html: string, pageUrl: string) {
  // 本文より前（<head>）だけを見る
  const head = html.slice(0, Math.max(html.search(/<\/head>/i), 0) || 200_000);
  const meta = new Map<string, string>();
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attributes(m[0]);
    const key = (a.property || a.name || "").toLowerCase();
    if (key && a.content && !meta.has(key)) meta.set(key, a.content);
  }
  let favicon: string | undefined;
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
    const a = attributes(m[0]);
    if (/(^|\s)(shortcut\s+)?icon(\s|$)/i.test(a.rel || "")) {
      favicon = absolute(a.href, pageUrl);
      break;
    }
  }
  const title = meta.get("og:title") || meta.get("twitter:title") || decode(head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
  return {
    title: title || undefined,
    description: meta.get("og:description") || meta.get("twitter:description") || meta.get("description") || undefined,
    image: absolute(meta.get("og:image") || meta.get("twitter:image"), pageUrl),
    siteName: meta.get("og:site_name") || undefined,
    favicon: favicon ?? absolute("/favicon.ico", pageUrl),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "URLが指定されていないわ！💦" }, { status: 400 });
  try {
    const response = await safeFetch(url, {
      headers: { "User-Agent": "Utakata/1.0 (link preview)", Accept: "text/html,application/xhtml+xml" },
      maxBytes: 1024 * 1024,
      timeoutMs: 5_000,
    });
    if (!response.ok || !/^(text\/html|application\/xhtml\+xml)/i.test(response.contentType)) {
      return NextResponse.json({ error: "HTMLではないわ！💦" }, { status: 415, headers: FAIL_CACHE });
    }
    return NextResponse.json(parseMetadata(response.body.toString("utf-8"), url), { headers: CACHE });
  } catch (error) {
    if (error instanceof BlockedUrlError) {
      return NextResponse.json({ error: "このURLは取得できないわ！💦" }, { status: 400, headers: FAIL_CACHE });
    }
    return NextResponse.json({ error: "メタデータの取得に失敗したわ！💦" }, { status: 502, headers: FAIL_CACHE });
  }
}
