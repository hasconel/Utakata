/**
 * カスタム絵文字（Misskey / Mastodon の :name:）。
 * 投稿・表示名・自己紹介の tag に { type: "Emoji", name: ":name:", icon: { url } } の形で入っている。
 * 画面でもサーバーでも使うので、ここには他のものを import しない。
 */
const MAX_EMOJIS = 30;

function iconUrl(icon: any): string | null {
  const candidate = Array.isArray(icon?.url) ? icon.url[0] : icon?.url;
  const url = typeof candidate === "string" ? candidate : candidate?.href;
  if (typeof url !== "string") return null;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** tag から絵文字を取り出して、{name,url} のJSON文字列の配列にする（そのまま保存できる形） */
export function buildEmojis(tags: unknown): string[] {
  const list = Array.isArray(tags) ? tags : tags ? [tags] : [];
  const results: string[] = [];
  for (const tag of list) {
    if (results.length >= MAX_EMOJIS) break;
    if (tag?.type !== "Emoji" || typeof tag.name !== "string") continue;
    const name = tag.name.replace(/^:|:$/g, "");
    if (!/^[A-Za-z0-9_+-]{1,64}$/.test(name)) continue;
    const url = iconUrl(tag.icon);
    if (url) results.push(JSON.stringify({ name, url }));
  }
  return results;
}

/** buildEmojis の結果を、名前 → URL の表にする */
export function emojiMap(emojis?: string[] | null): Map<string, string> {
  const map = new Map<string, string>();
  for (const raw of emojis ?? []) {
    try {
      const { name, url } = JSON.parse(raw);
      if (typeof name === "string" && typeof url === "string") map.set(name, url);
    } catch {}
  }
  return map;
}
