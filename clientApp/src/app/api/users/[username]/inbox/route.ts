/**
 * inboxエンドポイント！✨
 * ActivityPubのinbox処理をキラキラ実装！💖
 * フォロー、リプライ、いいねを受信してデータベースに保存！📬
 */
import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";
import { verifySignature } from "@/lib/activitypub/crypto";
import { Errors } from "@/lib/activitypub/errors";
import { Actor, isActor } from "@/lib/appwrite/database";
import sanitizeHtml from "sanitize-html";

/**
 * POSTハンドラ：inboxにActivityPubアクティビティを受信！📝
 * @param req リクエスト（JSON：ActivityPubアクティビティ）
 * @param params ルートパラメータ（username）
 * @returns 処理結果（200）またはエラー（400/401/404）
 */
export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params;
    const {databases} =await createSessionClient();
    // アクターを取得（preferredUsernameで検索）
    const { documents } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, [
      Query.equal("preferredUsername", username),
    ]);

    if (documents.length === 0) {
      return NextResponse.json({ error: Errors.UserNotFound }, { status: 404 });
    }

    const doc = documents[0];
    if (!isActor(doc)) {
      return NextResponse.json({ error: Errors.InvalidActor }, { status: 400 });
    }

    // Actor型に変換（型ガードで安全）
    const actor: Actor = {
      $id: doc.$id,
      actorId: doc.actorId,
      preferredUsername: doc.preferredUsername,
      displayName: doc.displayName || doc.preferredUsername,
      followers: doc.followers,
      privateKey: doc.privateKey,
      userId: doc.userId,
    };

    // displayNameがない場合、preferredUsernameを保存
    if (!doc.displayName) {
      await databases.updateDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, actor.$id, {
        displayName: actor.preferredUsername,
      });
    }

    // HTTP Signature検証
    const body = await req.json();
    const signatureValid = await verifySignature(req, actor); // 50行目

    if (!signatureValid) {
      return NextResponse.json({ error: Errors.InvalidSignature }, { status: 401 });
    }

    // アクティビティを処理
    if (body.type === "Follow") {
      // フォロー処理
      await databases.updateDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, actor.$id, {
        followers: [...(actor.followers || []), body.actor],
      });
      // Acceptアクティビティを返す
      const accept = {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: `https://${process.env.APPWRITE_DOMAIN}/users/${username}/follows/${require("node-appwrite").ID.unique()}`,
        type: "Accept",
        actor: actor.actorId,
        object: body,
      };
      return NextResponse.json(accept, { status: 200 });
    } else if (body.type === "Create" && body.object.type === "Note") {
      // 投稿（リプライなど）を保存
      const sanitizedDisplayName = sanitizeHtml(actor.displayName || "", {
        allowedTags: [],
        allowedAttributes: {},
      });
      await databases.createDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, require("node-appwrite").ID.unique(), {
        content: body.object.content,
        username: sanitizedDisplayName,
        activityId: body.object.id,
        to: Array.isArray(body.object.to) ? body.object.to.join(",") : body.object.to,
        cc: Array.isArray(body.object.cc) ? body.object.cc : body.object.cc ? [body.object.cc] : [],
        published: body.object.published,
        inReplyTo: body.object.inReplyTo || null,
        replyCount: 0,
      });
      return NextResponse.json({ message: "投稿を受信したよ！✨" }, { status: 200 });
    }

    return NextResponse.json({ message: "アクティビティを受信したよ！✨" }, { status: 200 });
  } catch (err: any) {
    console.error("Inbox error:", err);
    return NextResponse.json({ error: err.message || Errors.InboxFailed }, { status: 400 });
  }
}