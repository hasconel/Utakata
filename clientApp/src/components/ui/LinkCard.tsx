"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { convertToInternalUrl } from "@/lib/utils";

interface Metadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

/** 同じURLを何度も取りに行かないように、ページを開いているあいだ覚えておく */
const cache = new Map<string, Promise<Metadata | null>>();
function loadMetadata(url: string) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(`/api/metadata?url=${encodeURIComponent(url)}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
    );
  }
  return cache.get(url)!;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

/**
 * リンクカード🫧
 * 画像があれば上に、無ければ左に小さなアイコンだけを置いた細い形にする。
 */
export default function LinkCard({ url, className = "" }: { url: string; className?: string }) {
  const [metadata, setMetadata] = useState<Metadata | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadMetadata(url).then((data) => !cancelled && setMetadata(data));
    return () => {
      cancelled = true;
    };
  }, [url]);

  const box = `mt-1 block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-accent/40 ${className}`;

  if (metadata === undefined) {
    return <div aria-hidden className={`${box} h-16 animate-pulse bg-muted`} />;
  }

  const title = metadata?.title || url;
  const site = metadata?.siteName || hostOf(url);

  return (
    <a href={url} target="_blank" rel="nofollow noopener noreferrer" onClick={(e) => e.stopPropagation()} className={box}>
      {metadata?.image && (
        <img
          src={convertToInternalUrl(metadata.image)}
          alt=""
          loading="lazy"
          className="aspect-[1.91/1] max-h-56 w-full object-cover"
        />
      )}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {!metadata?.image && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
            {metadata?.favicon ? (
              <img src={convertToInternalUrl(metadata.favicon)} alt="" className="h-5 w-5" />
            ) : (
              <Link2 aria-hidden className="h-4 w-4" />
            )}
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs text-muted-foreground">{site}</span>
          <span className="line-clamp-2 text-sm font-semibold text-foreground">{title}</span>
          {metadata?.description && <span className="line-clamp-2 text-sm text-muted-foreground">{metadata.description}</span>}
        </div>
      </div>
    </a>
  );
}
