/**
 * 新規登録のときに、ActivityPubのアクター（プロフィール）を作る。
 * 途中で失敗したら、作りかけのものを消して元に戻す（中途半端なアカウントが残ると、もう一度登録できなくなる）。
 *
 * サーバー専用。"use server" を付けないこと。
 * 以前は database.ts（"use server"）にあったので、外部から呼べる関数として公開されてしまっていた。
 */
import { generateKeyPairSync } from "crypto";
import { Permission, Role } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/serverConfig";
import { deletePrivateKey, savePrivateKey } from "@/lib/activitypub/privateKeyStore";
import { Actor } from "@/types/appwrite";

const env = () => ({
  db: process.env.APPWRITE_DATABASE_ID!,
  actors: process.env.APPWRITE_ACTORS_COLLECTION_ID!,
  actorsSub: process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
  domain: process.env.NEXT_PUBLIC_DOMAIN!,
});

export async function createActorForUser(userId: string, preferredUsername: string, displayName: string): Promise<Actor> {
  const { databases } = await createAdminClient();
  const { db, actors, actorsSub, domain } = env();
  const actorId = `${domain}/users/${userId}`;

  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  // 秘密鍵は専用コレクションに保存（actorsコレクションには置かない）
  await savePrivateKey(userId, privateKey);
  const actor = (await databases.createDocument(
    db,
    actors,
    userId,
    {
      userId,
      preferredUsername,
      displayName,
      actorId,
      inbox: `${actorId}/inbox`,
      outbox: `${actorId}/outbox`,
      publicKey,
      following: `${actorId}/following`,
      followers: `${actorId}/followers`,
      avatarUrl: "",
      bio: "",
    },
    [Permission.read(Role.users()), Permission.write(Role.user(userId)), Permission.delete(Role.user(userId))]
  )) as unknown as Actor;
  await databases.createDocument(db, actorsSub, userId, { id: actorId, followersCount: 0, followingCount: 0 });
  return actor;
}

/** 登録の途中で失敗したときの後片付け。どれかが失敗しても残りは続ける */
export async function rollbackRegistration(userId: string) {
  const { databases, users } = await createAdminClient();
  const { db, actors, actorsSub } = env();
  const steps: [string, () => Promise<unknown>][] = [
    ["actorsSub", () => databases.deleteDocument(db, actorsSub, userId)],
    ["actor", () => databases.deleteDocument(db, actors, userId)],
    ["privateKey", () => deletePrivateKey(userId)],
    ["user", () => users.delete(userId)],
  ];
  for (const [name, step] of steps) {
    await step().catch((error: any) => {
      // まだ作られていなかったもの（404）は気にしない
      if (error?.code !== 404) console.error(`登録の後片付けに失敗 (${name}):`, error?.message);
    });
  }
}
