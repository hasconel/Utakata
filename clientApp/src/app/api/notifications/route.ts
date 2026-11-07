/**
 * 通知のAPI！✨
 * GET  /api/notifications            通知を、相手のユーザーと対象の投稿つきで返すよ。{ notifications }
 * POST /api/notifications  { ids }   指定した通知をまとめて既読にするよ。
 * （以前は通知1件ごとに相手と投稿を取りに行っていたので遅かった）
 * 表示するのは直近84時間の通知だけ（意図的な仕様）。
 */
import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { postWindowStart, resolveActors, toClientNotes } from "@/lib/activitypub/clientNotes";

const MAX_NOTIFICATIONS = 50;

const dbId = () => process.env.APPWRITE_DATABASE_ID!;
const notificationsId = () => process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!;

async function currentUser(request: NextRequest) {
  const { databases, account } = await createSessionClient(request);
  const user = await account.get().catch(() => null);
  return { databases, user };
}

export async function GET(request: NextRequest) {
  try {
    const { databases, user } = await currentUser(request);
    if (!user) {
      return NextResponse.json({ error: "ログインしてないよ！💦" }, { status: 401 });
    }
    const { documents: notifications } = await databases.listDocuments(dbId(), notificationsId(), [
      Query.equal("to", `${process.env.NEXT_PUBLIC_DOMAIN}/users/${user.$id}`),
      Query.greaterThan("$createdAt", postWindowStart()),
      Query.orderDesc("$createdAt"),
      Query.limit(MAX_NOTIFICATIONS),
    ]);

    // 対象の投稿と相手のユーザーを、まとめて取得する
    const targetIds = [...new Set(notifications.map((n: any) => n.target).filter(Boolean))] as string[];
    const [posts, actors] = await Promise.all([
      targetIds.length > 0
        ? databases.listDocuments(dbId(), process.env.APPWRITE_POSTS_COLLECTION_ID!, [
            Query.equal("activityId", targetIds),
            Query.limit(targetIds.length),
          ]).then(({ documents }: any) => documents)
        : Promise.resolve([]),
      resolveActors(notifications.map((n: any) => n.from), databases, user.$id),
    ]);
    const notes = await toClientNotes(posts, databases, user.$id);
    const noteById = new Map(notes.map((note) => [note.id, note]));

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
        $id: n.$id,
        $createdAt: n.$createdAt,
        id: n.id,
        type: n.type,
        from: n.from,
        to: n.to,
        target: n.target,
        read: n.read,
        actor: actors.get(n.from) ?? null,
        post: (n.target && noteById.get(n.target)) ?? null,
      })),
    });
  } catch (error: any) {
    console.error("通知の取得に失敗:", error?.message);
    return NextResponse.json({ error: "通知の取得に失敗したよ！💦" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { databases, user } = await currentUser(request);
    if (!user) {
      return NextResponse.json({ error: "ログインしてないよ！💦" }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string").slice(0, MAX_NOTIFICATIONS) : [];
    // 通知は受信者本人しか更新できない権限なので、他人の通知は更新に失敗するだけ
    const results = await Promise.allSettled(
      ids.map((id: string) => databases.updateDocument(dbId(), notificationsId(), id, { read: true }))
    );
    return NextResponse.json({ updated: results.filter((r) => r.status === "fulfilled").length });
  } catch (error: any) {
    console.error("通知の既読化に失敗:", error?.message);
    return NextResponse.json({ error: "既読にできなかったよ！💦" }, { status: 500 });
  }
}
