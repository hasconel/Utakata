import { Client, Databases, Query } from 'node-appwrite';
import { getStaticFile, interpolate, throwIfMissing } from '@/lib/appwrite/serverConfig';
import { MeiliSearch } from 'meilisearch';
import { NextResponse } from "next/server";

/**
 * 検索機能のサーバーサイドルートハンドラー！✨
 * AppwriteとMeiliSearchを使って検索機能を提供するよ！💖
 */
export async function GET(request: Request) {
  try {
    // 環境変数のチェック！✨
    throwIfMissing(process.env, [
      'APPWRITE_DATABASE_ID',
      'APPWRITE_COLLECTION_ID',
      'MEILISEARCH_ENDPOINT',
      'MEILISEARCH_INDEX_NAME',
      'MEILISEARCH_ADMIN_API_KEY',
      'MEILISEARCH_SEARCH_API_KEY',
    ]);

    // GETリクエストの処理！✨
    if (request.method === 'GET') {
      const staticFile = await getStaticFile('index.html');
      const html = await interpolate(staticFile, {
        MEILISEARCH_ENDPOINT: process.env.MEILISEARCH_ENDPOINT,
        MEILISEARCH_INDEX_NAME: process.env.MEILISEARCH_INDEX_NAME,
        MEILISEARCH_SEARCH_API_KEY: process.env.MEILISEARCH_SEARCH_API_KEY,
      });
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // クライアントの初期化！✨
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(request.headers.get('x-appwrite-key')!);

    const databases = new Databases(client);

    // MeiliSearchの初期化！✨
    const meilisearch = new MeiliSearch({
      host: process.env.MEILISEARCH_ENDPOINT!,
      apiKey: process.env.MEILISEARCH_ADMIN_API_KEY!,
    });

    const index = meilisearch.index(process.env.MEILISEARCH_INDEX_NAME!);

    // ドキュメントの同期処理！✨
    let cursor = null;
    let totalSynced = 0;
    let startTime = Date.now();

    do {
      const queries = [Query.limit(100)];

      if (cursor) {
        queries.push(Query.cursorAfter(cursor));
      }

      const { documents } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_COLLECTION_ID!,
        queries
      );

      if (documents.length > 0) {
        cursor = documents[documents.length - 1].$id;
        totalSynced += documents.length;

        await index.addDocuments(documents, { primaryKey: '$id' });
      } else {
        cursor = null;
        break;
      }
    } while (cursor !== null);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    const results = {
      status: 'success',
      totalSynced,
      duration,
    };

    return NextResponse.json(results);

  } catch (error) {
    const results = {
      status: 'error',
      message: error instanceof Error ? error.message : '不明なエラー',
    };

    return NextResponse.json(results, { status: 500 });
  }
}
