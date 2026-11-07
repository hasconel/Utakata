"use client";

/**
 * 投稿の本文を表示するコンポーネント！✨
 * 改行はそのまま表示して、URLはリンクにするよ！💖
 * 本文はプレーンテキストなので、HTMLとしては描画しない（タグはそのまま文字で出る）。
 */

// URLに使える半角文字だけを拾う（日本語の句読点や括弧の手前で止まる）
const URL_PATTERN = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g;
// 文末の句読点や閉じ括弧はURLに含めない
const TRAILING_PUNCTUATION = /[.,!?;:'")\]]+$/;

function linkify(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING_PUNCTUATION, "");
    const start = match.index ?? 0;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push(
      <a
        key={start}
        href={url}
        target="_blank"
        rel="nofollow noopener noreferrer"
        // カードの上のリンクを押したときに、投稿の詳細が開かないようにする
        onClick={(e) => e.stopPropagation()}
        className="text-purple-600 dark:text-pink-400 underline underline-offset-2 break-all hover:opacity-80"
      >
        {url}
      </a>
    );
    lastIndex = start + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function PostContent({ content, className = "" }: { content?: string | null; className?: string }) {
  if (!content) return null;
  return <div className={`whitespace-pre-wrap break-words ${className}`}>{linkify(content)}</div>;
}
