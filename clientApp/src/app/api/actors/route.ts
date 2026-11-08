/**
 * ユーザーをまとめて返す（このサーバーの人も、外のサーバーの人も）。
 * GET /api/actors?id=<actorのURL>&id=...   →  { actors: [...] }（見つからない人は入らない）
 * ミュート一覧や「いいねした人」で使う。外のサーバーの人はキャッシュから返すので速い。
 */
import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { resolveActors } from "@/lib/activitypub/clientNotes";

const MAX_IDS = 100;

export async function GET(request: NextRequest) {
  const { databases, account } = await createSessionClient(request);
  const user = await account.get().catch(() => null);
  // 外のサーバーへ取りに行くので、踏み台にされないようログインを必須にする
  if (!user) return NextResponse.json({ error: "ログインしてないよ！💦" }, { status: 401 });

  const ids = [...new Set(request.nextUrl.searchParams.getAll("id"))]
    .filter((id) => /^https?:\/\//.test(id))
    .slice(0, MAX_IDS);
  const actors = await resolveActors(ids, databases, user.$id);
  return NextResponse.json(
    { actors: ids.flatMap((id) => (actors.get(id) && !actors.get(id)._placeholder ? [actors.get(id)] : [])) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
