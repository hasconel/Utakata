/**
 * ActivityPubのユーティリティ関数！✨
 * Note生成、リプライ処理、inbox取得をキラキラサポート！💖
 */
import { createSessionClient } from "../appwrite/serverConfig";
import { Query } from "node-appwrite";
import { ACTIVITYSTREAMS_CONTEXT, PUBLIC, DOMAIN } from "./constants";
import { ActivityPubNote, CreateActivity } from "@/types/activitypub/collections";
import {isInternalUrl} from "@/lib/utils"

/**
 * NoteとCreateアクティビティを生成！📝
 * ActivityPub仕様（https://www.w3.org/TR/activitypub/）に基づくよ！🚀
 * @param actorId 投稿者のID（例：https://domain/users/username）
 * @param content 投稿内容
 * @param visibility 公開範囲（public/followers）
 * @param followers フォロワーのIDリスト
 * @param inReplyTo リプライ先の投稿ID（任意）
 * @returns NoteとCreateアクティビティ
 */
export async function createNote(
  noteId: string,
  actorId: string,
  content: string,
  visibility: "public" | "followers",
  followers: string,
  inReplyTo?: string,
  attributedTo?: string
): Promise<{ note: ActivityPubNote; activity: CreateActivity }> {
  // 投稿IDを箱数から生成
  const id = `${DOMAIN}/posts/${noteId}`;
  const published = new Date().toISOString();
  // attributedToが存在する場合、宛先にリプライ先の投稿者を設定
  const to = attributedTo ? attributedTo : visibility === "public" ? PUBLIC : followers;
  // 公開範囲を設定（publicならPublic、followersならフォロワーリスト）
  const cc = visibility === "public" ? followers : "";

  // Noteオブジェクト（投稿本体）
  const note: ActivityPubNote = {
    "@context": ACTIVITYSTREAMS_CONTEXT,
    id,
    type: "Note",
    published,
    attributedTo: actorId,
    content,
    to,
    cc,
    ...(inReplyTo && { inReplyTo }),
  };

  // Createアクティビティ（投稿イベント）
  const activity: CreateActivity = {
    "@context": ACTIVITYSTREAMS_CONTEXT,
    id: `${id}#create`,
    type: "Create",
    actor: actorId,
    published,
    to,
    cc,
    object: note,
  };

  return { note, activity };
}

/**
 * リプライの親投稿のreplyCountを更新！🔄
 * @param inReplyTo リプライ先の投稿ID
 * @returns 親投稿者のID（存在しない場合はnull）
 */
export async function updateReplyCount(inReplyTo: string) {
    const {databases} =await createSessionClient();

  // 親投稿を検索（activityIdでインデックス使用）
  const { documents } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, [
    Query.equal("activityId", inReplyTo),
  ]);
  const parentPost = documents[0];

  if (parentPost) {
    // replyCountをインクリメント
    await databases.updateDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, parentPost.$id, {
      replyCount: (parentPost.replyCount || 0) + 1,
    });
    return parentPost.attributedTo || parentPost.actorId;
  }

  return null;
}

/**
 * リモートアクターのinboxを取得！📬
 * @param actorId アクターのID（例：https://example.com/actor）
 * @returns inbox URL（取得失敗時はnull）
 */
export async function fetchActorInbox(actorId: string): Promise<string | null> {
  try {
    if(isInternalUrl(actorId)) {
      return `${actorId}/inbox`;
    }
    const actor = await fetch(actorId, {
      headers: { Accept: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"' },
    }).then(res => res.json());
    return actor.inbox || null;
  } catch {
    return null;
  }
}