import { MeiliSearch } from 'meilisearch';
const meilisearch = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST!,
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY!,
});


import { NextResponse } from "next/server";

/**
 * 検索機能のサーバーサイドルートハンドラー！✨
 * AppwriteとMeiliSearchを使って検索機能を提供するよ！💖
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const results = await meilisearch.index('posts').search(q);
  const filteredResults = results.hits.filter((hit: any)=>hit.activityId.includes(process.env.NEXT_PUBLIC_DOMAIN!))
    .filter((hit:any) => new Date(hit.published) > new Date(new Date().getTime() - 1000 * 60 * 60 * 87))
    .sort((a: any, b: any) => new Date(b.published).getTime() - new Date(a.published).getTime())
  const resultsActivityIds = filteredResults.map((hit: any) => hit.activityId);
  return NextResponse.json(resultsActivityIds);
}
