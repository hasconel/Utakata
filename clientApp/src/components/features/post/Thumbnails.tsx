import { Music } from "lucide-react";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { convertToInternalUrl, mediaUrl } from "@/lib/utils";

/** リプライ一覧などで使う、小さな画像の列。閲覧注意の画像はぼかしたまま */
export function Thumbnails({ images, size = "h-16 w-16" }: { images: ActivityPubImage[]; size?: string }) {
  if (images.length === 0) return null;
  return (
    <div className="mt-1 flex gap-1.5">
      {images.slice(0, 4).map((image, index) => (
        <div key={`${image.url}-${index}`} className={`relative shrink-0 overflow-hidden rounded-lg bg-muted ${size}`}>
          {image.type === "Audio" ? (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Music aria-hidden className="h-5 w-5" />
            </span>
          ) : image.type === "Video" ? (
            <video src={convertToInternalUrl(image.url)} preload="metadata" muted className={`h-full w-full object-cover ${image.sensitive ? "blur-xl" : ""}`} />
          ) : (
            <img
              src={mediaUrl(image.url, 192)}
              alt={image.name || ""}
              loading="lazy"
              className={`h-full w-full object-cover ${image.sensitive ? "scale-110 blur-xl" : ""}`}
            />
          )}
          {index === 3 && images.length > 4 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white tabular-nums">
              +{images.length - 4}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** 閲覧注意の投稿は、一覧では説明文だけを出す */
export function compactText(note: { content?: string; summary?: string }) {
  return note.summary ? `⚠ ${note.summary}` : note.content;
}
