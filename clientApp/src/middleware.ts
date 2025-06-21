import { NextRequest, NextResponse } from 'next/server';

/**
 * ミドルウェア！✨
 * Acceptヘッダーをチェックして、ActivityPubリクエストを適切にルーティングするよ！💖
 */
export function middleware(request: NextRequest) {
  // request.nextUrlがundefinedの場合はスキップ！✨
  if (!request.nextUrl) {
    console.log("request.nextUrl is undefined, skipping middleware");
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const acceptHeader = request.headers.get('Accept');
  console.log("pathname", pathname);

  // 投稿詳細ページのパスをチェック！✨
  if (pathname && pathname.startsWith('/posts/') && pathname.split('/').length === 3) {
    // Acceptヘッダーがapplication/activity+jsonの場合はAPI Routeにルーティング！✨
    if (acceptHeader === 'application/activity+json') {
      const postId = pathname.split('/').pop();
      const apiUrl = new URL(`/api/posts/${postId}`, request.url);
      return NextResponse.rewrite(apiUrl);
    }
    
    // 通常のリクエストの場合はページコンポーネントにルーティング！✨
    return NextResponse.next();
  }
  //console.log("pathname", pathname,pathname.split('/').length,pathname.startsWith("/users/"));
  // ユーザープロフィールページのパスをチェック！✨
  if (pathname && pathname.startsWith("/users/") && pathname.split('/').length === 3) {
    // Acceptヘッダーがapplication/activity+jsonの場合はAPI Routeにルーティング！✨
    if (acceptHeader === 'application/activity+json') {
      const username = pathname.split('/').pop()?.split('?')[0].split('&')[0].split('=')[0].split('#')[0];
      //console.log("Routing to API route for user:", username);
      const apiUrl = new URL(`/api/users/${username}`, request.url);
      return NextResponse.rewrite(apiUrl);
    }
    
    // 通常のリクエストの場合はページコンポーネントにルーティング！✨
    console.log("Routing to page component");
    return NextResponse.next();
  }

  console.log("No matching route, continuing normally");
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