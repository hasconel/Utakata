import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { deletePostOutbox } from "@/lib/activitypub/post";

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
      const post = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_COLLECTION_ID!,
        id
      );
      if (!post) {
        return NextResponse.json(
          { error: "Post not found" }, 
          { status: 404 }
        );
      }
      
      // ここで投稿データをActivityPubのNote形式に変換するよ！💖
      const postData = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": post.activityId || `${process.env.NEXT_PUBLIC_DOMAIN}/posts/${id}`,
        "type": "Note",
        "content": post.content,
        "published": post.published,
        "summary": null,
        "attributedTo": post.attributedTo,
        "to": post.to,
        "cc": post.cc,
        "inReplyTo": post.inReplyTo,
        "attachment": post.attachment,
      };

      return NextResponse.json(postData, {
        headers: {
          'Content-Type': 'application/activity+json'
        }
      });
    } catch (error) {
      console.error("ActivityPub投稿取得エラー:", error);
      return NextResponse.json(
        { error: "投稿の取得に失敗しました" },
        { status: 500 }
      );
    }
  }

  // 通常のWebリクエストの場合は投稿データを返す！✨
  try {
    const { databases, account } = await createSessionClient(request);
    const currentUser = await account.get();
    const post = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      id
    );
    const subdocument = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
      id
    );

    const isLiked: boolean = subdocument.LikedActors.map((actor: string) => actor.split("/").pop() || "").includes(currentUser?.name);
    const postWithSubdocument = {
      $id: post.$id,
      $createdAt: post.$createdAt,
      $updatedAt: post.$updatedAt,
      content: post.content,
      username: post.username,
      activityId: post.activityId,
      to: post.to,
      cc: post.cc,
      published: post.published,
      inReplyTo: post.inReplyTo,
      attributedTo: post.attributedTo,
      attachment: post.attachment,
      avatar: post.avatar,
      LikedActors: subdocument.LikedActors,
      replyCount: subdocument.replyCount,
      canDelete: post.attributedTo.split("/").pop() === currentUser?.name,
      isLiked: isLiked,
    };
    return NextResponse.json(postWithSubdocument);
  } catch (error) {
    console.error("投稿の取得に失敗したよ！💦", error);
    return NextResponse.json(
      { error: "投稿の取得に失敗したよ！💦" },
      { status: 500 }
    );
  }
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
    console.error("投稿の削除に失敗したよ！💦", error);
    return NextResponse.json(
      { error: "投稿の削除に失敗したよ！💦" },
      { status: 500 }
    );
  }
}