import { getActorByUserId } from "@/lib/appwrite/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { user: string } }) {
  const headers = request.headers;
  if(!headers.get("Accept")?.includes("application/activity+json") && !headers.get("Accept")?.includes('application/ld+json; profile="https://www.w3.org/ns/activitystreams"')) {
    return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_DOMAIN}/@${params.user}`, request.url));
  }
  const { user } = params;
  const actor = await getActorByUserId(user);
  if(!actor) return NextResponse.json({ error: "Actor not found" }, { status: 404 });

  const responseActivityPub = {
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "Person",
    "id": actor.actorId,
    "preferredUsername": actor.preferredUsername,
    "name": actor.displayName,
    "summary": actor.bio,
    "icon": {
      "type": "Image",
      "url": actor.avatarUrl,
    },
    "inbox": actor.inbox|| `${process.env.NEXT_PUBLIC_DOMAIN}/users/${user}/inbox`,
    "outbox": actor.outbox|| `${process.env.NEXT_PUBLIC_DOMAIN}/users/${user}/outbox`,
    "followers": actor.followers|| `${process.env.NEXT_PUBLIC_DOMAIN}/users/${user}/followers`,
    "following": actor.following|| `${process.env.NEXT_PUBLIC_DOMAIN}/users/${user}/following`,
    "publicKey": {
      "id": `${actor.actorId}#main-key`,
      "owner": actor.actorId,
      "publicKeyPem": actor.publicKey,
    },
    "image": {
      "type": "Image",
      "url": actor.backgroundUrl,
    },
  }
  return NextResponse.json(responseActivityPub);
}

export async function POST(request: NextRequest, { params }: { params: { user: string } }) {
  const headers = request.headers;
  if(!headers.get("Accept")?.includes("application/activity+json")) {
    return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_DOMAIN}/@${params.user}`, request.url));
  }
  // 処理はすべて/users/[user]/inbox/route.tsに移行しているので転送する
  const { user } = params;
  return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_DOMAIN}/users/${user}/inbox`, request.url));
}