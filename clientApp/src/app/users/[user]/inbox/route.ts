import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/serverConfig";
import { verifySignature } from "@/lib/activitypub/crypto";
import { Permission, Role } from "node-appwrite";

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
  //console.log("activity",activity)
  if(header.get("Content-Type") !== "application/activity+json"){
    return NextResponse.json({ error: "Content-Type header is required" }, { status: 400 });
  }
  if (!username) {
    return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
  }
  // actorがオブジェクト化されている場合はidを取得、そうでない場合はIdだろうということでそのまま
  const ActorId = activity.actor.id? activity.actor.id : activity.actor;
  //console.log(ActorId);
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
    // 先に通知を作ってしまう
    const notification = await adminDatabases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
      ID.unique(),
      {
        "id": activity.id,
        "type": "Follow",
        "from": ActorId,
        "to": process.env.NEXT_PUBLIC_DOMAIN+"/users/"+username,
        "target": ObjectId,
        "read": false
      },[
        Permission.read(Role.user(username)),
        Permission.update(Role.user(username)),
      ]);
    if(!notification){
      return NextResponse.json({ error: "Failed to create notification" }, { status: 400 });
    }
    const follow = await adminDatabases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      ID.unique(),
      {
        "id": activity.id,
        "actor": ActorId,
        "object": ObjectId
      }
    )
    if(follow){
      const { documents : actorSub } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        [Query.equal("id", ObjectId)]
      );
      if(actorSub.length === 1){
        await adminDatabases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
          actorSub[0].$id,
          {
            "followersCount": actorSub[0].followersCount + 1
          }
        );
      }
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
      // 先に通知を作ってしまう
      if(activity.object.inReplyTo && activity.object.to.includes(process.env.NEXT_PUBLIC_DOMAIN! + "/users/" + username)){
        const notification = await adminDatabases.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
          ID.unique(),
          {
            "id": activity.id,
            "type": "Reply",
            "from": ActorId,
            "to": process.env.NEXT_PUBLIC_DOMAIN+"/users/"+username,
            "target": NoteId,
            "read": false
          },[
            Permission.read(Role.user(username)),
            Permission.update(Role.user(username)),
          ]);
        if(!notification){
          return NextResponse.json({ error: "Failed to create notification" }, { status: 400 });
        }
      }
      // 自分のドメインの場合はAcceptを返す
      if(NoteId.startsWith(process.env.NEXT_PUBLIC_DOMAIN!)){
        console.log("NoteIdを受信しました", NoteId);
        const Accept = {
          "type": "Accept",
          "actor": ActorId,
          "object": activity,
        }
        return NextResponse.json(Accept, { status: 200 });
      }
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
      const attachmentArray :string[] = [];
      activity.object.attachment.map((attachment: any) => attachmentArray.push(attachment.url));
      const note = await adminDatabases.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_COLLECTION_ID!,
        ID.unique(),
        {
          "activityId": NoteId,
          "username":  ActorId,
          "content": activity.object.content,
          "createdAt": activity.object.published,
          "published": activity.object.published,
          "cc": activity.object.cc,
          "to": activity.object.to,
          "inReplyTo": activity.object.inReplyTo,
          "attributedTo": activity.object.attributedTo,
          "attachment": attachmentArray,
          "avatar": activity.actor.icon.url? activity.actor.icon.url : "",
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
    // 先に通知を作ってしまう
    const notification = await adminDatabases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
      ID.unique(),
      {
        "id": activity.id,
        "type": "Like",
        "from": ActorId,
        "to": process.env.NEXT_PUBLIC_DOMAIN+"/users/"+username,
        "target": ObjectId,
        "read": false
      },[
        Permission.read(Role.user(username)),
        Permission.update(Role.user(username)),
      ]);
    if(!notification){
      return NextResponse.json({ error: "Failed to create notification" }, { status: 400 });
    }
    // いいねのオブジェクトがstringの場合
    if(typeof activity.object === "string"){
      const { documents : likeDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        [Query.equal("id", activity.id)]
      );
      if(likeDocuments.length > 0){
        return NextResponse.json({ 
          "type": "Accept",
          "actor": ActorId,
          "object": activity,
        }, { status: 200 });
      }
      // いいねを作成
      const newLike = await adminDatabases.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        ID.unique(),
        {
          "id": activity.id,
          "actor": ActorId,
          "object": ObjectId,
        }
      )
      if(newLike){
        const Accept = {
          "type": "Accept",
          "actor": ActorId,
          "object": activity,
        }
        return NextResponse.json(Accept, { status: 200 });
      }
      return NextResponse.json({ error: "Failed to create like" }, { status: 400 });
    }
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
      const { documents : notificationDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
        [Query.equal("id", activity.object.id)]
      );
      if(notificationDocuments.length > 0){
        await adminDatabases.deleteDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
          notificationDocuments[0].$id
        );
      }
      const { documents : followDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        [Query.equal("id", activity.object.id)]
      );
      if(followDocuments.length === 0){
        return NextResponse.json({ error: "Follow not found" }, { status: 404 });
      }
      if(followDocuments.length > 1){
        return NextResponse.json({ error: "Multiple follows found" }, { status: 400 });
      }
      const follow = followDocuments[0];
      const deleted = await adminDatabases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        follow.$id
      );
      if(deleted){
        const { documents : actorSub } = await adminDatabases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
          [Query.equal("id", follow.object)]
        );
        if(actorSub.length === 1){
          await adminDatabases.updateDocument(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
            actorSub[0].$id,
            {
              "followersCount": actorSub[0].followersCount - 1
            }
          );
        }
        //
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
        [Query.equal("id", activity.object.id)]
      );
      const { documents : notificationDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
        [Query.equal("id", activity.object.id)]
      );
      if(notificationDocuments.length > 0){
        await adminDatabases.deleteDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
          notificationDocuments[0].$id
        );
      }
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
  