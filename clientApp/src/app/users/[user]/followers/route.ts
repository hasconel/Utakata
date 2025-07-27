import {NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";

export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const { user: username } = await params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const target = searchParams.get("target");
  const header = request.headers;
  if(header.get("Accept") !== "application/activity+json"){
    return NextResponse.json({ error: "Accept header is required" }, { status: 400 });
  }
  if (!username) {
    return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
  }
  const { databases } = await createSessionClient();
  const { documents: actorSubList } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
    [Query.equal("$id", username)]
  );
  const actorSub = actorSubList[0];
  if(target){
    //console.log("target",target);
    //console.log("username",`${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}`);
    const { documents: followersList } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      [Query.equal("object", `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}`), Query.equal("actor", target)]
    );
    if(followersList.length ===  0) return NextResponse.json({error: "Not Found"}, {status: 404});
    const followObject = followersList[0];
    const Response = {
      id: followObject.id,
      type: "Follow",
      actor: followObject.actor,
      object: followObject.object,
    }
    return NextResponse.json(Response, {
      headers: {
        'Content-Type': 'application/activity+json'
      }
    });
  }
  // TODO: フォロワー一覧を取得する実装を追加するよ！✨
  if(page){
    // ページが数字の場合はフォロワー一覧を取得
    if(page && !isNaN(Number(page))){
      const { documents: followers } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        [Query.equal("object", `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}`), Query.offset((Number(page) - 1) * 10), Query.limit(12)]
      );
      const Response = {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/followers?page=${page}`,
        type: "OrderedCollectionPage",
        totalItems: actorSub.followersCount,
        next: Number(page) < Math.ceil(actorSub.followersCount/12) ? `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/followers?page=${Number(page) + 1}` : null,
        prev: Number(page) > 1 ? `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/followers?page=${Number(page) - 1}` : null,
        partOf: `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/followers`,
        orderedItems: followers.map((follower: any) => follower.actor)        
      }
      //console.log("Response",Response)
      return NextResponse.json(Response
      , {
        headers: {
          'Content-Type': 'application/activity+json'
        }
      });
    }
  }
  return NextResponse.json({
    "@context": "https://www.w3.org/ns/activitystreams",
    "id": `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/followers`,
    "type": "OrderedCollection",
    "totalItems": actorSub.followersCount,
    "first": `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/followers?page=1`
  }, {
    headers: {
      'Content-Type': 'application/activity+json'
    }
  });
} 