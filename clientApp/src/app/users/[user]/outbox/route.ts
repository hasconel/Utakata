import { NextRequest, NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { signRequest } from "@/lib/activitypub/crypto";
import { fetchActorInbox } from "@/lib/activitypub/utils";
import { createFollowOutbox, deleteFollowOutbox } from "@/lib/api/follow";

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

  // TODO: 送信したアクティビティ一覧を取得する実装を追加するよ！✨
  return NextResponse.json({
    "@context": "https://www.w3.org/ns/activitystreams",
    "id": `${actorId}/outbox`,
    "type": "OrderedCollection",
    "totalItems": 0,
    "first": {
      "type": "OrderedCollectionPage",
      "id": `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/outbox?page=1`,
      "partOf": `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/outbox`,
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
  const { user } = await params;
  const requestBody = await request.json();

  if(requestBody.actor !== `${process.env.NEXT_PUBLIC_DOMAIN}/users/${user}`){
    return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  }
  const { databases ,account} = await createSessionClient();
  const actorId =( await account.get()).$id;
  if(actorId !== requestBody.actor.split("/").pop() ){
    return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  }
  const { documents : ActorList} = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    [Query.equal("actorId", requestBody.actor)]
  );
  if(ActorList.length === 0){
    return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  }
  const Actor = ActorList[0];
  // Undoの場合
  if(requestBody.type === "Undo"){
    // フォロー解除の場合
    if(requestBody.object.type === "Follow"){
      const undoRequestBody = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type:"Undo",
        actor: requestBody.actor,
        object: requestBody.object,
      }
      const deleted = await deleteFollowOutbox(requestBody.object.id);
      if(deleted !== requestBody.object.id){
        return NextResponse.json({ error: "Failed to delete follow" }, { status: 500 });
      }
      const inbox = await fetchActorInbox(requestBody.object.object);
      if(!inbox){
        return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
      }
      const { headers } = await signRequest(inbox, requestBody, Actor.privateKey, `${requestBody.actor}#main-key`);
      const response = await fetch(inbox, {
        method: "POST",
        headers,
        body: JSON.stringify(undoRequestBody),
      });
      if(!response.ok){
        return NextResponse.json({ error: "Failed to send activity" }, { status: 500 });
      }

      return NextResponse.json({
        type: "Accept",
        actor: requestBody.actor,
        object: undoRequestBody,  
      }, { status: 200 });
    }
  }
  // フォローの場合
  if(requestBody.type === "Follow"){
    const id = ID.unique();
    
    const activity = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: requestBody.type,
      id: `${process.env.NEXT_PUBLIC_DOMAIN}/users/${user}/outbox/${id}`,
      actor: requestBody.actor,
      object: requestBody.object,
    }
    const follow = await createFollowOutbox(activity.id, requestBody.actor, requestBody.object);
    if(follow !== activity.id){
      return NextResponse.json({ error: "Failed to create follow" }, { status: 500 });
    }
    const inbox = await fetchActorInbox(requestBody.object);
    if(!inbox){
      return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
    }
    const { headers } = await signRequest(inbox, activity, Actor.privateKey, `${requestBody.actor}#main-key`);
    const response = await fetch(inbox, {
      method: "POST",
      headers,
      body: JSON.stringify(activity),
    });
    if(!response.ok){
      return NextResponse.json({ error: "Failed to send activity" }, { status: 500 });
    }
    return NextResponse.json({
      actor: activity.actor,
      id: activity.id,
     }, { status: 200 });
  }else{
    return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
  }
}