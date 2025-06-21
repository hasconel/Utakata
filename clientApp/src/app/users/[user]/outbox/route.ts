import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";

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
      "id": `https://${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/outbox?page=1`,
      "partOf": `https://${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/outbox`,
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

  //const actor = documents[0];
  //    const activity = await request.json();
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode());
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  const digest = "SHA-256=" + hashHex;
  fetch(`https://${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/inbox`, {
    method: "POST",
    headers: {
      "Accept": "application/activity+json",
      "(request-target)": "post",
      "host": process.env.NEXT_PUBLIC_DOMAIN!,
      "date": new Date().toISOString(),
      "digest": "SHA-256=" + digest,
      "content-type": "application/activity+json"
    },
    body: request.body
  });
  // TODO: アクティビティを保存して、フォロワーに配信する実装を追加するよ！✨
  return NextResponse.json({ success: true });
}