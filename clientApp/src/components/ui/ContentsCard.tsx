"use client";
import { useState } from "react";
import LinkCard from "./LinkCard";
import { useTheme } from "@/lib/theme/ThemeContext";

/**
 * URLを埋め込みコンテンツに変換するコンポーネント！✨
 * ニコニコ動画、YouTube、X（旧Twitter）のURLを対応する埋め込みプレーヤーに変換するよ！💖
 */
const UrlInText = ({ arg }: { arg: string }) => {
  const [, setError] = useState<string | null>(null);
  
  // テーマを取得（ThemeProviderの外ではデフォルトテーマを使用）
  const { theme } = useTheme();

  // URLが空の場合は何も表示しない
  if (arg == null) {
    return <></>;
  }

  // エラーハンドリング
  const handleError = () => {
    setError("コンテンツの読み込みに失敗したわ！💦");
  };

  // ニコニコ動画のURLを検出
  const NiconicoURLs = arg.match(
    /https?:\/\/(((\w+\.)?nicovideo\.jp\/watch)|nico\.ms)\/sm[0-9]+/
  );
  if (NiconicoURLs != null) {
    let ResultPath = NiconicoURLs[0].split("/watch/")[1];
    if (ResultPath == null) {
      ResultPath = NiconicoURLs[0].split(".ms/")[1];
    }
    return (
      <div className="relative">
        <iframe
          className="w-full aspect-video rounded-xl"
          src={`https://embed.nicovideo.jp/watch/${ResultPath}`}
          title="Niconico video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={handleError}
        ></iframe>
      </div>
    );
  }

  // YouTubeの短縮URLを検出
  const ResultYouTubeURLs1 = arg.match(/https?:\/\/youtu\.be\/[\w-]+/);
  if (ResultYouTubeURLs1 != null) {
    const ResultPath = new URL(ResultYouTubeURLs1[0]).pathname;
    return (
      <div className="relative">
        <iframe
          className="w-full aspect-video rounded-xl"
          src={`https://www.youtube.com/embed/${ResultPath}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={handleError}
        ></iframe>
      </div>
    );
  }

  // YouTubeの通常URLを検出
  const ResultYouTubeURLs2 = arg.match(
    /https?:\/\/(?:[/w]+\.youtube\.com|youtube\.com)\/watch\?v=[\w-]+/
  );
  if (ResultYouTubeURLs2 != null) {
    const ResultPath0 = new URL(ResultYouTubeURLs2[0]).searchParams;
    const ResultPath1 = ResultPath0.get("v");
    return (
      <div className="relative">
        <iframe
          className="w-full aspect-video rounded-xl"
          src={`https://www.youtube.com/embed/${ResultPath1}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={handleError}
        ></iframe>
      </div>
    );
  }

  // X（旧Twitter）のURLを検出
  const XURLs = arg.match(
    /https?:\/\/(twitter|x)\.com\/\w+\/status\/[0-9]{6,22}/
  );
  if (XURLs != null) {
    const ResultPath = new URL(XURLs[0]).pathname;
    return (
      <div className="relative">
        <blockquote
          data-theme={theme}
          className="twitter-tweet w-full"
          onError={handleError}
        >
          <a href={`https://twitter.com${ResultPath}`}></a>
        </blockquote>
        <script
          async
          src="https://platform.twitter.com/widgets.js"
        ></script>
      </div>
    );
  }

  // 他のURLを検出した場合はリンクカードを表示
  const url = arg.match(/https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+/);
  
  if (url != null) {
    return <LinkCard url={url[0]} />;
  }

  return <></>;
};

export default UrlInText;