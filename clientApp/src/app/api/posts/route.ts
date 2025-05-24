/**
 * 投稿APIエンドポイント！✨
 * POSTリクエストを受け取り、投稿ロジックをpost.tsに委譲！💖
 * シンプルでキラキラ、ギャル風エラーで親しみやすく！😎
 */
import { Client ,Storage} from "appwrite";
import {  NextResponse } from "next/server";
import { createSessionClient,  } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";
import {  savePost, deliverActivity } from "@/lib/activitypub/post";
import { getActorByUserId } from "@/lib/appwrite/database";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { InputFile } from "node-appwrite/file";
import { Post } from "@/lib/appwrite/posts";
/**
 * 投稿API！✨
 * 画像付きの投稿を処理するよ！💖
 */
export async function POST(request: Request) {
  try {
    // セッションクライアントを作成
    const { account, databases, storage } = await createSessionClient();
    if (!account) {
      throw new Error("セッションが見つからないよ！💦");
    }

    // ログインユーザーを取得
    const user = await account.get();
    if (!user) {
      throw new Error("ユーザーが見つからないよ！💦");
    }

    const actor = await getActorByUserId(user.$id);
    if (!actor) {
      throw new Error("アクターが見つからないよ！💦");
    }

    const { content, visibility, images, inReplyTo } = await request.json();
    
    // 画像をアップロード
    const uploadedImages: ActivityPubImage[] = [];
    if (images && images.length > 0) {
      //console.log("画像アップロード開始！✨", images);
      
      for (const image of images) {
        try {
          
          // バイナリデータを取得
          const binaryData = Buffer.from(image.bin, 'base64');

          // Appwriteのストレージにアップロード
          const fileId = require("appwrite").ID.unique();
          
          await storage.createFile(
            process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!,
            fileId,
            InputFile.fromBuffer(binaryData, image.name),
            [
            ]
          );
          // 画像のURLを取得

          const fileUrlfunc = async (fileId:string)=> {
            const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
          const storage = new Storage(client);
          const result = await storage.getFileView(process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!, fileId)
            return result
            
          }
          const fileUrl = await fileUrlfunc(fileId);
          console.log("画像URL取得完了！✨", fileUrl);
          // ActivityPubImageオブジェクトを作成
          const activityPubImage = {
            type: "Image" as const,
            mediaType: image.mediaType,
            url: fileUrl,
            name: image.name,
            width: image.width,
            height: image.height,
            blurhash: image.blurhash,
          };
          uploadedImages.push(activityPubImage);
        } catch (error) {
          throw new Error("画像のアップロードに失敗したよ！💦");
        }
      }
    }

    // 画像が1つもアップロードできなかった場合はエラー
    if (images && images.length > 0 && uploadedImages.length === 0) {
      throw new Error("画像のアップロードに失敗したよ！もう一度試してみてね！💦");
    }
    
    //console.log("画像アップロード完了！✨", uploadedImages);

    // 投稿を保存
    const { document, activity, parentActorId } = await savePost(
      { content, visibility, inReplyTo },
      {
        actorId: actor.actorId,
        preferredUsername: actor.preferredUsername,
        displayName: actor.displayName || "",
        followers: actor.followers || [],
        avatarUrl: actor.avatarUrl || "",
      },
      uploadedImages
    );

    // ActivityPubで配信
    await deliverActivity(activity, {
      actorId: actor.actorId,
      privateKey: actor.privateKey,
      followers: actor.followers || [],
    }, parentActorId);

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error("投稿に失敗したよ！💦", error);
    return NextResponse.json(
      { error: error.message || "投稿に失敗したよ！もう一度試してみてね！💦" },
      { status: 500 }
    );
  }
}

/**
 * 投稿一覧を取得するAPIエンドポイント！✨
 */
export async function GET(request: Request) {
  const date = Date.now();
  const LimitDate = new Date(date);
  LimitDate.setHours(LimitDate.getHours() - 84);
  const dateString = LimitDate.toISOString();
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";
  const inReplyTo = searchParams.get("inReplyTo") ;
  const userId = searchParams.get("userId") ;
  const searchReplyTo = inReplyTo? [`https://${process.env.APPWRITE_DOMAIN}/posts/${inReplyTo}`] : "";
  const inReplyToQuery = inReplyTo? Query.equal('inReplyTo',searchReplyTo) : "";
  const attributedTo = searchParams.get("attributedTo") ;
  const searchAttributedTo = attributedTo? [`https://${process.env.APPWRITE_DOMAIN}/users/${attributedTo}`] : "";
  const attributedToQuery = attributedTo? Query.equal('attributedTo',searchAttributedTo) : "";
  const queries = [
    Query.orderDesc("$createdAt"),
    Query.limit(parseInt(limit)),
    Query.offset(parseInt(offset)),
    Query.greaterThan("$createdAt",dateString)
  ]
  if (inReplyTo) {
    queries.push(inReplyToQuery)
  }
  if (attributedTo) {
    queries.push(attributedToQuery)
  }
  try {
    const { databases, account } = await createSessionClient();    
    const currentUser = await account.get();
    if(userId){
      const currentUserActor = await getActorByUserId(userId);
      if(currentUserActor?.mutedUsers && currentUserActor.mutedUsers.length > 0){
        queries.push(Query.notEqual("attributedTo", currentUserActor.mutedUsers))
      }
    }

    const posts = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      queries
    );
    const postsAsPostArray: Post[] = [];
    for(const post of posts.documents){
      const subdocument = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
        [Query.equal("$id", post.$id)]
      );
      const postAsPost: Post = {
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
        avatar: post.avatar || "",
        LikedActors: subdocument.documents[0].LikedActors || [],
        replyCount: subdocument.documents[0].replyCount || 0,
        canDelete: post.attributedTo.split("/").pop() === currentUser?.name,
        isLiked: subdocument.documents[0].LikedActors.map((actor:string)=>actor.split("/").pop() || "").includes(currentUser?.name),
      }
      postsAsPostArray.push(postAsPost);
    }
    return NextResponse.json({postsAsPostArray});
  } catch (error) {
    console.error("投稿の取得に失敗したよ！💦", error);
    return NextResponse.json(
      { error: "投稿の取得に失敗したよ！💦" },
      { status: 500 }
    );
  }
}
