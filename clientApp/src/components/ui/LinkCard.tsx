"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Image as ImageIcon } from "lucide-react";

/**
 * リンクカードコンポーネント！✨
 * URLからメタデータを取得してキラキラなカードを作るよ！💖
 */
interface LinkCardProps {
  url: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface Metadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

export default function LinkCard({ url, className = "", onLoad, onError }: LinkCardProps) {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // メタデータを取得
        const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          throw new Error("メタデータの取得に失敗したわ！💦");
        }

        const data = await response.json();
        setMetadata(data);
        onLoad?.(); // ロード完了時にコールバックを呼び出し
      } catch (err) {
        console.error("メタデータの取得に失敗したわ！", err);
        setError("メタデータの取得に失敗したわ！💦");
        onError?.(); // エラー時にコールバックを呼び出し
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [url, onLoad, onError]); // 依存配列にコールバックを追加

  if (isLoading) {
    return (
      <div className={`mt-1 overflow-hidden rounded-xl border border-border bg-card ${className}`}>
        <div className="animate-pulse">
          <div className="h-48 bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <a onClick={(e) => e.stopPropagation()}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block mt-1 overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-accent/40 ${className}`}
      >
        <div className="px-3 py-2.5">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <ExternalLink className="w-4 h-4" />
            <span className="truncate">{url}</span>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a onClick={(e) => e.stopPropagation()}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block mt-1 overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-accent/40 ${className}`}
    >
      {metadata.image ? (
        <div className="relative aspect-[1.91/1] max-h-56 w-full">
          <img
            src={metadata.image}
            alt={metadata.title || "リンクのプレビュー画像"}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-48 bg-muted flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground" />
        </div>
      )}

      <div className="px-3 py-2.5">
        <div className="flex items-center space-x-2 mb-2">
          {metadata.favicon && (
            <img
              src={metadata.favicon}
              alt=""
              className="w-4 h-4"
            />
          )}
          <span className="text-sm text-muted-foreground">
            {metadata.siteName || new URL(url).hostname}
          </span>
        </div>

        <h3 className="mb-0.5 line-clamp-2 text-sm font-semibold text-foreground">
          {metadata.title || url}
        </h3>

        {metadata.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {metadata.description}
          </p>
        )}
      </div>
    </a>
  );
} 