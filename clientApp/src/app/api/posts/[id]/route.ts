import { wantsActivityJson } from "@/lib/activitypub/contentNegotiation";
import { postToNote } from "@/lib/activitypub/localNote";
import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/serverConfig";
import { deletePostOutbox } from "@/lib/activitypub/post";
import { Post as AppwritePost} from "@/types/appwrite";
/**
 * 投稿を取得するAPIエンドポイント！✨
 * Acceptヘッダーによって振る舞いを変えるよ！💖
 */
export async function GET(  
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const header = request.headers;
  const acceptHeader = header.get("Accept");
  
  
  // ActivityPubリクエストの場合はJSON形式で返す！✨
  if (wantsActivityJson(acceptHeader)) {
    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" }, 
        { status: 400 }
      );
    }
    
    // ここでPostデータをactivitypubのNoteに変換してJSONで返す
    try {
      const { databases } = await createSessionClient(request);  
      //　ログインしているユーザーのIDを取得
      //console.log("user", user);
      // 投稿が見つからなかった場合は404エラーを返す
      //console.log("id", id);
      const post  = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_COLLECTION_ID!,
        id
      ).then((post) => {
        return post as AppwritePost;
      }).catch(() => {
        //console.error("投稿が見つからなかったよ！💦", error);
        return NextResponse.json(
          { error: "投稿が見つからなかったよ！💦" },
          { status: 404 }
        );
      });      
      if (post instanceof NextResponse) return post;

      // ここで投稿データをActivityPubのNote形式に変換するよ！💖
      // 配信時やoutboxと同じ形で返す
      const note = postToNote({ ...post, activityId: post.activityId || `${process.env.NEXT_PUBLIC_DOMAIN}/posts/${id}`, attributedTo: post.attributedTo || post.username });
      // ブースト数。Mastodonなどは shares.totalItems を読んで件数を表示する
      const sharesCollection = process.env.APPWRITE_SHARES_COLLECTION_ID;
      const shareCount = sharesCollection
        ? await (await createAdminClient()).databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            sharesCollection,
            [Query.equal("object", note.id), Query.limit(1)]
          ).then(({ total }) => total).catch(() => null)
        : null;
      const postData = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        ...note,
        ...(shareCount !== null ? { shares: { id: `${note.id}#shares`, type: "Collection", totalItems: shareCount } } : {}),
      };

      return NextResponse.json(postData, {
        headers: {
          'Content-Type': 'application/activity+json'
        }
      });
    } catch (error) {
      //console.error("ActivityPub投稿取得エラー:", error);
      return NextResponse.json(
        { error: "投稿の取得に失敗しました" },
        { status: 500 }
      );
    }
  }

  // 通常のHTTPリクエストの場合は404エラーを返すよ〜💦
  return NextResponse.json(
    { error: "このエンドポイントはActivityPubリクエストのみ対応してるよ！" },
    { status: 404 }
  );

}

export async function DELETE( request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const url = new URL(request.url);
    if(url.pathname.split("/").pop() !== id) return NextResponse.json({ error: "投稿を削除する権限がありません！💦" }, { status: 403 });
    const deleteActivityPub = await deletePostOutbox(`${process.env.NEXT_PUBLIC_DOMAIN}/posts/${id}`);

    return NextResponse.json({ 
      message: "投稿を削除しました！✨",
      deleteActivityPub 
    });
  } catch (error) {
    //console.error("投稿の削除に失敗したよ！💦", error);
    return NextResponse.json(
      { error: "投稿の削除に失敗したよ！💦" },
      { status: 500 }
    );
  }
}