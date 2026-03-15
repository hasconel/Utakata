import { NextRequest, NextResponse } from 'next/server';

/**
 * ミドルウェア！✨
 * Acceptヘッダーをチェックして、ActivityPubリクエストを適切にルーティングするよ！💖
 * ※ Edge Runtime のため database（crypto 使用）は import せず、API を fetch するよ！🔒
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
      const userId = pathname.split('/').pop()!;
      try {
        const res = await fetch(new URL(`/api/users/${userId}/preferred-username`, request.url));
        if (res.ok) {
          const { preferredUsername } = await res.json();
          if (preferredUsername) return NextResponse.redirect(new URL(`/@${preferredUsername}`, request.url));
        }
      } catch {
        // fetch 失敗時はそのまま next
      }
    } else {
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