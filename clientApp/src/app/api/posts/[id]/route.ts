import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";

/**
 * 投稿を取得するAPIエンドポイント！✨
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { databases, account } = await createSessionClient(request);
    const currentUser = await account.get();
    const post = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      params.id
    );
    const subdocument = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
      params.id
    );

    const isLiked:boolean = subdocument.LikedActors.map((actor:string)=>actor.split("/").pop() || "").includes(currentUser?.name);
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
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { databases } = await createSessionClient(request);
    const deletepost = await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      params.id
    );
    return NextResponse.json(deletepost);
  } catch (error) {
    console.error("投稿の削除に失敗したよ！💦", error);
    return NextResponse.json(
      { error: "投稿の削除に失敗したよ！💦" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { databases } = await createSessionClient(request);
    const deletepost = await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      params.id
    );
    const deletepostsub = await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
      params.id
    );

    return NextResponse.json({deletepost,deletepostsub});
  } catch (error) {
    console.error("投稿の削除に失敗したよ！💦", error);
    return NextResponse.json(
      { error: "投稿の削除に失敗したよ！💦" },
      { status: 500 }
    );
  }
}