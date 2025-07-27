import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/serverConfig";
import { verifySignature } from "@/lib/activitypub/crypto";
import { deleteFollowInbox, createFollowInbox } from "@/lib/api/follow";

export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const { user: username } = await params;
  const header = request.headers;
  if(header.get("Accept") !== "application/activity+json"){
    return NextResponse.json({ error: "Accept header is required" }, { status: 400 });
  }
  if (!username) {
    return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
  }

  const { databases } = await createSessionClient();
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    [Query.equal("preferredUsername", username)]
  );

  if (documents.length === 0) {
    return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  }

  const actor = documents[0];
  const actorId = `${actor.actorId}`;

  // TODO: 受信したアクティビティ一覧を取得する実装を追加するよ！✨
  return NextResponse.json({
    "@context": "https://www.w3.org/ns/activitystreams",
    "id": `${actorId}/inbox`,
    "type": "OrderedCollection",
    "totalItems": 0,
    "first": {
      "type": "OrderedCollectionPage",
      "id": `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/inbox?page=1`,
      "partOf": `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/inbox`,
      "orderedItems": [],
      "next": null
    }
  }, {
    headers: {
      'Content-Type': 'application/activity+json'
    }
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const { user: username } = await params;
  const header = request.headers;
  const activity = await request.json();

  if(header.get("Accept") !== "application/activity+json"){
    return NextResponse.json({ error: "Accept header is required" }, { status: 400 });
  }
  if (!username) {
    return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
  }
  // actorがオブジェクト化されている場合はidを取得、そうでない場合はIdだろうということでそのまま
  const ActorId = activity.actor.id? activity.actor.id : activity.actor;
  console.log(ActorId);
  // HTTPシグネチャの検証
  
  const verified = await verifySignature(request, ActorId);
  if(!verified){
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }
  const { databases : adminDatabases } = await createAdminClient();
  
  // TODO: アクティビティを保存する実装を追加するよ！✨
  // アクティビティの種類によって分岐するよ
  const ObjectId = activity.object.id? activity.object.id : activity.object;
  // フォローの場合
  if(activity.type === "Follow"){
    const follow = await createFollowInbox(activity.id, ActorId, ObjectId);
    if(follow === activity.id){
    return NextResponse.json({ 
      "type": "Accept",
      "actor": ActorId,
      "object": activity
     }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to create follow" }, { status: 400 });
  }
  // 投稿の場合
  if(activity.type === "Create"){
    // Noteの場合
    if(activity.object.type === "Note"){
      const NoteId = activity.object.id;
      // NoteのIdが重複していないか確認
      const { documents : noteDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_COLLECTION_ID!,
        [Query.equal("activityId", NoteId)]
      );
      if(noteDocuments.length > 0){
        return NextResponse.json({ error: "Note already exists" }, { status: 400 });
      }
      // Noteのデータを作成
      const note = await adminDatabases.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_COLLECTION_ID!,
        ID.unique(),
        {
          "activityId": NoteId,
          "username": activity.actor.name? activity.actor.name : activity.actor.preferredUsername,
          "content": activity.object.content,
          "createdAt": new Date().toISOString(),
          "published": new Date().toISOString(),
          "cc": activity.cc,
          "to": activity.to,
          "inReplyTo": activity.inReplyTo,
          "attributedTo": activity.attributedTo,
          "attachment": activity.attachment,
          "avatar": activity.actor.icon.url,
          "raw": activity.object.toString(),
        }
      );
      if(note){
        const Accept = {
          "type": "Accept",
          "actor": ActorId,
          "object": activity,
        }
        return NextResponse.json(Accept, { status: 200 });
      }
      return NextResponse.json({ error: "Failed to create note" }, { status: 400 });
    }
    // Note以外の場合はわからない。
    return NextResponse.json({ error: "We Support Only Note" }, { status: 400 });
  }
  // いいねの場合
  if(activity.type === "Like"){
    if(activity.object.type === "Note"){
      const actorId = activity.object.attributedTo===activity.actor? activity.actor : activity.actor.id;
    const like = await adminDatabases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_LIKES_COLLECTION_ID!,
      ID.unique(),
      {
        "id": activity.id,
        "actor": actorId,
        "object": ObjectId,
      }
    )
    if(like){
      const Accept = {
        "type": "Accept",
        "actor": ActorId,
          "object": activity,
        }
        return NextResponse.json(Accept, { status: 200 });
      }
    }
    return NextResponse.json({ error: "Failed to create like" }, { status: 400 });
  }
  // Undoの場合
  if(activity.type === "Undo"){
    // フォロー解除の場合
    if(activity.object.type === "Follow"){
      const deleted = await deleteFollowInbox(activity.object.id, activity.object.object);
      if(deleted === activity.object.id){
        const Accept = {
          "type": "Accept",
          "actor": ActorId,
          "object": activity,
        }
        return NextResponse.json(Accept, { status: 200 });
      }
      return NextResponse.json({ error: "Failed to delete follow" }, { status: 400 });
    }
    // Like解除の場合
    if(activity.object.type === "Like"){
      const { documents : likeDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        [Query.equal("id", activity.id)]
      );
      if(likeDocuments.length === 0){
        return NextResponse.json({ error: "Like not found" }, { status: 404 });
      }
      if(likeDocuments.length > 1){
        return NextResponse.json({ error: "Multiple likes found" }, { status: 400 });
      }
      const like = likeDocuments[0];
      const deleted = await adminDatabases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        like.$id,
      )
      if(deleted){
        const Accept = {
          "type": "Accept",
          "actor": ActorId,
          "object": activity,
        }
        return NextResponse.json(Accept, { status: 200 });
      }
      return NextResponse.json({ error: "Failed to delete like" }, { status: 400 });
    }
    return NextResponse.json({ error: "We Support Only Undo activity of Like/Follow" }, { status: 400 });
  }
  if(activity.type === "Delete"){
    const { documents : noteDocuments } = await adminDatabases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      [Query.equal("activityId", activity.object.id)]
    );
    if(noteDocuments.length === 0){
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    if(noteDocuments.length > 1){
      return NextResponse.json({ error: "Multiple notes found" }, { status: 400 });
    }
    const note = noteDocuments[0];
    const deleted = await adminDatabases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      note.$id,
    )
    if(deleted){
      const Accept = {
        "type": "Accept",
        "actor": ActorId,
        "object": activity,
      }
      return NextResponse.json(Accept, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to delete note" }, { status: 400 });
  }
  return NextResponse.json({ error: "We Support Only Create/Delete/Like/Follow/Undo activity" }, { status: 400 });
}
  