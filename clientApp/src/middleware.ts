import { NextRequest, NextResponse } from 'next/server';
import { getActorByUserId } from '@/lib/appwrite/database';

/**
 * ミドルウェア！✨
 * Acceptヘッダーをチェックして、ActivityPubリクエストを適切にルーティングするよ！💖
 */
export async function middleware(request: NextRequest) {
  // request.nextUrlがundefinedの場合はスキップ！✨
  if (!request.nextUrl) {
    //console.log("request.nextUrl is undefined, skipping middleware");
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const acceptHeader = request.headers.get('Accept');
  
  // デバッグ用ログ（必要に応じてコメントアウト）
  // console.log("Middleware - pathname:", pathname);
  // console.log("Middleware - searchParams:", request.nextUrl.searchParams.toString());
  // console.log("Middleware - Accept header:", acceptHeader);

  // 投稿詳細ページのパスをチェック！✨
  if (pathname && pathname.startsWith('/posts/') ) {
    // Acceptヘッダーがapplication/activity+jsonもしくはapplication/ld+json; profile="https://www.w3.org/ns/activitystreams"の場合はAPI Routeにルーティング！✨
    if (acceptHeader === 'application/activity+json' || acceptHeader === 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"') {
      // クエリパラメータを保持してAPI Routeにリライト
      const apiUrl = new URL(`/api${pathname}`, request.url);
      // 元のURLのクエリパラメータをコピー
      request.nextUrl.searchParams.forEach((value, key) => {
        apiUrl.searchParams.set(key, value);
      });
      return NextResponse.rewrite(apiUrl);
    }
    
    // 通常のリクエストの場合はページコンポーネントにルーティング！✨
    return NextResponse.next();
  }
  //console.log("pathname", pathname,pathname.split('/').length,pathname.startsWith("/users/"));
  // ユーザープロフィールページのパスをチェック！✨
  if (pathname && pathname.startsWith("/users/") ) {
    // acceptHeaderがapplication/activity+jsonもしくはapplication/ld+json; profile="https://www.w3.org/ns/activitystreams"の場合はユーザープロフィールページにリダイレクト！✨
    if (acceptHeader !== 'application/activity+json' && acceptHeader !== 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"' && pathname.split('/').length === 3) {
      //console.log("pathname", pathname);
      const actor = await getActorByUserId(pathname.split('/').pop()!);
      if(actor) return NextResponse.redirect(new URL(`/@${actor.preferredUsername}`, request.url));
    }else{
      // クエリパラメータを保持してAPI Routeにリライト
      const apiUrl = new URL(`${pathname}`, request.url);
      // 元のURLのクエリパラメータをコピー
      request.nextUrl.searchParams.forEach((value, key) => {
        apiUrl.searchParams.set(key, value);
      });
      return NextResponse.rewrite(apiUrl);
    }
    return NextResponse.next();
  }


  //console.log("No matching route, continuing normally");
  return NextResponse.next();
}

/**
 * ミドルウェアを適用するパスを指定！✨
 */
export const config = {
  matcher: [
    '/posts/:path*',
    '/users/:path*',
  ],
}; 