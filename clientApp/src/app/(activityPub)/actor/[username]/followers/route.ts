import {NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  const username = params.username;
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

  // TODO: フォロワー一覧を取得する実装を追加するよ！✨
  return NextResponse.json({
    "@context": "https://www.w3.org/ns/activitystreams",
    "id": `${actorId}/followers`,
    "type": "OrderedCollection",
    "totalItems": 0,
    "first": {
      "type": "OrderedCollectionPage",
      "id": `https://${process.env.NEXT_PUBLIC_DOMAIN}/actor/${username}/followers?page=1`,
      "partOf": `https://${process.env.NEXT_PUBLIC_DOMAIN}/actor/${username}/followers`,
      "orderedItems": [],
      "next": null
    }
  }, {
    headers: {
      'Content-Type': 'application/activity+json'
    }
  });
} 