import { wantsActivityJson } from "@/lib/activitypub/contentNegotiation";
import { NextRequest, NextResponse } from 'next/server';

/**
 * プロキシ（旧 middleware）！✨
 * Acceptヘッダーをチェックして、ActivityPubリクエストを適切にルーティングするよ！💖
 * ※ Edge Runtime のため database（crypto 使用）は import せず、API を fetch するよ！🔒
 */
export async function proxy(request: NextRequest) {
  // request.nextUrlがundefinedの場合はスキップ！✨
  if (!request.nextUrl) {
    //console.log("request.nextUrl is undefined, skipping middleware");
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const acceptHeader = request.headers.get('Accept');
  
  // /@ユーザー名 はHTMLのページしかないので、ActivityPubのリクエストはactorへ転送する
  const profile = pathname?.match(/^\/(?:@|%40)(.+)$/);
  if (profile && wantsActivityJson(acceptHeader)) {
    // 他サーバーのユーザー（@a@example.com）や不正な名前はここでは扱わない
    if (!/^[A-Za-z0-9_-]+$/.test(profile[1])) {
      return NextResponse.json({ error: "Actor not found" }, { status: 404 });
    }
    return NextResponse.rewrite(new URL(`/api/profile-actor/${profile[1]}`, request.url));
  }

  // デバッグ用ログ（必要に応じてコメントアウト）
  // console.log("Middleware - pathname:", pathname);
  // console.log("Middleware - searchParams:", request.nextUrl.searchParams.toString());
  // console.log("Middleware - Accept header:", acceptHeader);

  // 投稿詳細ページのパスをチェック！✨
  if (pathname && pathname.startsWith('/posts/') ) {
    // ActivityPubのJSONを求めるリクエストはAPI Routeにルーティング！✨
    if (wantsActivityJson(acceptHeader)) {
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
    // ActivityPub以外のリクエストはユーザープロフィールページにリダイレクト！✨
    if (!wantsActivityJson(acceptHeader) && pathname.split('/').length === 3) {
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
    '/@:user',
    '/%40:user',
  ],
}; 