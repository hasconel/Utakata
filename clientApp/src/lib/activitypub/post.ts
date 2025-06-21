/**
 * 投稿機能のコアロジック！✨
 * バリデーション、データベース保存、ActivityPub配信をキラキラに処理！💖
 * モジュラー化でメンテナンスしやすく、コメントで各ステップを解説！🚀
 */
import { z } from "zod";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { Query, Role } from "node-appwrite";
import { createNote, fetchActorInbox } from "@/lib/activitypub/utils";
import { signRequest } from "@/lib/activitypub/crypto";
import { Errors } from "@/lib/activitypub/errors";
import sanitizeHtml from "sanitize-html";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ID, Permission } from "node-appwrite";
import { MeiliSearch } from "meilisearch";
import { getActorByUserId, getActorById } from "@/lib/appwrite/database";

const meilisearch = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!,
});

/**
 * 投稿入力のスキーマ！💎
 * zodで厳格にバリデーション、ギャル風エラーで親しみやすく！💦
 */
const PostSchema = z.object({
  content: z.string().min(1, Errors.InvalidInput("コンテンツ")).max(500, Errors.InvalidInput("コンテンツは500文字以内")),
  visibility: z.enum(["public", "followers"], { errorMap: () => ({ message: Errors.InvalidInput("公開範囲") }) }),
  inReplyTo: z.string().optional(),
});

/**
 * 投稿入力の型！型安全でキラキラ！✨
 */
export interface PostInput {
  content: string;
  visibility: "public" | "followers";
  inReplyTo?: string;
}

/**
 * 入力バリデーション！🔍
 * @param input クライアントからの入力（JSON）
 * @returns 検証済みのPostInput
 * @throws ZodError 無効な入力でエラー（Errors.InvalidInput）
 */
export async function validatePostInput(input: unknown): Promise<PostInput> {
  return PostSchema.parse(input);
}

/**
 * 投稿をデータベースに保存！📝
 * Note生成、リプライ処理、保存を一括でキラキラ処理！✨
 * @param input 検証済みの投稿入力
 * @param actor 投稿者の情報（actorId, preferredUsername, displayName, followers）
 * @param images 画像の情報（任意）
 * @returns 保存したドキュメント、ActivityPubアクティビティ、親投稿者のID
 * @throws Error データベースエラー
 */
export async function savePost(
  input: PostInput,
  actor: { actorId: string; preferredUsername: string; displayName: string; followers: string[] ,avatarUrl:string},
  images: ActivityPubImage[] = []
) {
  // NoteとCreateアクティビティを生成（utils.tsで定義）
  const uniqueID = require("node-appwrite").ID.unique();
  const { note, activity } = await createNote(uniqueID, actor.actorId, input.content, input.visibility, actor.followers, input.inReplyTo);

  // 画像を追加
  if (images.length > 0) {
    note.attachment = images;
  }
  const imagesArray = images.map(image => JSON.stringify(image));
  const { databases, account } = await createSessionClient();
  const session = await account.get();
  // リプライの場合、親投稿のreplyCountを更新
  let parentActorId: string | null = null;
  if (input.inReplyTo) {
    const { documents } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!, [
      Query.equal("activityId", input.inReplyTo),
    ]);
    const parentPost = documents[0];
    if (parentPost) {
      await databases.updateDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!, parentPost.$id, {
        replyCount: (parentPost.replyCount || 0) + 1,
      });
      parentActorId = await databases.getDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, parentPost.$id).then(res=>res.attributedTo);
      // parentActorIdがnullでない場合のみccに追加（型安全）
      if (parentActorId) {
        activity.cc = Array.isArray(activity.cc) ? [...activity.cc, parentActorId] : [activity.cc, parentActorId].filter((id): id is string => id !== null);
        // リプライ通知を作成
        await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
          ID.unique(),
          {
            type: "reply",
            from: actor.actorId,
            to: parentActorId,
            target: note.id,
            message: `${actor.displayName}さんがあなたの投稿にリプライしました！`,
            read: false
          }
        );
      }
    }
  }

  // toをAppwriteのstring型（100文字以内）に変換
  const toString = Array.isArray(note.to) ? note.to.join(",") : note.to;
  const maxLength = 1000;
  const finalTo = toString.length > maxLength ? (Array.isArray(note.to) ? note.to[0] : note.to) : toString;

  // ccをAppwriteのstring[]型に変換、各要素を100文字以内に制限
  const ccArray = Array.isArray(note.cc) ? note.cc : note.cc ? [note.cc] : [];
  const finalCc = ccArray.filter(id => id.length <= maxLength);

  // displayNameをサニタイズ（XSS対策）
  const sanitizedDisplayName = sanitizeHtml(actor.displayName, {
    allowedTags: [],
    allowedAttributes: {},
  });
  // 投稿をAppwriteに保存
  const permission = (visibility:string)=>{
    if(visibility === "public"){
      return [
        Permission.read(Role.any()),
        Permission.update(Role.user(session.$id)),
        Permission.delete(Role.user(session.$id)),
      ];
    }else{
      return [
        Permission.read(Role.users()),
        Permission.update(Role.user(session.$id)),
        Permission.delete(Role.user(session.$id)),
      ];
    }
  }
  const userdocument = await databases.createDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, uniqueID, {
    content: input.content,
    username: sanitizedDisplayName,
    activityId: note.id,
    to: finalTo,
    cc: finalCc,
    published: note.published,
    inReplyTo: input.inReplyTo || null,
    attributedTo: actor.actorId,
    attachment: imagesArray,
    avatar: actor.avatarUrl,
  },[
    ...permission(input.visibility),
  ]);
  const subdocument = await databases.createDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!, uniqueID, {
    activityId: note.id,
    LikedActors: [],
    replyCount: 0,
  },[
    Permission.read(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.user(session.$id)),
  ]);
  const document = {
    $id: userdocument.$id,
    $createdAt: userdocument.$createdAt,
    $updatedAt: userdocument.$updatedAt,
    content: userdocument.content,
    username: userdocument.username,
    activityId: userdocument.activityId,
    to: userdocument.to,
    cc: userdocument.cc,
    published: userdocument.published,
    inReplyTo: userdocument.inReplyTo,
    attributedTo: userdocument.attributedTo,
    attachment: userdocument.attachment,
    avatar: userdocument.avatar,
    LikedActors: subdocument.LikedActors,
    replyCount: subdocument.replyCount,
  };
  // メイリスケのインデックスに追加
  meilisearch.index("posts").addDocuments([document]);
  return { document, activity, parentActorId };
}

/**
 * ActivityPubアクティビティをフォロワーとリプライ親に配信！📬
 * リトライ付きでエラー耐性バッチリ！💪
 * @param activity Createアクティビティ
 * @param actor 投稿者の情報（actorId, privateKey, followers）
 * @param parentActorId リプライの親投稿者ID（null可）
 * @throws Error 配信失敗（ログのみ、メイン処理は続行）
 */
export async function deliverActivity(
  activity: any,
  actor: { actorId: string; privateKey: string; followers: string[] },
  parentActorId: string | null
) {
  // 配信先inboxを収集
  const inboxes = new Set<string>();
  for (const follower of actor.followers) {
    const inbox = await fetchActorInbox(follower);
    if (inbox) inboxes.add(inbox);
  }
  if (parentActorId) {
    const inbox = await fetchActorInbox(parentActorId);
    if (inbox) inboxes.add(inbox);
  }

  // 並列配信、リトライ3回で安定性UP
  await Promise.all(
    Array.from(inboxes).map(async (inbox) => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { headers } = await signRequest(inbox, activity, actor.privateKey, `${actor.actorId}#main-key`);
          await fetch(inbox, {
            method: "POST",
            headers,
            body: JSON.stringify(activity),
          });
          return;
        } catch (err: any) {
          console.error(`Attempt ${attempt} failed for ${inbox}:`, err.message);
          if (attempt === 3) {
            console.error(Errors.DeliveryFailed(inbox));
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    })
  );
}

/**
 * 投稿を作成する関数！✨
 * @param input 投稿の入力値
 * @returns 投稿の結果
 */
export async function createPost(input: PostInput) {
  const { account } = await createSessionClient();
  const user = await account.get();
  if (!user) {
    throw new Error("ユーザーが見つからないよ！💦");
  }

  const actor = await getActorByUserId(user.$id);
  if (!actor) {
    throw new Error("アクターが見つからないよ！💦");
  }

  const { document, activity, parentActorId } = await savePost(
    input,
    {
      actorId: actor.actorId,
      preferredUsername: actor.preferredUsername,
      displayName: actor.displayName || "",
      followers: actor.followers || [],
      avatarUrl: actor.avatarUrl || "",
    }
  );

  await deliverActivity(activity, {
    actorId: actor.actorId,
    privateKey: actor.privateKey,
    followers: actor.followers || [],
  }, parentActorId);

  return document;
}

/**
 * 投稿を削除する関数！✨
 * @param postId 投稿のID
 * @returns 削除の結果
 */
export async function deletePost(postId: string) {
  const { databases } = await createSessionClient();
  const post = await databases.getDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, postId);
  if(!post){
    throw new Error("投稿が見つからないよ！💦");
  }
  const actor = await getActorById(post.attributedTo);
  if(!actor){
    throw new Error("アクターが見つからないよ！💦");
  }
  const activity = {
    type: "Delete",
    id: `https://${process.env.NEXT_PUBLIC_DOMAIN}/posts/${postId}#delete`,
    actor: actor.actorId,
    to:["https://www.w3.org/ns/activitystreams#Public"],
    cc:[post.cc],
    published: new Date().toISOString(),
    object: {
      id: `https://${process.env.NEXT_PUBLIC_DOMAIN}/posts/${postId}`,
      url: `https://${process.env.NEXT_PUBLIC_DOMAIN}/posts/${postId}`,
      type:"Tombstone",
    }
  }
  await deliverActivity(activity, {
    actorId: actor.actorId,
    privateKey: actor.publicKey,
    followers: actor.followers || [],
  }, null);
  await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, postId);
}
