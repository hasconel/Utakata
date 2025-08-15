import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { deletePostOutbox } from "@/lib/activitypub/post";
import { Post as AppwritePost} from "@/types/appwrite";
import { ActivityPubNote } from "@/types/activitypub";
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
  if (acceptHeader === "application/activity+json") {
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
      const postData : ActivityPubNote = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": post.activityId || `${process.env.NEXT_PUBLIC_DOMAIN}/posts/${id}`,
        "type": "Note",
        "content": post.content,
        "published": post.published,
        "attributedTo": post.attributedTo || post.username,
        "to": post.to || [],
        "cc": post.cc || [],
        "inReplyTo": post.inReplyTo || "",
        "attachment": post.attachment || [],        
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