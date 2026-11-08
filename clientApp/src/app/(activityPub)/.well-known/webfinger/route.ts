import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/appwrite/serverConfig";
import { Actor } from "../../../../types/appwrite";
import { Query } from "node-appwrite";

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(request: NextRequest) {
  const resource = request.nextUrl.searchParams.get("resource");
  if (!resource) {
    return NextResponse.json({ error: "Resource parameter is required" }, { status: 400 });
  }
  // resourceはacct:user@hostの形式。それ以外とこのサーバー以外のユーザーは扱わない
  const acct = resource.match(/^acct:([^@]+)@(.+)$/);
  if (!acct) return notFound();
  const [, user, host] = acct;
  // ホスト名だけで比べる（NEXT_PUBLIC_DOMAINは開発環境だけポート指定がある）
  if (host.toLowerCase() !== new URL(process.env.NEXT_PUBLIC_DOMAIN!).hostname) return notFound();
  try {
    // 外のサーバー（ログインなし）から呼ばれる。actors はゲストでは読めないので管理者で読む（返すのはactorのURLだけ）
    const { databases } = await createAdminClient();
    const { documents: [actorData] }: { documents: Actor[] } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      [Query.equal("preferredUsername", user)]
    );
    if (!actorData) return notFound();
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
          "href": `${actorData.actorId}`
        }
      ]
    }, { headers: {
      'Content-Type': 'application/jrd+json; charset=utf-8',
    }});
  } catch (err: any) {
    console.error("WebFingerの取得に失敗:", err?.message);
    return NextResponse.json({ error: "Failed to fetch actor" }, { status: 500 });
  }
}
