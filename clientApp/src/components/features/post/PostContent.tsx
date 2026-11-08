"use client";

import Link from "next/link";
import { convertToInternalUrl } from "@/lib/utils";
import { emojiMap } from "@/lib/activitypub/emoji";

/**
 * 投稿の本文🫧
 * 改行はそのまま、URL・メンション（@name / @name@host）はリンクに、:絵文字: は画像にする。
 * 本文はプレーンテキストなので、HTMLとしては描画しない（タグはそのまま文字で出る）。
 */

// URL / メンション / カスタム絵文字 をまとめて拾う
//   URLに使える半角文字だけを拾う（日本語の句読点や括弧の手前で止まる）
//   メンションは英数字の直後では拾わない（メールアドレスを誤って拾わないように）
const TOKEN =
  /(https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)|(?<![\w@/])@([A-Za-z0-9_]{1,64})(?:@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+))?|:([A-Za-z0-9_+-]{1,64}):/g;
// 文末の句読点や閉じ括弧はURLに含めない
const TRAILING_PUNCTUATION = /[.,!?;:'")\]]+$/;

const stop = (e: React.MouseEvent) => e.stopPropagation();


function render(text: string, emojis: Map<string, string>) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    const [whole, url, user, host, emoji] = match;
    let node: React.ReactNode = null;
    let length = whole.length;

    if (url) {
      const clean = url.replace(TRAILING_PUNCTUATION, "");
      length = clean.length;
      node = (
        <a
          key={start}
          href={clean}
          target="_blank"
          rel="nofollow noopener noreferrer"
          // カードの上のリンクを押したときに、投稿の詳細が開かないようにする
          onClick={stop}
          className="text-primary underline underline-offset-2 break-all hover:text-primary-hover"
        >
          {clean}
        </a>
      );
    } else if (user) {
      node = (
        <Link key={start} href={`/@${user}${host ? `@${host}` : ""}`} onClick={stop} className="text-primary hover:underline">
          {whole}
        </Link>
      );
    } else if (emoji && emojis.has(emoji)) {
      node = (
        <img
          key={start}
          src={convertToInternalUrl(emojis.get(emoji)!)}
          alt={whole}
          title={whole}
          loading="lazy"
          className="inline-block h-[1.4em] w-auto max-w-[4em] align-[-0.3em] object-contain"
        />
      );
    }
    if (!node) continue; // 知らない :name: は文字のまま
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push(node);
    lastIndex = start + length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function PostContent({
  content,
  emojis,
  className = "",
}: {
  content?: string | null;
  emojis?: string[] | null;
  className?: string;
}) {
  if (!content) return null;
  return <div className={`whitespace-pre-wrap break-words ${className}`}>{render(content, emojiMap(emojis))}</div>;
}
