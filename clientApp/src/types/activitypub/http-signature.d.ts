/**
 * http-signatureの型定義！✨
 * signとverifySignatureを型安全に！🔒
 */
declare module "http-signature" {
    import { ClientRequest } from "http";
  
    /**
     * 署名オプション！秘密鍵とアルゴリズムを指定！💎
     */
    interface SignOptions {
      key: string;
      algorithm: string;
    }
  
    /**
     * 文字列を署名！ActivityPubのinbox配信に使用！📜
     */
    export function sign(signedString: string, options: SignOptions): string;
  
    /**
     * リクエストに署名を追加！（未使用）
     */
    export function sign(request: ClientRequest, options: SignOptions): void;
  
    /**
     * 署名検証オプション！リクエストの整合性をチェック！🔍
     */
    interface VerifyOptions {
      method: string;
      url: string;
      headers: Record<string, string>;
      publicKey: string;
    }
  
    /**
     * 署名を検証！inbox受信時に使用！✅
     */
    export function verifySignature(options: VerifyOptions): boolean;
  }