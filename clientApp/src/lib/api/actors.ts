import { ActivityPubActor } from "@/types/activitypub";

/** ユーザーをまとめて読む（/api/actors）。読めなかった人は入らない */
export async function fetchActors(ids: string[]): Promise<ActivityPubActor[]> {
  if (ids.length === 0) return [];
  const url = new URL("/api/actors", window.location.origin);
  for (const id of ids) url.searchParams.append("id", id);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()).actors ?? [];
}
