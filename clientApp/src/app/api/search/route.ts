import { Client, Databases, Query } from 'node-appwrite';
import { getStaticFile, interpolate, throwIfMissing } from '@/lib/appwrite/serverConfig';
import { MeiliSearch } from 'meilisearch';

/**
 * 検索機能のサーバーサイドルートハンドラー！✨
 * AppwriteとMeiliSearchを使って検索機能を提供するよ！💖
 */
export default async (req: Request, log: (message: string) => void) => {
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
    if (req.method === 'GET') {
      log('GETリクエストを受信したよ！✨');
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
    log('Appwriteクライアントを初期化するよ！✨');
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT!)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
      .setKey(req.headers.get('x-appwrite-key')!);

    const databases = new Databases(client);

    // MeiliSearchの初期化！✨
    log('MeiliSearchクライアントを初期化するよ！✨');
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

      log(`ドキュメントを取得中... (cursor: ${cursor || '初期'})`);
      const { documents } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_COLLECTION_ID!,
        queries
      );

      if (documents.length > 0) {
        cursor = documents[documents.length - 1].$id;
        totalSynced += documents.length;

        log(`同期中... (${totalSynced}件目まで完了)`);
        await index.addDocuments(documents, { primaryKey: '$id' });
      } else {
        log('ドキュメントが見つからないよ！✨');
        cursor = null;
        break;
      }
    } while (cursor !== null);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    log(`同期完了！✨ (${totalSynced}件を${duration}秒で同期したよ！)`);
    return new Response(JSON.stringify({
      status: 'success',
      totalSynced,
      duration,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    log(`エラーが発生したよ！✨: ${error instanceof Error ? error.message : '不明なエラー'}`);
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : '不明なエラー',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
