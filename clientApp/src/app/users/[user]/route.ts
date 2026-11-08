import { wantsActivityJson } from "@/lib/activitypub/contentNegotiation";
import { getActorByUserId } from "@/lib/appwrite/database";
import { NextRequest, NextResponse } from "next/server";
import { toPersonObject } from "@/lib/activitypub/person";

export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  const headers = request.headers;
  if(!wantsActivityJson(headers.get("Accept"))) {
    return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_DOMAIN}/@${user}`, request.url));
  }
  const actor = await getActorByUserId(user);
  if(!actor) return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  const responseActivityPub = toPersonObject(actor, user);
  // MisskeyはこのContent-Type以外のactorを受け付けない
  return NextResponse.json(responseActivityPub, {
    headers: { "Content-Type": "application/activity+json" },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  const headers = request.headers;
  if(!headers.get("Accept")?.includes("application/activity+json")) {
    return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_DOMAIN}/@${user}`, request.url));
  }
  // 処理はすべて/users/[user]/inbox/route.tsに移行しているので転送する
  return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_DOMAIN}/users/${user}/inbox`, request.url));
}