/**
 * アップロードしたファイルを配る。
 *   ・公開ファイルは、Vercel と Cloudflare に長く覚えてもらう（同じファイルは関数を動かさずに返る）
 *   ・フォロワー限定のファイルは、見た人のブラウザにだけ覚えてもらう（他の人に配られないように）
 *   ・?w=96 などを付けると、画像を縮めて webp で返す（アイコンや背景に元の大きな写真を送らない）
 *   ・動画のために Range（一部だけ）にも応える
 */
import { NextResponse } from "next/server";
import { ImageFormat } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { rangeResponse } from "@/lib/media/range";
import { pickWidth } from "@/lib/media/sizes";

const PUBLIC_CACHE = "public, max-age=31536000, s-maxage=31536000, immutable";
const PRIVATE_CACHE = "private, max-age=3600";
// 縮めてよい画像（GIF は動きが消えるので縮めない）
const RESIZABLE = /^image\/(jpeg|png|webp|avif|heic|heif)$/i;
const SAFE_MEDIA = /^(image|video|audio)\//i;

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const bucket = process.env.APPWRITE_STORAGE_ID!;
  const { storage } = await createSessionClient(request);
  try {
    const meta = await storage.getFile(bucket, fileId);
    const mimeType = meta.mimeType || "application/octet-stream";
    // 自分のサイトのページとして表示されないよう、メディア以外（SVG も）はダウンロード扱いにする
    const isSafe = SAFE_MEDIA.test(mimeType) && !/svg/i.test(mimeType);
    const isPublic = (meta.$permissions ?? []).some((p: string) => p === 'read("any")');
    const cache = isPublic ? PUBLIC_CACHE : PRIVATE_CACHE;
    const width = pickWidth(Number(new URL(request.url).searchParams.get("w")));

    const common = {
      "Cache-Control": cache,
      "X-Content-Type-Options": "nosniff",
      ...(isSafe ? {} : { "Content-Disposition": "attachment" }),
    };

    if (width && RESIZABLE.test(mimeType)) {
      const preview = await storage
        .getFilePreview(bucket, fileId, width, undefined, undefined, 80, undefined, undefined, undefined, undefined, undefined, undefined, ImageFormat.Webp)
        .catch(() => null);
      if (preview) {
        return new Response(preview, { headers: { ...common, "Content-Type": "image/webp" } });
      }
    }

    const file = new Uint8Array(await storage.getFileView(bucket, fileId));
    return rangeResponse(file, request, { ...common, "Content-Type": isSafe ? mimeType : "application/octet-stream" });
  } catch (error: any) {
    const status = error?.code === 404 || error?.code === 401 ? 404 : 500;
    if (status === 500) console.error("ファイル取得に失敗したよ！💦", error?.message);
    return new NextResponse(status === 404 ? "ファイルが見つかりません！💦" : "ファイル取得に失敗したよ！💦", {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
