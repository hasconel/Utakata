/**
 * 自分のサーバーのユーザーを ActivityPub の Person として表す。
 * /users/[user] の GET と、プロフィール更新時の Update で同じものを使う。
 */
import { ActivityPubActor } from "@/types/activitypub";

export function toPersonObject(actor: ActivityPubActor, userId: string) {
  const base = `${process.env.NEXT_PUBLIC_DOMAIN}/users/${userId}`;
  const iconUrl = actor.icon?.url;
  const imageUrl = actor.image?.url;
  return {
    "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
    type: "Person",
    id: actor.id,
    preferredUsername: actor.preferredUsername,
    url: `${process.env.NEXT_PUBLIC_DOMAIN}/@${actor.preferredUsername}`,
    name: actor.displayName,
    summary: actor.summary,
    // 画像が無いときは項目ごと省く（Update で送ったとき、相手側でも外れるように）
    ...(iconUrl ? { icon: { type: "Image", url: iconUrl } } : {}),
    ...(imageUrl ? { image: { type: "Image", url: imageUrl } } : {}),
    inbox: actor.inbox || `${base}/inbox`,
    outbox: actor.outbox || `${base}/outbox`,
    followers: actor.followers || `${base}/followers`,
    following: actor.following || `${base}/following`,
    publicKey: actor.publicKey,
    discoverable: true,
  };
}
