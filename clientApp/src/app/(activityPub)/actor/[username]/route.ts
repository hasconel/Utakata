import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  const header = request.headers;
  if(header.get("Accept") !== "application/activity+json"){
    return NextResponse.json({ error: "Accept header is required" }, { status: 400 });
  }
  const username = params.username;
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
  const actorId = `https://${process.env.NEXT_PUBLIC_DOMAIN}/actor/${username}`;

  return NextResponse.json({
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    "id": actorId,
    "type": "Person",
    "preferredUsername": actor.preferredUsername,
    "name": actor.displayName || actor.preferredUsername,
    "summary": actor.bio || "",
    "inbox": `${actorId}/inbox`,
    "outbox": `${actorId}/outbox`,
    "followers": `${actorId}/followers`,
    "following": `${actorId}/following`,
    "url": actorId,
    "icon": {
      "type": "Image",
      "mediaType": "image/png",
      "url": actor.avatarUrl || ""
    },
    "image": {
      "type": "Image",
      "mediaType": "image/png",
      "url": actor.backgroundUrl || ""
    },
    "publicKey": {
      "id": `${actorId}#main-key`,
      "owner": actorId,
      "publicKeyPem": actor.publicKey
    }
  }, {
    headers: {
      'Content-Type': 'application/activity+json'
    }
  });
} 