/**
 * ActivityPubのユーティリティ関数！✨
 * Note生成、リプライ処理、inbox取得をキラキラサポート！💖
 */
import { ActivityPubNote, CreateActivity } from "@/types/activitypub/collections";
import {isInternalUrl, convertToExternalUrl} from "@/lib/utils"
import { textToHtml } from "@/lib/activitypub/localNote";

/**
 * NoteとCreateアクティビティを生成！📝
 * ActivityPub仕様（https://www.w3.org/TR/activitypub/）に基づくよ！🚀
 * @param actorId 投稿者のID（例：https://domain/users/username）
 * @param content 投稿内容
 * @param visibility 公開範囲（public/followers）
 * @param followers フォロワーのIDリスト
 * @param inReplyTo リプライ先の投稿ID（任意）
 * @param attributedTo 宛先のID（任意）
 * @returns NoteとCreateアクティビティ
 */
export async function createNote(
  noteId: string,
  actorId: string,
  content: string,
  visibility: "public" | "followers",
  inReplyTo?: string,
  attributedTo?: string
): Promise<{ note: ActivityPubNote; activity: CreateActivity }> {
  // 投稿IDを箱数から生成
  const id = `${process.env.NEXT_PUBLIC_DOMAIN}/posts/${noteId}`;
  const followers = actorId + "/followers";
  const published = new Date().toISOString();
  // attributedToが存在する場合、宛先にリプライ先の投稿者を設定
  const to: string[] = [];
  if(attributedTo){
    to.push(attributedTo);
  }
  if(visibility === "public"){
    to.push("https://www.w3.org/ns/activitystreams#Public");
  }else{
    to.push(followers);
  }
  // 公開範囲を設定（publicならfollowers、followersなら空欄）
  const cc = visibility === "public" ? [followers] : [];

  // Noteオブジェクト（投稿本体）
  const note: ActivityPubNote = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id,
    type: "Note",
    published,
    attributedTo: actorId,
    // 保存するのはプレーンテキスト、配信するのはHTML
    content: textToHtml(content),
    to,
    cc,
    ...(inReplyTo && { inReplyTo }),
  };

  // Createアクティビティ（投稿イベント）
  const activity: CreateActivity = {
    "@context": "https://www.w3.org/ns/activitystreams",
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
export function getActorDisplayPreferredUsername(actor: any) {
  //console.log( "actor", actor)
  if(isInternalUrl(actor.id)) {
    return actor.preferredUsername;
  }
  const url = new URL(actor.id);
  return `${actor.preferredUsername}@${url.hostname}`;
}