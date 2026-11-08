/**
 * 公開の投稿かどうか🫧
 * to と cc のどちらかに Public があれば公開として扱う
 * （Mastodon などの「未収載」は cc に Public が入る）。
 * 外のサーバーは短い書き方（as:Public / Public）で送ってくることもある。
 */
export const PUBLIC_COLLECTION = "https://www.w3.org/ns/activitystreams#Public";
export const PUBLIC_COLLECTIONS = [PUBLIC_COLLECTION, "as:Public", "Public"];

type Audience = string | string[] | null | undefined;

const list = (value: Audience): string[] => (Array.isArray(value) ? value : typeof value === "string" ? [value] : []);

export function isPublicAudience(to: Audience, cc?: Audience): boolean {
  return [...list(to), ...list(cc)].some((recipient) => PUBLIC_COLLECTIONS.includes(recipient));
}
