import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/serverConfig";

/**
 * ユーザー名からactorのURLへ転送する。
 * /@ユーザー名 にActivityPubのJSONを求めるリクエストが来たとき、ミドルウェアからここへ送られる。
 * ミドルウェアはEdgeで動き、データベースを読めないのでここで引く。
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const { databases } = await createAdminClient();
    const { documents } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      [Query.equal("preferredUsername", username), Query.limit(1)]
    );
    const actorId = documents[0]?.actorId;
    if (!actorId) {
      return NextResponse.json({ error: "Actor not found" }, { status: 404 });
    }
    return NextResponse.redirect(actorId, { status: 302, headers: { Vary: "Accept" } });
  } catch (err: any) {
    console.error("プロフィールからのactor取得に失敗:", err?.message);
    return NextResponse.json({ error: "Failed to fetch actor" }, { status: 500 });
  }
}
