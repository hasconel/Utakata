/**
 * アップロードの前に、ブラウザの中で写真を縮める。
 *   ・長い辺を MAX_SIDE までにして、webp（使えなければ jpeg）にする
 *   ・GIF（動きが消える）と、もともと小さい画像はそのまま
 * Vercel が受け取れるのは 4.5MB まで（base64 にすると 1.33 倍になる）なので、
 * 縮めたあとで UPLOAD_LIMIT_BYTES を超えるものは送らない。
 */
const MAX_SIDE = 2048;
const QUALITY = 0.85;
const SMALL_ENOUGH = 800 * 1024;
export const UPLOAD_LIMIT_BYTES = 3 * 1024 * 1024;

function canEncodeWebp(): boolean {
  try {
    return document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= SMALL_ENOUGH) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const type = canEncodeWebp() ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  // 縮めたほうが大きくなる（もともとよく圧縮された画像）ときは元のまま
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + (type === "image/webp" ? ".webp" : ".jpg");
  return new File([blob], name, { type, lastModified: file.lastModified });
}
