/**
 * プロフィールを変えたことを、フォロワーのサーバーへ Update で知らせる。
 * 受け取った側（Mastodon / Misskey など）は、これで表示名・アイコン・ヘッダーを更新する。
 */
import { getActorByUserId } from "@/lib/appwrite/database";
import { getEncryptedPrivateKey } from "@/lib/activitypub/privateKeyStore";
import { deliverActivity } from "@/lib/activitypub/post";
import { toPersonObject } from "@/lib/activitypub/person";

const PUBLIC = "https://www.w3.org/ns/activitystreams#Public";

/** 配信の準備（DB の読み出し）だけ先に済ませ、配信そのものは返した関数で行う */
export async function prepareProfileUpdate(userId: string): Promise<(() => Promise<void>) | null> {
  const actor = await getActorByUserId(userId);
  if (!actor?.id) return null;
  const privateKey = await getEncryptedPrivateKey(userId);
  const person = toPersonObject(actor, userId);
  const activity = {
    "@context": person["@context"],
    id: `${actor.id}#updates/${Date.now()}`,
    type: "Update",
    actor: actor.id,
    to: [PUBLIC],
    cc: [person.followers],
    published: new Date().toISOString(),
    object: person,
  };
  return () => deliverActivity(activity, { id: actor.id, privateKey, followers: person.followers });
}
