import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getActorByPreferredUsername } from "../../../../lib/appwrite/database";

export async function GET(request: NextRequest) {
    // リクエストヘッダーはacct:user@hostの形式
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const acct = resource?.split(":").slice(1).join(":");
    const host = acct?.split("@")[1];
    // ドメインが一致しない場合は404を返す
    const headersList = await headers();
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const baseUrl = `${protocol}://${host}`;
    // process.env.NEXT_PUBLIC_DOMAINは開発環境だけポート指定しているので削除
    const domain = process.env.NEXT_PUBLIC_DOMAIN?.replace(/:\d+$/, "");
    if(baseUrl !== domain) return;
    const actor = await getActorByPreferredUsername(acct?.split("@")[0] || "");
    if(!actor) return;
    const user = acct?.split("@")[0];

    if (!resource) {
        return NextResponse.json({ error: "Resource parameter is required" }, { status: 400 });
    }
  return NextResponse.json({
    "subject": resource,
    "links": [
      {
        "rel": "http://webfinger.net/rel/profile-page",
        "type": "text/html",
        "href": `${process.env.NEXT_PUBLIC_DOMAIN}/@${user}`
      },
      {
        "rel": "self",
        "type": "application/activity+json",
        "href": `${actor.actorId}`
      }
    ]
  },{headers: {
    'Content-Type': 'application/jrd+json; charset=utf-8',
  }});
}