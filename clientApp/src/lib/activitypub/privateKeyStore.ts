/**
 * ActivityPub署名用の秘密鍵の保管。
 * 秘密鍵はAPIキーでしか読めない専用コレクションに置く。
 *
 * このファイルに "use server" を付けないこと。付けると、ここの関数がすべて
 * Server Action（外部から呼べるエンドポイント）として公開される可能性がある。
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/appwrite/serverConfig";

const IV_LENGTH = 16;

function encryptionKey(): Buffer {
  return Buffer.from(process.env.APPWRITE_ENCRYPTION_KEY!, "hex");
}

/** AES-256-GCMで暗号化する */
export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/** AES-256-GCMで復号する */
export function decrypt(text: string): string {
  const [iv, encrypted, authTag] = text.split(":");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
}

function keysCollectionId(): string {
  const id = process.env.APPWRITE_ACTOR_KEYS_COLLECTION_ID;
  if (!id) {
    throw new Error("APPWRITE_ACTOR_KEYS_COLLECTION_ID is not set");
  }
  return id;
}

/** 秘密鍵を暗号化して保存する。ドキュメントのIDはユーザーIDと同じ。 */
export async function savePrivateKey(userId: string, privateKeyPem: string): Promise<void> {
  const { databases } = await createAdminClient();
  await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID!,
    keysCollectionId(),
    userId,
    { privateKey: encrypt(privateKeyPem) },
    []
  );
}

/**
 * 暗号化された秘密鍵を取得する。
 * 移行が終わるまでは、actorsコレクションに残っている古い値も読む。
 */
export async function getEncryptedPrivateKey(userId: string): Promise<string> {
  const { databases } = await createAdminClient();
  try {
    const doc = await databases.getDocument(process.env.APPWRITE_DATABASE_ID!, keysCollectionId(), userId);
    return doc.privateKey;
  } catch (err: any) {
    if (err?.code !== 404) throw err;
  }
  const actor = await databases.getDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    userId
  );
  if (!actor.privateKey) {
    throw new Error("秘密鍵が見つからないよ！💦");
  }
  return actor.privateKey;
}

/** アカウント削除時に秘密鍵も削除する */
export async function deletePrivateKey(userId: string): Promise<void> {
  const { databases } = await createAdminClient();
  try {
    await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, keysCollectionId(), userId);
  } catch (err: any) {
    if (err?.code !== 404) throw err;
  }
}
