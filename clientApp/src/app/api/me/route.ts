/**
 * ログイン中の自分の情報を、1回でまとめて返す。
 *   { user, unread（未読の通知の数）, backgroundUrl（背景にする画像） }
 * 以前は、ログインの確認・未読の数・背景画像を別々のサーバーアクションで聞いていた。
 * サーバーアクションは1つずつ順番に処理されるので、そのぶん画面が出るのが遅かった。
 */
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { getCurrentUser } from "@/lib/appwrite/auth";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { postWindowStart } from "@/lib/activitypub/clientNotes";

const noStore = { "Cache-Control": "private, no-store" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, unread: 0, backgroundUrl: "" }, { headers: noStore });

  const { databases } = await createSessionClient();
  const db = process.env.APPWRITE_DATABASE_ID!;
  const [unread, actor] = await Promise.all([
    databases
      .listDocuments(db, process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!, [
        Query.equal("read", false),
        Query.equal("to", `${process.env.NEXT_PUBLIC_DOMAIN}/users/${user.$id}`),
        Query.greaterThan("$createdAt", postWindowStart()),
        Query.limit(1),
      ])
      .then((r: any) => r.total as number)
      .catch(() => 0),
    databases.getDocument(db, process.env.APPWRITE_ACTORS_COLLECTION_ID!, user.$id).catch(() => null),
  ]);
  return NextResponse.json({ user, unread, backgroundUrl: (actor as any)?.backgroundUrl || "" }, { headers: noStore });
}
