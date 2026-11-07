/**
 * ActivityPubの署名ユーティリティ！✨
 * HTTP Signatureでリクエストをキラキラ署名＆検証！💖
 * ActivityPub仕様（https://www.w3.org/TR/activitypub/）とHTTP Signatureに準拠！🚀
 */
import { createHash, createSign, createVerify } from "crypto";
import { Errors } from "./errors";
import { decrypt } from "@/lib/activitypub/privateKeyStore";
import { safeFetch } from "@/lib/security/safeFetch";

/** 署名に必ず含まれていなければならないヘッダー */
const REQUIRED_SIGNED_HEADERS = ["(request-target)", "host", "date", "digest"];
/** Dateヘッダーの許容誤差 */
const MAX_DATE_SKEW_MS = 60 * 60 * 1000;

/**
 * HTTP Signatureを生成！📝
 * inboxへのリクエストを署名してセキュリティバッチリ！💪
 * @param url 配信先のinbox URL（例：https://example.com/actor/alice/inbox）
 * @param body リクエストボディ（アクティビティJSON）
 * @param privateKey 署名用のRSA秘密鍵（PEM形式）AES-256-GCMで暗号化されたもの
 * @param keyId 公開鍵のID（例：https://domain/actor/alice#main-key）
 * @returns 署名済みのヘッダー
 * @throws Error 署名生成エラー
 */
export async function signRequest(url: string, body: any, privateKey: string, keyId: string): Promise<{ headers: Record<string, string> }> {
  try {
    const parsedUrl = new URL(url);
    // ボディのSHA-256ハッシュを生成（Digestヘッダー用）
    const digest = createHash("sha256")
      .update(JSON.stringify(body))
      .digest("base64");
    const headers = {
      Host: parsedUrl.host,
      Date: new Date().toUTCString(),
      Digest: `SHA-256=${digest}`,
      "Content-Type": "application/activity+json",
      "Accept": "application/activity+json",
    };

    // 署名対象の文字列を生成
    const signer = createSign("RSA-SHA256");
    const headerString = `(request-target): post ${parsedUrl.pathname}\nhost: ${headers.Host}\ndate: ${headers.Date}\ndigest: ${headers.Digest}`;
    signer.update(headerString);

    const signature = signer.sign(decrypt(privateKey), "base64");
    const signatureHeader = `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"`;
    
    return {
      headers: {
        ...headers,
        Signature: signatureHeader,
      },
    };
  } catch (err: any) {
    console.error("signRequest error:", err.message);
    throw new Error(Errors.SignatureFailed);
  }
}

/**
 * Signatureヘッダーをパース！🔍
 * HTTP Signatureのフォーマットを解析して検証用データを抽出！✨
 * @param headers リクエストヘッダー
 * @param method HTTPメソッド
 * @param url リクエストURL
 * @returns パース結果（キーID、署名、署名文字列）
 * @throws Error パースエラー
 */
function parseSignatureHeader(headers: Record<string, string>, method: string, url: string): { keyId: string; signature: string; signingString: string; signedHeaders: string[] } {
  try {
    const signatureHeader = headers["signature"];
    if (!signatureHeader) {
      throw new Error("Signature header missing");
    }

    // Signatureヘッダーをパース（例：keyId="...",algorithm="...",headers="...",signature="..."）
    const params: Record<string, string> = {};
    for (const [, key, value] of signatureHeader.matchAll(/(\w+)="([^"]*)"/g)) {
      params[key] = value;
    }

    const { keyId, algorithm, headers: signedHeaderList, signature } = params;
    if (!keyId || !algorithm || !signedHeaderList || !signature) {
      throw new Error("Invalid Signature header format");
    }

    if (algorithm !== "rsa-sha256") {
      throw new Error("Unsupported algorithm");
    }

    // 署名対象の文字列を構築
    const urlObj = new URL(url);
    const signedHeaders = signedHeaderList.toLowerCase().split(/\s+/);
    const signingString = signedHeaders
      .map((header) => {
        if (header === "(request-target)") {
          return `(request-target): ${method.toLowerCase()} ${urlObj.pathname}${urlObj.search}`;
        }
        const headerValue = headers[header];
        if (!headerValue) {
          throw new Error(`Missing header: ${header}`);
        }
        return `${header}: ${headerValue}`;
      })
      .join("\n");

    return { keyId, signature, signingString, signedHeaders };
  } catch (err: any) {
    console.error("parseSignatureHeader error:", err.message);
    throw new Error(Errors.SignatureParseFailed);
  }
}

/**
 * HTTP Signatureを検証！🔍
 * 署名だけでなく、署名が本文・時刻・送信者に結びついていることも確認する。
 * @param req Next.jsのリクエストオブジェクト
 * @param rawBody 受信した本文（パース前の文字列）
 * @param actor アクティビティのactorのID
 * @returns すべての検証に通れば true
 */
export async function verifySignature(req: import("next/server").NextRequest, rawBody: string, actor: string): Promise<boolean> {
  try {
    const headers = Object.fromEntries(req.headers);
    const { keyId, signature, signingString, signedHeaders } = parseSignatureHeader(headers, req.method || "POST", req.url);

    // 本文や宛先を署名の対象から外したリクエストは受け付けない
    if (!REQUIRED_SIGNED_HEADERS.every((header) => signedHeaders.includes(header))) {
      throw new Error("Required headers are not signed");
    }

    // 古い署名の使い回しを防ぐ
    const signedAt = Date.parse(headers["date"]);
    if (Number.isNaN(signedAt) || Math.abs(Date.now() - signedAt) > MAX_DATE_SKEW_MS) {
      throw new Error("Date header is out of range");
    }

    // 署名されたDigestが、実際に受信した本文のものであることを確認する
    const digest = headers["digest"]?.match(/SHA-256=([^,\s]+)/i)?.[1];
    if (!digest || digest !== createHash("sha256").update(rawBody).digest("base64")) {
      throw new Error("Digest mismatch");
    }

    // actorを取得（内部ネットワーク宛てはsafeFetchが拒否する）
    const response = await safeFetch(actor, {
      headers: { Accept: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"' },
      maxBytes: 1024 * 1024,
    });
    if (!response.ok) {
      throw new Error(Errors.PublicKeyFetchFailed);
    }
    const actorData = JSON.parse(response.body.toString("utf-8"));
    const publicKey = actorData.publicKey?.publicKeyPem;
    if (!publicKey) {
      throw new Error(Errors.PublicKeyFetchFailed);
    }

    // 署名に使われた鍵が、そのactor自身のものであることを確認する
    if (actorData.id !== actor || actorData.publicKey.owner !== actor || actorData.publicKey.id !== keyId) {
      throw new Error("Signing key does not belong to actor");
    }

    // 署名を検証
    const verifier = createVerify("RSA-SHA256");
    verifier.update(signingString);
    return verifier.verify(publicKey, signature, "base64");
  } catch (err: any) {
    console.error("verifySignature error:", err.message);
    return false;
  }
}
