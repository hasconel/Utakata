/**
 * 投稿機能のコアロジック！✨
 * バリデーション、データベース保存、ActivityPub配信をキラキラに処理！💖
 * モジュラー化でメンテナンスしやすく、コメントで各ステップを解説！🚀
 */
import { z } from "zod";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { Query, Role } from "node-appwrite";
import { createNote, getFollowers } from "@/lib/activitypub/utils";
import { fetchRemoteActor } from "@/lib/activitypub/remoteActor";
import { isInternalUrl } from "@/lib/utils";
import { signRequest } from "@/lib/activitypub/crypto";
import { getEncryptedPrivateKey } from "@/lib/activitypub/privateKeyStore";
import { Errors } from "@/lib/activitypub/errors";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { Permission } from "node-appwrite";
import { addPostToIndex, removePostFromIndex } from "@/lib/search/meili";
  import {  getActorById } from "@/lib/appwrite/database";
import { Databases } from "node-appwrite";


/**
 * 投稿入力のスキーマ！💎
 * zodで厳格にバリデーション、ギャル風エラーで親しみやすく！💦
 */
/** 添付は、このサーバーにアップロードしたファイルだけ。説明文（name）は他のサーバーで alt として使われる */
const ImageSchema = z.object({
  type: z.enum(["Image", "Video", "Audio"]),
  mediaType: z.string().max(100),
  url: z.string().refine((url) => url.startsWith(`${process.env.NEXT_PUBLIC_DOMAIN}/files/`), "添付のURLが正しくないよ"),
  name: z.string().max(1500).default(""),
  width: z.number().int().min(0).max(100000).optional(),
  height: z.number().int().min(0).max(100000).optional(),
  blurhash: z.string().max(100).optional(),
});

const PostSchema = z
  .object({
    content: z.string().max(500, Errors.InvalidInput("コンテンツは500文字以内")),
    visibility: z.enum(["public", "followers"]),
    inReplyTo: z.object({ id: z.string().url(), to: z.string().url() }).optional(),
    images: z.array(ImageSchema).max(4).default([]),
  })
  // 本文が空でも、画像があれば投稿できる
  .refine((input) => input.content.trim().length > 0 || input.images.length > 0, Errors.InvalidInput("コンテンツ"));

/**
 * 投稿入力の型！型安全でキラキラ！✨
 */
export interface PostInput {
  content: string;
  visibility: "public" | "followers";
  inReplyTo?: { id: string; to: string };
  attributedTo?: string;
}

/**
 * 入力バリデーション！🔍
 * @param input クライアントからの入力（JSON）
 * @returns 検証済みのPostInput
 * @throws ZodError 無効な入力でエラー（Errors.InvalidInput）
 */
export function validatePostInput(input: unknown): PostInput & { images: ActivityPubImage[] } {
  return PostSchema.parse(input) as PostInput & { images: ActivityPubImage[] };
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
  actor: { userId: string;},
  images: ActivityPubImage[] = [],
  databases: Databases
) {
  // NoteとCreateアクティビティを生成（utils.tsで定義）
  const actorId = process.env.NEXT_PUBLIC_DOMAIN!+"/users/"+actor.userId;
  const uniqueID = require("node-appwrite").ID.unique();
  const { note, activity } = await createNote(uniqueID, actorId, input.content, input.visibility,  input.inReplyTo?.id, input.inReplyTo?.to);

  // 画像を追加
  if (images.length > 0) {
    note.attachment = images;
  }
  const imagesArray = images.map(image => JSON.stringify(image));
  const session = actor.userId;
  if(!session){
    throw new Error("セッションが見つからないよ！💦");
  }

  const finalTo = Array.isArray(note.to) ? note.to : note.to ? [note.to] : [];

  const finalCc = Array.isArray(note.cc) ? note.cc : note.cc ? [note.cc] : [];

  // 投稿をAppwriteに保存
  const permission = (visibility:string)=>{
    if(visibility === "public"){
      return [
        Permission.read(Role.any()),
        Permission.update(Role.user(session)),
        Permission.delete(Role.user(session)),
      ];
    }else{
      return [
        Permission.read(Role.users()),
        Permission.update(Role.user(session)),
        Permission.delete(Role.user(session)),
      ];
    }
  }
  const userdocument = await databases.createDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, uniqueID, {
    content: input.content,
    username: process.env.NEXT_PUBLIC_DOMAIN!+"/users/"+actor.userId,
    activityId: note.id,
    to: finalTo,
    cc: finalCc,
    published: note.published,
    inReplyTo: input.inReplyTo?.id || null,
    attributedTo: process.env.NEXT_PUBLIC_DOMAIN!+"/users/"+actor.userId,
    attachment: imagesArray,
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
    Permission.delete(Role.user(session)),
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
  // 検索インデックスに追加（以前は await していなかったので、追加されないことがあった）
  await addPostToIndex(userdocument);
  return { document, activity };
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
  actor: { id: string; privateKey: string; followers: string }
) {
  // 配信先inboxを収集
  const inboxes = new Set<string>();
  const signerUserId = actor.id.split("/").pop();
  const fetchActorInbox = async (actorId: string): Promise<string | null> => {
    if(isInternalUrl(actorId)) return `${actorId}/inbox`;
    const remoteActor = await fetchRemoteActor(actorId, signerUserId);
    return typeof remoteActor?.inbox === "string" ? remoteActor.inbox : null;
  };
  const userFollwer = async ()=>{
    const followers = await getFollowers(actor.followers);
    for (const follower of followers) {
      const inbox = await fetchActorInbox(follower);
      //followerはuser/followerでアクセスするとページが表示される。
      if (inbox) inboxes.add(inbox);
    }
  }
  for (const to of activity.to){
    if(to === actor.followers) await userFollwer();
    else if(to === "https://www.w3.org/ns/activitystreams#Public") continue;
    else{
      const inbox = await fetchActorInbox(to);
      if (inbox) inboxes.add(inbox);
    }
  }
  //console.log("activity.cc", activity.cc);
  for (const cc of activity.cc){
    if(cc === actor.followers) await userFollwer();
    else if(cc === "https://www.w3.org/ns/activitystreams#Public") continue;
    else{
      const inbox = await fetchActorInbox(cc);
      if (inbox) inboxes.add(inbox);
    }
  }
  // 並列配信、リトライ3回で安定性UP
  await Promise.all(
    Array.from(inboxes).map(async (inbox) => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          //console.log("inboxに送信します",inbox);
          const { headers } = await signRequest(inbox, activity, actor.privateKey, `${actor.id}#main-key`);
          // inboxはフルURL
          const res = await fetch(`${inbox}`, {
            method: "POST",
            headers,
            body: JSON.stringify(activity),
          });
          if(res.status === 200){
            //console.log("配信成功");
          }else{
            //console.log("配信失敗");
          }
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
 * 投稿を削除する関数！✨
 * @param postId 投稿のID
 * @returns 削除の結果
 */
export async function deletePostOutbox(postId: string) {
  const { databases, account } = await createSessionClient();
  const session = await account.get();
  const {documents: post} = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, [Query.equal("activityId", postId)]);
  const {documents: postsub} = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!, [Query.equal("activityId", postId)]);
  if(post.length === 0){
    throw new Error("投稿が見つからないよ！💦");
  }
  // 消せるのは自分の投稿だけ。Delete は投稿者の鍵で署名して配信するので、配信する前に確かめる
  // （以前はドキュメントの削除権限に任せていたので、他人の投稿でも Delete だけは配信されてしまっていた）
  if(post[0].attributedTo !== `${process.env.NEXT_PUBLIC_DOMAIN}/users/${session.$id}`){
    throw new Error("自分の投稿じゃないよ！💦");
  }
  const actor = await getActorById(post[0].attributedTo);
  if(!actor){
    throw new Error("アクターが見つからないよ！💦");
  }
  const{documents: user} = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, [Query.equal("actorId", actor.id)]);
  if(!user){
    throw new Error("公開鍵が見つからないよ！💦");
  }
  const privateKey = await getEncryptedPrivateKey(user[0].$id);

  const activity = {
    type: "Delete",
    id: `${postId}#delete`,
    actor: actor.id,
    to:["https://www.w3.org/ns/activitystreams#Public"],
    cc:[post[0].cc],
    published: new Date().toISOString(),
    object: {
      id: postId,
      url: postId,
      type:"Tombstone",
    }
  }
  await deliverActivity(activity, {
    id: actor.id,
    privateKey: privateKey,
    followers: actor.followers || "",
  });
  await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_COLLECTION_ID!, post[0].$id);
  await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!, postsub[0].$id);
  await removePostFromIndex(post[0].$id);
}
