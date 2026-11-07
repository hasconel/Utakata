import { wantsActivityJson } from "@/lib/activitypub/contentNegotiation";
import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { isPublicPost, postToCreate } from "@/lib/activitypub/localNote";
import { postWindowStart } from "@/lib/activitypub/clientNotes";

const PAGE_SIZE = 20;
const ACTIVITY_HEADERS = { "Content-Type": "application/activity+json" };

/**
 * ログインしていない状態のクライアント。
 * 外部に返すのは公開投稿だけなので、権限で読めるものをAppwrite側で絞る。
 * セッションを使うと、閲覧者がログインしていた場合にフォロワー限定の投稿まで出てしまう。
 */
function guestDatabases(): Databases {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!);
  return new Databases(client);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  if(!wantsActivityJson(request.headers.get("Accept"))){
    return NextResponse.json({ error: "Accept header is required" }, { status: 400 });
  }
  const databases = guestDatabases();
  // URLのユーザー部分はactorsのドキュメントID（ユーザーID）
  const actor = await databases.getDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    user
  ).catch(() => null);
  if (!actor) {
    return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  }
  const actorId: string = actor.actorId;
  const outboxId = `${actorId}/outbox`;
  // 外部にも直近84時間の投稿だけを見せる（古い投稿を掘り返されないようにする、意図的な仕様）
  const byAuthor = [Query.equal("attributedTo", actorId), Query.greaterThan("$createdAt", postWindowStart())];

  try {
    const searchParams = request.nextUrl.searchParams;
    if (!searchParams.has("page")) {
      const { total } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_COLLECTION_ID!,
        [...byAuthor, Query.limit(1)]
      );
      return NextResponse.json({
        "@context": "https://www.w3.org/ns/activitystreams",
        id: outboxId,
        type: "OrderedCollection",
        totalItems: total,
        first: `${outboxId}?page=true`,
      }, { headers: ACTIVITY_HEADERS });
    }

    const maxId = searchParams.get("max_id");
    if (maxId !== null && !/^[A-Za-z0-9_-]{1,36}$/.test(maxId)) {
      return NextResponse.json({ error: "Invalid max_id" }, { status: 400 });
    }
    const { documents } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      [
        ...byAuthor,
        Query.orderDesc("$createdAt"),
        Query.limit(PAGE_SIZE),
        ...(maxId ? [Query.cursorAfter(maxId)] : []),
      ]
    );
    const last = documents[documents.length - 1];
    return NextResponse.json({
      "@context": "https://www.w3.org/ns/activitystreams",
      id: maxId ? `${outboxId}?page=true&max_id=${maxId}` : `${outboxId}?page=true`,
      type: "OrderedCollectionPage",
      partOf: outboxId,
      // 権限で絞れているはずだが、公開範囲の設定ミスに備えてここでも確かめる
      orderedItems: documents.filter(isPublicPost).map(postToCreate),
      ...(documents.length === PAGE_SIZE ? { next: `${outboxId}?page=true&max_id=${last.$id}` } : {}),
    }, { headers: ACTIVITY_HEADERS });
  } catch (err: any) {
    // 存在しない投稿をmax_idに指定された場合
    if (err?.code === 400) {
      return NextResponse.json({ error: "Invalid max_id" }, { status: 400 });
    }
    console.error("outboxの取得に失敗:", err?.message);
    return NextResponse.json({ error: "Failed to fetch outbox" }, { status: 500 });
  }
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
  // Undoの場合
  // フォローの場合
    return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
  
}