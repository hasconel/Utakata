/**
 * 外部ユーザーの投稿一覧（outbox）を取得するAPI。
 * GET /api/remote-outbox?actor=<actorのURL>[&page=<前回のnext>]
 * 返す形は /api/posts と同じ { notes, next }。保存はしない（表示用）。
 */
import { NextRequest, NextResponse } from "next/server";
import { BlockedUrlError } from "@/lib/security/safeFetch";
import { fetchActivityDocument, fetchRemoteActor } from "@/lib/activitypub/remoteActor";
import { buildAttachments, buildContent, isPublicNote, toArray } from "@/lib/activitypub/remoteNote";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { isInternalUrl } from "@/lib/utils";
import { ActivityPubNoteInClient } from "@/types/activitypub";

/** 1ページで処理する件数の上限（相手が大きなページを返しても負荷を抑える） */
const MAX_ITEMS = 40;

class UpstreamError extends Error {
  constructor(public status: number) {
    super(`upstream status ${status}`);
  }
}

function originOf(url: unknown): string | null {
  try {
    return typeof url === "string" ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

function idOf(value: any): string | undefined {
  return typeof value === "string" ? value : typeof value?.id === "string" ? value.id : undefined;
}

async function fetchJson(url: string, signer: string): Promise<any> {
  const response = await fetchActivityDocument(url, { signer, timeoutMs: 5_000 });
  if (!response.ok) throw new UpstreamError(response.status);
  return JSON.parse(response.body.toString("utf-8"));
}

/** Create(Note) を画面用の形にする。表示できないものは null。 */
function toClientNote(item: any, actor: any): ActivityPubNoteInClient | null {
  if (item?.type !== "Create") return null;
  // 中身がURLだけのもの（取得し直しが必要）や、Note以外（Question など）は今は扱わない
  const note = item.object;
  if (typeof note !== "object" || note?.type !== "Note" || typeof note.id !== "string") return null;
  // 他人の投稿や別ドメインの投稿が混ざっていたら信用しない
  if (idOf(note.attributedTo) !== actor.id || originOf(note.id) !== originOf(actor.id)) return null;
  const to = toArray(note.to);
  const cc = toArray(note.cc);
  // 署名して取得すると、フォロワー限定の投稿が含まれることがあるので公開投稿だけにする
  if (!isPublicNote(to, cc)) return null;
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    type: "Note",
    id: note.id,
    attributedTo: actor.id,
    content: buildContent(note),
    published: typeof note.published === "string" ? note.published : "",
    url: typeof note.url === "string" ? note.url : note.id,
    to,
    cc,
    inReplyTo: idOf(note.inReplyTo) ?? "",
    attachment: buildAttachments(note.attachment),
    _isLiked: false,
    _user: actor,
    _canDelete: false,
  } as ActivityPubNoteInClient;
}

export async function GET(request: NextRequest) {
  // 誰でも使えると外部サーバーへの踏み台になるので、ログインを必須にする
  let userId: string;
  try {
    const { account } = await createSessionClient(request);
    userId = (await account.get()).$id;
  } catch {
    return NextResponse.json({ error: "ログインが必要だよ！💦" }, { status: 401 });
  }

  const actorId = request.nextUrl.searchParams.get("actor");
  const page = request.nextUrl.searchParams.get("page");
  if (!actorId || !originOf(actorId)) {
    return NextResponse.json({ error: "actorが必要だよ！💦" }, { status: 400 });
  }
  if (isInternalUrl(actorId)) {
    return NextResponse.json({ error: "このサーバーのユーザーは /api/posts を使ってね！💦" }, { status: 400 });
  }

  try {
    const actor = await fetchRemoteActor(actorId, userId);
    const outboxUrl = actor?.outbox;
    if (!actor || !originOf(outboxUrl)) {
      return NextResponse.json({ error: "outboxが見つからないよ！💦" }, { status: 404 });
    }
    // 続きのページは同じサーバーのものだけ取得する（任意のURLを取得させない）
    if (page && originOf(page) !== originOf(outboxUrl)) {
      return NextResponse.json({ error: "pageが正しくないよ！💦" }, { status: 400 });
    }

    let pageDoc = await fetchJson(page ?? outboxUrl, userId);
    // 最初はコレクション本体が返るので、最初のページを取得する
    if (!page && !pageDoc?.orderedItems && !pageDoc?.items) {
      const first = pageDoc?.first;
      if (typeof first === "string") {
        if (originOf(first) !== originOf(outboxUrl)) {
          return NextResponse.json({ notes: [], next: null });
        }
        pageDoc = await fetchJson(first, userId);
      } else {
        pageDoc = first ?? {};
      }
    }

    const items = pageDoc?.orderedItems ?? pageDoc?.items;
    const notes = (Array.isArray(items) ? items.slice(0, MAX_ITEMS) : [])
      .map((item: any) => toClientNote(item, actor))
      .filter((note): note is ActivityPubNoteInClient => note !== null);
    const next = idOf(pageDoc?.next);
    return NextResponse.json({
      notes,
      next: next && originOf(next) === originOf(outboxUrl) ? next : null,
    });
  } catch (err: any) {
    if (err instanceof BlockedUrlError) {
      return NextResponse.json({ error: "このURLは取得できないよ！💦" }, { status: 400 });
    }
    if (err instanceof UpstreamError) {
      return NextResponse.json({ error: "outboxの取得に失敗したよ！💦" }, { status: 502 });
    }
    console.error("外部outboxの取得に失敗:", err?.message);
    return NextResponse.json({ error: "outboxの取得に失敗したよ！💦" }, { status: 502 });
  }
}
