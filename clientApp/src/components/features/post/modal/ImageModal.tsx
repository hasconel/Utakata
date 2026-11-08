"use client";

import { useState } from "react";
import { Eye, EyeOff, Music, Play } from "lucide-react";
import { ActivityPubImage } from "@/types/activitypub/collections";
import ImageModalContent from "./ImageModalContent";
import { convertToInternalUrl, mediaUrl } from "@/lib/utils";

/** 縦横の比（わからないときは null）。1枚だけのときの枠の形に使う */
function ratioOf(image: ActivityPubImage): number | null {
  return image.width && image.height ? image.width / image.height : null;
}

/** 音声。▶ と再生のバーだけのシンプルな形 */
function AudioItem({ image }: { image: ActivityPubImage }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-3" onClick={(e) => e.stopPropagation()}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Music aria-hidden className="h-5 w-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {image.name && <span className="truncate text-sm text-foreground">{image.name}</span>}
        <audio src={convertToInternalUrl(image.url)} controls preload="none" className="h-9 w-full" />
      </div>
    </div>
  );
}

/**
 * 投稿の画像・動画・音声🫧
 * 1枚なら元の形のまま（縦長は高さを抑えて全体が入るように）、2枚以上は正方形で並べる。
 * 閲覧注意の画像は、押すまでぼかしておく。
 */
export default function ImageModal({
  images,
  setIsModalOpen,
  isModalOpen,
  ModalSwitch = true,
  setModalImages,
  setModalIndex,
}: {
  images: ActivityPubImage[];
  setIsModalOpen: (isOpen: boolean) => void;
  isModalOpen: boolean;
  ModalSwitch?: boolean;
  setModalImages: (images: ActivityPubImage[]) => void;
  setModalIndex: (index: number) => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const audios = images.filter((image) => image.type === "Audio");
  const visuals = images.filter((image) => image.type !== "Audio");
  const isSensitive = visuals.some((image) => image.sensitive);
  const hidden = isSensitive && !revealed;
  const single = visuals.length === 1 ? visuals[0] : null;
  const singleRatio = single ? ratioOf(single) : null;

  const open = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hidden) return setRevealed(true);
    if (ModalSwitch) {
      setModalImages(visuals);
      setModalIndex(index);
    } else {
      setCurrentImageIndex(index);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {visuals.length > 0 && (
        <div className="relative">
          <div className={`grid gap-1.5 overflow-hidden rounded-xl ${single ? "grid-cols-1" : "grid-cols-2"}`}>
            {visuals.slice(0, 4).map((image, index) => {
              // 動画は元のまま、画像は表示する大きさに縮めたもの（拡大表示では元の画像）
              const src = image.type === "Video" ? convertToInternalUrl(image.url) : mediaUrl(image.url, single ? 1280 : 640);
              // 1枚：大きさがわかれば元の比で（縦長は最大 4:5）、わからなければ高さだけ抑えて全体を見せる
              const frame = single
                ? singleRatio
                  ? ""
                  : "max-h-[30rem]"
                : "aspect-square";
              const style = single && singleRatio ? { aspectRatio: String(Math.max(singleRatio, 0.8)) } : undefined;
              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={open(index)}
                  aria-label={hidden ? "閲覧注意の画像を表示" : image.name || "画像を拡大"}
                  className={`relative block w-full overflow-hidden bg-muted ${frame} ${hidden ? "cursor-pointer" : "cursor-zoom-in"}`}
                  style={style}
                >
                  {image.type === "Video" ? (
                    <>
                      <video src={src} preload="metadata" muted playsInline className={`h-full w-full object-cover ${hidden ? "blur-2xl" : ""}`} />
                      {!hidden && (
                        <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white">
                          <Play className="h-5 w-5 fill-current" />
                        </span>
                      )}
                    </>
                  ) : (
                    <img
                      src={src}
                      alt={image.name || ""}
                      loading="lazy"
                      decoding="async"
                      className={`${single && !singleRatio ? "mx-auto max-h-[30rem] w-auto max-w-full object-contain" : "h-full w-full object-cover"} ${hidden ? "scale-110 blur-2xl" : ""}`}
                    />
                  )}
                  {index === 3 && visuals.length > 4 && !hidden && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-xl font-semibold text-white tabular-nums">
                      +{visuals.length - 4}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 閲覧注意：真ん中の 👁 で表示、表示したあとは右上の 🙈 でまたぼかせる */}
          {hidden ? (
            <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
              <Eye className="h-5 w-5" />
            </span>
          ) : (
            isSensitive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRevealed(false);
                }}
                aria-label="画像をぼかす"
                title="ぼかす"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            )
          )}
        </div>
      )}

      {audios.map((image, index) => (
        <AudioItem key={`${image.url}-${index}`} image={image} />
      ))}

      {!ModalSwitch && isModalOpen && (
        <ImageModalContent imagesTable={visuals} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} index={currentImageIndex} />
      )}
    </div>
  );
}
