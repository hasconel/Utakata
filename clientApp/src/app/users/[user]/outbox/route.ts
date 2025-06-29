import { NextRequest, NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { signRequest } from "@/lib/activitypub/crypto";
import { fetchActorInbox } from "@/lib/activitypub/utils";

export async function GET(request: NextRequest, { params }: { params: { user: string } }) {
  const header = request.headers;
  if(header.get("Accept") !== "application/activity+json"){
    return NextResponse.json({ error: "Accept header is required" }, { status: 400 });
  }
  const username = params.user;
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

export async function POST(request: NextRequest, { params }: { params: { user: string } }) {
  const requestBody = await request.json();

  if(requestBody.actor !== `${process.env.NEXT_PUBLIC_DOMAIN}/users/${params.user}`){
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
  const { documents: actorSubList } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
    [Query.equal("$id", Actor.$id)]
  );
  if(actorSubList.length === 0){
    return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  }
  const actorSub = actorSubList[0];

  if(requestBody.type === "Undo"){
    if(requestBody.object.type === "Follow"){
      const undoRequestBody = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type:"Undo",
        actor: requestBody.actor,
        object: requestBody.object,
      }
      const { documents: followList } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        [Query.equal("id", requestBody.object.id)]
      );
      if(followList.length === 0){
        return NextResponse.json({ error: "Follow not found" }, { status: 404 });
      }
            actorSub.followingCount = actorSub.followingCount - 1;
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        actorSub.$id,
        {
          followingCount: actorSub.followingCount,
        }
      );
      const deleteFollow = await databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        followList[0].$id
      );
      if(!deleteFollow){
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
  if(requestBody.type === "Follow"){
    const id = ID.unique();
    
    const activity = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: requestBody.type,
      id: `${process.env.NEXT_PUBLIC_DOMAIN}/users/${params.user}/outbox/${id}`,
      actor: requestBody.actor,
      object: requestBody.object,
    }
      await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      id,
      {
        id: activity.id,
        actor: requestBody.actor,
        object: requestBody.object,
      });
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
    const Follow = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      [Query.and([Query.equal("id", activity.id),Query.equal("actor", requestBody.actor),Query.equal("object", requestBody.object)])]
    );

    actorSub.followingCount = actorSub.followingCount + 1;
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
      actorSub.$id,
      {
        followingCount: actorSub.followingCount,
      }
    );
    if(Follow.documents.length === 0){
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        id,
        {
          id: activity.id,
          actor: requestBody.actor,
          object: requestBody.object,
        }
      );
      return NextResponse.json({ actor: requestBody.actor,id: activity.id }, { status: 200 });
    }
    return NextResponse.json({
      actor: activity.actor,
      id: activity.id,
     }, { status: 200 });
  }else{
    return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
  }
}