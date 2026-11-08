/**
 * リモートのアクター情報の取得と、フォローへのAcceptの配信。
 * 署名の検証には使わないこと（検証では毎回最新の鍵を取得する）。
 */
import { ID } from "node-appwrite";
import { unstable_cache } from "next/cache";
import { after } from "next/server";
import { buildEmojis } from "@/lib/activitypub/emoji";
import { safeFetch, SafeFetchResponse } from "@/lib/security/safeFetch";
import { signGetRequest, signRequest } from "@/lib/activitypub/crypto";
import { createAdminClient } from "@/lib/appwrite/serverConfig";
import { getEncryptedPrivateKey } from "@/lib/activitypub/privateKeyStore";

const ACTIVITY_ACCEPT = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';
const CACHE_TTL_MS = 10 * 60 * 1000;
const REMOTE_CACHE_SECONDS = 60 * 60;
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

/** 相手のサーバーからアクターを読む。読めなければ例外（失敗はキャッシュしないため） */
async function loadRemoteActor(actorId: string, signerUserId?: string): Promise<any> {
  const response = await fetchActivityDocument(actorId, { signer: signerUserId, timeoutMs: 5_000 });
  if (!response.ok) throw new Error(`status ${response.status}`);
  const data = JSON.parse(response.body.toString("utf-8"));
  if (data?.id !== actorId) throw new Error("id mismatch");
  const icon = Array.isArray(data.icon) ? data.icon[0] : data.icon;
  return {
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
    // 表示名に使われているカスタム絵文字
    emojis: buildEmojis(data.tag),
  };
}

/**
 * Vercel のデータキャッシュに1時間覚えてもらう。
 * 関数のメモリ（cache）は関数が入れ替わるたびに消えるので、それだけでは毎回取りに行くことになっていた。
 * Next.js の外（スクリプトなど）で呼ばれたときは、そのまま読む。
 */
async function loadCached(actorId: string, signerUserId?: string): Promise<any> {
  try {
    return await unstable_cache(() => loadRemoteActor(actorId, signerUserId), ["remote-actor-v2", actorId], {
      revalidate: REMOTE_CACHE_SECONDS,
      tags: ["remote-actor"],
    })();
  } catch (err: any) {
    if (/incrementalCache|static generation store|outside a request/i.test(err?.message ?? "")) {
      return loadRemoteActor(actorId, signerUserId);
    }
    throw err;
  }
}

/**
 * リモートのアクターを取得する。取得できなければ null。
 * @param signerUserId 相手が署名付きの取得を求めたときに署名するユーザー
 */
export async function fetchRemoteActor(actorId: string, signerUserId?: string): Promise<any | null> {
  const cached = cache.get(actorId);
  if (cached && cached.expiresAt > Date.now()) return cached.actor;
  try {
    const actor = await loadCached(actorId, signerUserId);
    cache.set(actorId, { actor, expiresAt: Date.now() + CACHE_TTL_MS });
    return actor;
  } catch (err: any) {
    console.error("リモートアクターの取得に失敗:", actorId, err?.message);
    return null;
  }
}

/**
 * 画面の表示用。waitMs 待っても届かなければ null を返す（遅いサーバーにタイムライン全体を待たせない）。
 * 取得はそのまま続けて、届いたらキャッシュに入れておく（次に開いたときには出る）。
 */
export async function fetchRemoteActorQuick(actorId: string, signerUserId?: string, waitMs = 2_000): Promise<any | null> {
  const cached = cache.get(actorId);
  if (cached && cached.expiresAt > Date.now()) return cached.actor;
  const pending = fetchRemoteActor(actorId, signerUserId);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => (timer = setTimeout(() => resolve("timeout"), waitMs)));
  const result = await Promise.race([pending, timeout]);
  clearTimeout(timer);
  if (result !== "timeout") return result;
  // 返事を返したあとも、取得が終わるまで関数を止めない
  try {
    after(() => pending.then(() => undefined));
  } catch {
    // リクエストの外では after が使えない（そのまま裏で続く）
  }
  return null;
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
