/**
 * リモートのアクター情報の取得と、フォローへのAcceptの配信。
 * 署名の検証には使わないこと（検証では毎回最新の鍵を取得する）。
 */
import { ID } from "node-appwrite";
import { safeFetch, SafeFetchResponse } from "@/lib/security/safeFetch";
import { signGetRequest, signRequest } from "@/lib/activitypub/crypto";
import { createAdminClient } from "@/lib/appwrite/serverConfig";
import { getEncryptedPrivateKey } from "@/lib/activitypub/privateKeyStore";

const ACTIVITY_ACCEPT = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { actor: any; expiresAt: number }>();

/** 指定したユーザーの鍵でGET用の署名ヘッダーを作る。作れなければ null。 */
async function buildSignedHeaders(url: string, userId: string): Promise<Record<string, string> | null> {
  try {
    const { databases } = await createAdminClient();
    const actor = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      userId
    );
    return await signGetRequest(url, await getEncryptedPrivateKey(userId), `${actor.actorId}#main-key`);
  } catch (err: any) {
    console.error("GET署名の生成に失敗:", err?.message);
    return null;
  }
}

/**
 * ActivityPubのドキュメントを取得する。
 * まず署名なしで取得し、authorized_fetch のサーバーに拒否されたときだけ署名して取得し直す。
 * @param options.signer 署名するユーザーのID。ログイン確認が必要な場合は関数で渡せる。
 */
export async function fetchActivityDocument(
  url: string,
  options: {
    signer?: string | (() => Promise<string | null>);
    accept?: string;
    timeoutMs?: number;
  } = {}
): Promise<SafeFetchResponse> {
  const request = {
    maxBytes: 1024 * 1024,
    timeoutMs: options.timeoutMs,
  };
  const headers = { Accept: options.accept ?? ACTIVITY_ACCEPT, "User-Agent": "Utakata/1.0" };
  const response = await safeFetch(url, { ...request, headers });
  if ((response.status !== 401 && response.status !== 403) || !options.signer) {
    return response;
  }
  const userId = typeof options.signer === "function" ? await options.signer() : options.signer;
  const signedHeaders = userId ? await buildSignedHeaders(url, userId) : null;
  if (!signedHeaders) {
    return response;
  }
  return safeFetch(url, { ...request, headers: { ...headers, ...signedHeaders } });
}

/**
 * リモートのアクターを取得する。取得できなければ null。
 * @param signerUserId 相手が署名付きの取得を求めたときに署名するユーザー
 */
export async function fetchRemoteActor(actorId: string, signerUserId?: string): Promise<any | null> {
  const cached = cache.get(actorId);
  if (cached && cached.expiresAt > Date.now()) return cached.actor;
  try {
    const response = await fetchActivityDocument(actorId, { signer: signerUserId, timeoutMs: 5_000 });
    if (!response.ok) return null;
    const data = JSON.parse(response.body.toString("utf-8"));
    if (data?.id !== actorId) return null;
    const icon = Array.isArray(data.icon) ? data.icon[0] : data.icon;
    const actor = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: data.type || "Person",
      id: data.id,
      preferredUsername: data.preferredUsername,
      displayName: data.name || data.preferredUsername,
      inbox: data.inbox,
      outbox: data.outbox,
      followers: data.followers,
      following: data.following,
      publicKey: data.publicKey,
      icon: { type: "Image", url: typeof icon?.url === "string" ? icon.url : "" },
    };
    cache.set(actorId, { actor, expiresAt: Date.now() + CACHE_TTL_MS });
    return actor;
  } catch (err: any) {
    console.error("リモートアクターの取得に失敗:", actorId, err?.message);
    return null;
  }
}

/**
 * フォローを承認したことを相手のinboxへ通知する。
 * 届かなくてもフォローの受信処理は失敗にしない（ログだけ残す）。
 */
export async function sendAccept(recipient: { $id: string; actorId: string }, followerId: string, follow: unknown): Promise<void> {
  try {
    const follower = await fetchRemoteActor(followerId, recipient.$id);
    if (typeof follower?.inbox !== "string") {
      throw new Error("inbox not found");
    }
    const accept = {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `${recipient.actorId}#accepts/follows/${ID.unique()}`,
      type: "Accept",
      actor: recipient.actorId,
      object: follow,
    };
    const { headers } = await signRequest(
      follower.inbox,
      accept,
      await getEncryptedPrivateKey(recipient.$id),
      `${recipient.actorId}#main-key`
    );
    const response = await safeFetch(follower.inbox, {
      method: "POST",
      headers,
      body: JSON.stringify(accept),
      timeoutMs: 5_000,
    });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
  } catch (err: any) {
    console.error("Acceptの配信に失敗:", followerId, err?.message);
  }
}
