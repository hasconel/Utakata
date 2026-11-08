/**
 * 共有したときのプレビュー（OGP）用に、投稿とユーザーの情報を読む。
 * サーバー専用。"use server" は付けない（外から呼べる関数として公開されてしまう）。
 * 見せるのは、ログインしていない人にも見えるもの（公開投稿・ローカルのユーザー）だけ。
 */
import type { Metadata } from "next";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/serverConfig";
import { isPublicDocument } from "@/lib/activitypub/clientNotes";

const env = () => ({
  db: process.env.APPWRITE_DATABASE_ID!,
  posts: process.env.APPWRITE_POSTS_COLLECTION_ID!,
  actors: process.env.APPWRITE_ACTORS_COLLECTION_ID!,
});

const clip = (text: string, max: number) => {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
};

const firstImage = (attachments: unknown): string | undefined => {
  for (const raw of Array.isArray(attachments) ? attachments : []) {
    try {
      const image = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (image?.type === "Image" && typeof image.url === "string" && !image.sensitive) return image.url;
    } catch {}
  }
  return undefined;
};

export async function postMetadata(postId: string): Promise<Metadata> {
  try {
    const { databases } = await createAdminClient();
    const post: any = await databases.getDocument(env().db, env().posts, postId);
    if (!isPublicDocument(post)) return { robots: { index: false } };
    const author: any = await databases.getDocument(env().db, env().actors, post.attributedTo.split("/").pop()).catch(() => null);
    const name = author?.displayName || author?.preferredUsername || "Utakata";
    // 閲覧注意の投稿は、説明文だけを出す
    const text = post.summary ? `⚠ ${post.summary}` : post.content || "";
    const description = clip(text, 120);
    const image = post.summary ? undefined : firstImage(post.attachment);
    const images = image ? [image] : author?.avatarUrl ? [author.avatarUrl] : undefined;
    return {
      title: `${name}「${clip(text, 30)}」`,
      description,
      openGraph: { type: "article", title: name, description, images, publishedTime: post.published },
      twitter: { card: image ? "summary_large_image" : "summary", title: name, description, images },
      alternates: { canonical: `/posts/${postId}` },
    };
  } catch {
    return {};
  }
}

export async function profileMetadata(userParam: string): Promise<Metadata> {
  const handle = decodeURIComponent(userParam).replace(/^@/, "");
  const localHost = new URL(process.env.NEXT_PUBLIC_DOMAIN!).hostname;
  const [name, host] = handle.split("@");
  if (!name || (host && host !== localHost)) return { title: `@${handle}`, robots: { index: false } };
  try {
    const { databases } = await createAdminClient();
    const { documents } = await databases.listDocuments(env().db, env().actors, [Query.equal("preferredUsername", name), Query.limit(1)]);
    const actor: any = documents[0];
    if (!actor) return { title: `@${name}` };
    const displayName = actor.displayName || actor.preferredUsername;
    const description = clip(actor.bio || `@${actor.preferredUsername}`, 120);
    const images = actor.backgroundUrl ? [actor.backgroundUrl] : actor.avatarUrl ? [actor.avatarUrl] : undefined;
    return {
      title: `${displayName} (@${actor.preferredUsername})`,
      description,
      openGraph: { type: "profile", title: displayName, description, images, username: actor.preferredUsername },
      twitter: { card: actor.backgroundUrl ? "summary_large_image" : "summary", title: displayName, description, images },
      alternates: { canonical: `/@${actor.preferredUsername}` },
    };
  } catch {
    return {};
  }
}
