/**
 * ActivityPubの署名ユーティリティ！✨
 * HTTP Signatureでリクエストをキラキラ署名＆検証！💖
 * ActivityPub仕様（https://www.w3.org/TR/activitypub/）とHTTP Signatureに準拠！🚀
 */
import { createHash, createSign, createVerify } from "crypto";
import { Errors } from "./errors";
//import { Actor } from "../appwrite/database";
import { decrypt } from "@/lib/appwrite/database";

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

    const signature = signer.sign(await decrypt(privateKey), "base64");

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
function parseSignatureHeader(headers: Record<string, string>, method: string, url: string): { keyId: string; signature: string; signingString: string } {
  try {
    const signatureHeader = headers["Signature"] || headers["signature"];
    if (!signatureHeader) {
      throw new Error("Signature header missing");
    }

    // Signatureヘッダーをパース（例：keyId="...",algorithm="...",headers="...",signature="..."）
    const params: Record<string, string> = {};
    signatureHeader.split(",").forEach((part) => {
      const [key, value] = part.split("=");
      params[key] = value.replace(/^"(.*)"$/, "$1");
    });

    const { keyId, algorithm, headers: signedHeaders, signature } = params;
    if (!keyId || !algorithm || !signedHeaders || !signature) {
      throw new Error("Invalid Signature header format");
    }

    if (algorithm !== "rsa-sha256") {
      throw new Error("Unsupported algorithm");
    }

    // 署名対象の文字列を構築
    const urlObj = new URL(url);
    const headerValues: string[] = [];
    signedHeaders.split(" ").forEach((header: string) => {
      if (header === "(request-target)") {
        headerValues.push(`(request-target): ${method.toLowerCase()} ${urlObj.pathname}`);
      } else {
        const headerValue = headers[header] || headers[header.toLowerCase()];
        if (!headerValue) {
          throw new Error(`Missing header: ${header}`);
        }
        headerValues.push(`${header}: ${headerValue}`);
      }
    });
    const signingString = headerValues.join("\n");

    return { keyId, signature, signingString };
  } catch (err: any) {
    console.error("parseSignatureHeader error:", err.message);
    throw new Error(Errors.SignatureParseFailed);
  }
}

/**
 * HTTP Signatureを検証！🔍
 * 受信したアクティビティの署名をチェックして安全をキラキラ確保！✨
 * @param req Next.jsのリクエストオブジェクト
 * @param actor 受信者のアクター（appwrite/types.tsのActor）
 * @returns 署名が有効かどうか
 * @throws Error 署名検証エラー
 */
export async function verifySignature(req: import("next/server").NextRequest, actor: string): Promise<boolean> {
  try {
    // リクエストヘッダーを取得
    const headers = Object.fromEntries(req.headers);

    // Signatureヘッダーをパース
    const {  signature, signingString } = parseSignatureHeader(headers, req.method || "POST", req.url);
    //console.log(keyId, signature, signingString);
    // 公開鍵を取得（actorIdからフェッチ）
    const actorData = await fetch(actor, {
      headers: { Accept: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"' },
    }).then(res => res.json());
    //console.log("actorData",actorData);
    const publicKey = actorData.publicKey?.publicKeyPem;
    if (!publicKey) {
      throw new Error(Errors.PublicKeyFetchFailed);
    }

    // 署名を検証
    const verifier = createVerify("RSA-SHA256");
    verifier.update(signingString);
    return verifier.verify(publicKey, signature, "base64");
  } catch (err: any) {
    console.error("verifySignature error:", err.message);
    throw new Error(err.message || Errors.InvalidSignature);
  }
}