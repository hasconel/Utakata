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
  //console.log("pathname", pathname);
  const acceptHeader = request.headers.get('Accept');
  //console.log("pathname", pathname);

  // 投稿詳細ページのパスをチェック！✨
  if (pathname && pathname.startsWith('/posts/') && pathname.split('/').length === 3) {
    // Acceptヘッダーがapplication/activity+jsonもしくはapplication/ld+json; profile="https://www.w3.org/ns/activitystreams"の場合はAPI Routeにルーティング！✨
    if (acceptHeader === 'application/activity+json' || acceptHeader === 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"') {
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
    if (acceptHeader !== 'application/activity+json' && acceptHeader !== 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"') {
      //console.log("pathname", pathname);
      const actor = await getActorByUserId(pathname.split('/').pop()!);
      if(actor) return NextResponse.redirect(new URL(`/@${actor.preferredUsername}`, request.url));
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