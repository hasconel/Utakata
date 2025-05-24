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
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${className}`}>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 ${className}`}
      >
        <div className="p-4">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <ExternalLink className="w-4 h-4" />
            <span className="truncate">{url}</span>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 ${className}`}
    >
      {metadata.image ? (
        <div className="relative h-48">
          <img
            src={metadata.image}
            alt={metadata.title || "リンクのプレビュー画像"}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          {metadata.favicon && (
            <img
              src={metadata.favicon}
              alt=""
              className="w-4 h-4"
            />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {metadata.siteName || new URL(url).hostname}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
          {metadata.title || url}
        </h3>

        {metadata.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {metadata.description}
          </p>
        )}
      </div>
    </a>
  );
} 