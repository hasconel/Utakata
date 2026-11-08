import { convertToInternalUrl } from "@/lib/utils";
import { emojiMap } from "@/lib/activitypub/emoji";

const EMOJI = /:([A-Za-z0-9_+-]{1,64}):/g;

/**
 * 表示名など、短い文の :絵文字: だけを画像にする（リンクやメンションにはしない）。
 * 知らない :name: は文字のまま。
 */
export function EmojiText({ text, emojis }: { text?: string | null; emojis?: string[] | null }) {
  if (!text) return null;
  const map = emojiMap(emojis);
  if (map.size === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(EMOJI)) {
    const url = map.get(match[1]);
    if (!url) continue;
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <img
        key={start}
        src={convertToInternalUrl(url)}
        alt={match[0]}
        title={match[0]}
        loading="lazy"
        className="inline-block h-[1.2em] w-auto max-w-[3em] align-[-0.2em] object-contain"
      />
    );
    last = start + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
