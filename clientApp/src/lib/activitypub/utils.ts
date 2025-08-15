/**
 * ActivityPubのユーティリティ関数！✨
 * Note生成、リプライ処理、inbox取得をキラキラサポート！💖
 */
import { ACTIVITYSTREAMS_CONTEXT, PUBLIC, DOMAIN } from "./constants";
import { ActivityPubNote, CreateActivity } from "@/types/activitypub/collections";
import {isInternalUrl, convertToExternalUrl} from "@/lib/utils"

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
  const to = [];
  if(attributedTo){
    to.push(attributedTo);
  }
  if(visibility === "public"){
    to.push(PUBLIC);
  }else{
    to.push(followers);
  }
  // 公開範囲を設定（publicならfollowers、followersなら空欄）
  const cc = visibility === "public" ? [followers] : [];

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
 * 
 * @param followers : フォロワーのIDリスト（例：https://domain/users/username/followers）
 * @returns actorId[]
 */
export async function getFollowers(followersUrl: string) {
  const followers: string[] = [];
    const followersList = await fetch(convertToExternalUrl(followersUrl), {
      headers: { Accept: 'application/activity+json' },
    }).then(res => res.json());
    if(followersList.type === 'OrderedCollection') {
      let followersPage = await fetch(followersList.first,{
        headers: { Accept: 'application/activity+json' },
      }).then(res => res.json());
      followersPage.orderedItems.map((item: string) => followers.push(item));
      while(followersPage.next) {
        const next = await fetch(followersPage.next,{
          headers: { Accept: 'application/activity+json' },
        }).then(res => res.json());
        next.orderedItems.map((item: string) => followers.push(item));
        followersPage = next;
      }
    }
  return followers;
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
    const actor = await fetch(`api/actor?url=${encodeURIComponent(actorId)}`, {
      headers: { Accept: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"' },
    }).then(res => res.json());
    return actor.inbox;
  } catch {
    return null;
  }
}

export function getActorDisplayPreferredUsername(actor: any) {
  //console.log( "actor", actor)
  if(isInternalUrl(actor.id)) {
    return actor.preferredUsername;
  }
  const url = new URL(actor.id);
  return `${actor.preferredUsername}@${url.hostname}`;
}