/**
 * 保存済みの投稿を、画面で使う形（ActivityPubNoteInClient）にまとめて変換する。
 * 投稿者といいねは、投稿の件数に関係なくまとめて問い合わせる（1件ずつ問い合わせると遅い）。
 *
 * サーバー専用。"use server" を付けないこと（外部から呼べる関数として公開されてしまう）。
 */
import { Query } from "node-appwrite";
import { fetchRemoteActor } from "@/lib/activitypub/remoteActor";
import { isInternalUrl } from "@/lib/utils";
import { ActivityPubNoteInClient } from "@/types/activitypub";

/** Appwriteの1回の問い合わせで返せる件数と、Query.equal に渡す値の上限 */
const PAGE_LIMIT = 100;

const env = () => ({
  db: process.env.APPWRITE_DATABASE_ID!,
  actors: process.env.APPWRITE_ACTORS_COLLECTION_ID!,
  likes: process.env.APPWRITE_LIKES_COLLECTION_ID!,
});

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/** 条件に合うドキュメントを全件取得する（件数が多くても取りこぼさない） */
async function listAll(databases: any, collectionId: string, queries: string[]): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | null = null;
  for (;;) {
    const { documents }: { documents: any[] } = await databases.listDocuments(env().db, collectionId, [
      ...queries,
      Query.limit(PAGE_LIMIT),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ]);
    results.push(...documents);
    if (documents.length < PAGE_LIMIT) return results;
    cursor = documents[documents.length - 1].$id;
  }
}

function localActorToClient(doc: any) {
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Person",
    id: doc.actorId,
    preferredUsername: doc.preferredUsername,
    displayName: doc.displayName || doc.preferredUsername,
    followers: doc.actorId + "/followers",
    following: doc.actorId + "/following",
    inbox: doc.actorId + "/inbox",
    outbox: doc.actorId + "/outbox",
    publicKey: { id: doc.actorId + "#main-key", owner: doc.actorId, publicKeyPem: doc.publicKey },
    icon: { type: "Image", url: doc.avatarUrl || "" },
    image: { type: "Image", url: doc.backgroundUrl || "" },
  };
}

/**
 * actorのURLから、画面用のactorをまとめて取得する。
 * ローカルは1回の問い合わせで、外部は並列で取得する（外部はremoteActor側で10分キャッシュされる）。
 */
export async function resolveActors(
  actorIds: string[],
  databases: any,
  signerUserId?: string
): Promise<Map<string, any>> {
  const unique = [...new Set(actorIds.filter((id): id is string => typeof id === "string" && id !== ""))];
  const actors = new Map<string, any>();
  const local = unique.filter((id) => isInternalUrl(id));
  for (const ids of chunk(local, PAGE_LIMIT)) {
    const docs = await listAll(databases, env().actors, [Query.equal("actorId", ids)]);
    for (const doc of docs) actors.set(doc.actorId, localActorToClient(doc));
  }
  await Promise.all(
    unique
      .filter((id) => !actors.has(id) && !isInternalUrl(id))
      .map(async (id) => {
        const actor = await fetchRemoteActor(id, signerUserId);
        if (actor) actors.set(id, actor);
      })
  );
  return actors;
}

/** 投稿ごとのいいね数と、閲覧者がいいね済みかをまとめて数える */
async function countLikes(activityIds: string[], databases: any, viewerActorId: string) {
  const counts = new Map<string, { total: number; liked: boolean }>();
  for (const id of activityIds) counts.set(id, { total: 0, liked: false });
  for (const ids of chunk([...new Set(activityIds)], PAGE_LIMIT)) {
    const likes = await listAll(databases, env().likes, [Query.equal("object", ids)]);
    for (const like of likes) {
      const count = counts.get(like.object);
      if (!count) continue;
      count.total++;
      if (like.actor === viewerActorId) count.liked = true;
    }
  }
  return counts;
}

/**
 * 投稿を画面用の形にまとめて変換する。投稿者が見つからない投稿も、_user を null にして残す。
 * @param viewerUserId 閲覧者のユーザーID（いいね済みの判定、削除できるかの判定、外部取得の署名に使う）
 */
export async function toClientNotes(posts: any[], databases: any, viewerUserId: string): Promise<ActivityPubNoteInClient[]> {
  if (posts.length === 0) return [];
  const viewerActorId = `${process.env.NEXT_PUBLIC_DOMAIN}/users/${viewerUserId}`;
  const [actors, likes] = await Promise.all([
    resolveActors(posts.map((post) => post.attributedTo), databases, viewerUserId),
    countLikes(posts.map((post) => post.activityId).filter(Boolean), databases, viewerActorId),
  ]);
  return posts.map((post) => {
    const like = likes.get(post.activityId) ?? { total: 0, liked: false };
    return {
      "@context": ["https://www.w3.org/ns/activitystreams"],
      type: "Note",
      id: post.activityId,
      attributedTo: post.attributedTo,
      content: post.content,
      published: post.published || post.$createdAt,
      url: post.activityId,
      to: post.to ?? [],
      cc: post.cc ?? [],
      inReplyTo: post.inReplyTo ?? "",
      attachment: post.attachment ?? [],
      likes: {
        totalItems: like.total,
        first: post.activityId + "/likes?page=1",
        last: post.activityId + "/likes?page=" + Math.ceil(like.total / 20),
      },
      replies: {
        totalItems: 0,
        first: post.activityId + "/replies?page=1",
        last: post.activityId + "/replies?page=0",
      },
      _isLiked: like.liked,
      _user: actors.get(post.attributedTo) ?? null,
      _canDelete: post.attributedTo === viewerActorId,
    } as ActivityPubNoteInClient;
  });
}

/** 投稿と通知の表示期間（意図的に3.5日に限っている。古い投稿を掘り返されないようにするため） */
export const POST_WINDOW_HOURS = 84;

export function postWindowStart(): string {
  return new Date(Date.now() - POST_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
}
