/**
 * 画像を縮めて配るときの幅（この中からだけ選ぶ。好きな幅を許すと、キャッシュが効かなくなる）
 *   96: アイコン（小）  192: アイコン（大）・小さな画像  640: タイムラインの画像  1280: 1枚の画像・ヘッダー  1920: 画面の背景
 */
export const MEDIA_WIDTHS = [96, 192, 640, 1280, 1920] as const;
export type MediaWidth = (typeof MEDIA_WIDTHS)[number];

export function pickWidth(requested: number): MediaWidth | null {
  if (!Number.isFinite(requested) || requested <= 0) return null;
  return MEDIA_WIDTHS.find((w) => w >= requested) ?? MEDIA_WIDTHS[MEDIA_WIDTHS.length - 1];
}
