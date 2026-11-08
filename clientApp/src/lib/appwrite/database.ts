/**
 * Appwriteデータベース操作！✨
 * actorsコレクションからデータをキラキラ取得！💖
 */
"use server"
import { createSessionClient,createAdminClient } from "./serverConfig";
import { Query,Models } from "node-appwrite";
import {z} from "zod"
import { ActivityPubActor } from "@/types/activitypub";
/**
 * ユーザーIDからアクターを取得！🔍
 * @param userId AppwriteのユーザーID
 * @returns Actorオブジェクト（見つからない場合はnull）
 * @throws Error データベースエラー
 */
/**
 * Actorスキーマ（zod）！💎
 * 型安全にドキュメントを検証！✨
 */

const ActorSchema = z.object({
    $id: z.string(),
    actorId: z.string(),
    preferredUsername: z.string(),
    displayName: z.string().optional(), // 既存データ対応
    followers: z.string().optional(),
    userId: z.string(),
    mutedUsers: z.array(z.string()).optional(),
    following: z.string().optional(),
    avatarUrl: z.string().optional(),
    bio: z.string().optional(),
    backgroundUrl: z.string().optional(),
  });
  
  /**
   * 型ガード：DocumentがActorかチェック！🔍
   * @param doc Appwriteのドキュメント
   * @returns docがActor型かどうか
   */
  export async function isActor(doc: Models.Document): Promise<boolean> {
    const result = ActorSchema.safeParse(doc);
    return result.success;
  }
/**
 * ユーザーIDから preferredUsername のみ取得（管理者クライアント使用・Edge 用 API から呼ぶ用）！🔍
 * middleware は Edge のため crypto を読めないので、この関数を API 経由で使うよ！✨
 */
export async function getPreferredUsernameByUserId(userId: string): Promise<string | null> {
  try {
    const { databases } = await createAdminClient();
    const { documents } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      [Query.equal("userId", userId)]
    );
    if (documents.length === 0) return null;
    if (documents.length > 1) throw new Error("アクターが複数見つかったよ！💦");
    return (documents[0] as { preferredUsername?: string }).preferredUsername ?? null;
  } catch {
    return null;
  }
}

/**
 * ユーザーIDからアクターを取得！🔍
 * @param userId AppwriteのユーザーID
 * @returns Actorオブジェクト（見つからない場合はnull）
 * @throws Error データベースエラー
 */
  export async function getActorByUserId(userId: string): Promise<ActivityPubActor | null> {
    try {
        // 返すのは外のサーバーにも見せる公開の項目だけ。外のサーバー（ログインなし）からも呼ばれるので管理者で読む
        const {databases} = await createAdminClient();
      // actorsコレクションからuserIdで検索
      const { documents } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, [
        Query.equal("userId", userId),
      ]);
      if (documents.length === 0) {
        return null;
      }else if (documents.length > 1) {
        throw new Error("アクターが複数見つかったよ！💦");
      }
      const doc = documents[0];
      // actors_subコレクションから$idで検索
      const { documents: actorSubs } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!, [
        Query.equal("$id", [doc.$id]),
      ]);
      if (!actorSubs) {
        throw new Error("サブアクターの取得に失敗したよ！💦");
      }
      // ドキュメントが存在する場合、Actor型に変換
      
        // Actor型に変換（型ガードで安全）
        const actor: ActivityPubActor = {
          "@context": ["https://www.w3.org/ns/activitystreams"],
          type: "Person",
          id: doc.actorId,
          preferredUsername: doc.preferredUsername,
          displayName: doc.displayName || doc.preferredUsername, // 移行用
          inbox: doc.inbox,
          outbox: doc.outbox,
          following: doc.following || doc.actorId + "/following",
          followers: doc.followers || doc.actorId + "/followers",
          publicKey: {
            id: doc.actorId + "#main-key",
            owner: doc.actorId,
            publicKeyPem: doc.publicKey,
          },
          icon: {
            type: "Image",
            url: doc.avatarUrl || "",
          },
          image: {
            type: "Image",
            url: doc.backgroundUrl || "",
          },
          summary: doc.bio || "",
        } as ActivityPubActor;
  
        return actor;
      
  
      
    } catch (err: any) {
      console.error("getActorByUserId error:", err.message);
      throw new Error(err.message || "アクター取得に失敗したよ！💦");
    }
  }
  

/**
 * アクターIDからアクターを取得！🔍
 * @param actorId アクターID
 * @returns ActivityPubActorオブジェクト（見つからない場合はnull）
 * @throws Error データベースエラー
 */
export async function getActorById(actorId: string): Promise<ActivityPubActor | null> {
  // getActorByUserId と同じく、公開の項目だけを返すので管理者で読む
  const {databases} = await createAdminClient();
  const {documents} = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    [Query.equal("actorId", [actorId])]
  );
  //console.log("actorId", actorId);

  if (documents.length > 1) {
    throw new Error("アクターが複数見つかったよ！💦");
  }
  if (documents.length === 0) {
    return null;
  }

  const doc = documents[0];
  if (!isActor(doc)) {
    throw new Error("サブアクターの取得に失敗したよ！💦");
  }
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: doc.actorId,
    type: "Person",
    preferredUsername: doc.preferredUsername,
    name: doc.displayName,
    followers: doc.actorId + "/followers",
    inbox: doc.inbox,
    outbox: doc.outbox,
    following: doc.actorId + "/following",
    publicKey: doc.publicKey,
    privateKey: {
      id: `${doc.actorId}#main-key`,
      type: "Key",
      owner: doc.actorId,
      publicKeyPem: doc.publicKey,
    },
    icon: {
      type: "Image",
      url: doc.avatarUrl,
    },
    image: {
      type: "Image",
      url: doc.backgroundUrl,
    },
    summary: doc.bio,
    url: doc.actorId,
  } as ActivityPubActor;  
}


/**
 * アクターのミュートリストを取得！🔍
 * 
 * @returns ミュートリスト
 */
export async function getMutedUsers(): Promise<string[]> {
  const {databases,account} = await createSessionClient();
  const userId = await account.get();
  if(!userId){
    throw new Error("ユーザーが見つからないよ！💦");
  }
  // getDocument はドキュメントそのものを返す（documents ではない）
  const actor = await databases.getDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    userId.$id
  );
  // 以前のバグで空文字が入っていることがあるので除く
  return ((actor.mutedUsers as string[] | undefined) || []).filter(Boolean);
}