/**
 * Appwriteデータベース操作！✨
 * actorsコレクションからデータをキラキラ取得！💖
 */
"use server"
import { createSessionClient,createAdminClient } from "./serverConfig";
import { Query,Models,Permission,Role } from "node-appwrite";
import { generateKeyPairSync } from "crypto";
import { Errors } from "../activitypub/errors";
import {z} from "zod"
import { cookies } from "next/headers";
import { createCipheriv, randomBytes, createDecipheriv } from "crypto";
import { Actor } from "@/types/appwrite";
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

const ENCRYPTION_KEY = Buffer.from(process.env.APPWRITE_ENCRYPTION_KEY!, "hex");
const IV_LENGTH = 16;

/**
 * 登録スキーマ！💎
 * 入力の安全性をキラキラ検証！✨
const SignUpSchema = z.object({
  email: z.string().email({ message: Errors.InvalidInput("メールアドレス") }),
  password: z.string().min(8, { message: Errors.InvalidInput("パスワードは8文字以上") }),
  username: z
    .string()
    .min(3, { message: Errors.InvalidInput("ユーザー名は3文字以上") })
    .max(20, { message: Errors.InvalidInput("ユーザー名は20文字以内") })
    .regex(/^[a-zA-Z]+$/, { message: Errors.InvalidInput("ユーザー名はアルファベットのみ") }),
  displayName: z
    .string()
    .min(1, { message: Errors.InvalidInput("表示名を入力してね") })
    .max(100, { message: Errors.InvalidInput("表示名は100文字以内") }),
});
 */

/**
 * 暗号化（AES-256-GCM）！🔒
 * 秘密鍵をキラキラ安全に保存！✨
 */
function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/**
 * 復号化（AES-256-GCM）！🔒
 * 秘密鍵をキラキラ安全に復号化！✨
 * @param text 暗号化されたテキスト
 * @returns 復号化されたテキスト
 */
export async function decrypt(text: string): Promise<string> {
  const [iv, encrypted, authTag] = text.split(":");
  const decipher = createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
}

const ActorSchema = z.object({
    $id: z.string(),
    actorId: z.string(),
    preferredUsername: z.string(),
    displayName: z.string().optional(), // 既存データ対応
    followers: z.string().optional(),
    privateKey: z.string(),
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
   * ユーザーIDからアクターを取得！🔍
   * @param userId AppwriteのユーザーID
   * @returns Actorオブジェクト（見つからない場合はnull）
   * @throws Error データベースエラー
   */
  export async function getActorByUserId(userId: string): Promise<ActivityPubActor | null> {
    try {
        const {databases} = await createSessionClient();
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
 * 新しいアクターを作成！🌟
 * preferredUsernameはアルファベットのみ、displayNameで日本語/絵文字対応！✨
 * @param userId AppwriteのユーザーID
 * @param preferredUsername アルファベットのみのユーザー名（URI用）
 * @param displayName 表示名（日本語、絵文字対応）
 * @returns 作成したActorオブジェクト
 * @throws Error ユニーク制約違反やデータベースエラー
 */
export async function createActor(userId: string, preferredUsername: string, displayName: string,email:string,password:string): Promise<Actor> {
  try {
    const {databases,account} = await createAdminClient();
    // 鍵ペア生成
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    // セッション作成
    const session = await account.createEmailPasswordSession(email, password);

    // プライベートキー暗号化
    const encryptPrivateKey = encrypt(privateKey);

    // アクター作成
    const actor  = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      userId,
      {
        userId: userId,
        preferredUsername,
        displayName: displayName,
        actorId: `${process.env.APPWRITE_DOMAIN}/users/${userId}`,
        inbox: `${process.env.APPWRITE_DOMAIN}/users/${userId}/inbox`,
        outbox: `${process.env.APPWRITE_DOMAIN}/users/${userId}/outbox`,
        publicKey:publicKey,
        privateKey: encryptPrivateKey,
        following: `${process.env.APPWRITE_DOMAIN}/users/${userId}/following`,
        followers: `${process.env.APPWRITE_DOMAIN}/users/${userId}/followers`,
        avatarUrl: ``,
        bio: "",
      },
      [
        Permission.read(Role.users()),
        Permission.write(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    )
     await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
      actor.$id,
      {
        id: actor.actorId,
        followersCount: 0,
        followingCount: 0,
      }
    );

    // セッションクッキー保存
    (await cookies()).set("my-custom-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    // クライアントに返す
    return actor as Actor;
  } catch (err: any) {
    console.error("SignUp error:", {
      message: err.message,
      code: err.code,
      type: err.type,
      stack: err.stack,
    });

    if (err.code === 409) {
      throw new Error(Errors.InvalidInput("このメールアドレスはすでに登録済みだよ！💦"));
    }
    if (err.code === 403) {
      throw new Error(Errors.RegistrationFailed + " 権限エラーだよ！管理者に連絡してね！💦");
    }
    if (err instanceof z.ZodError) {
      throw new Error(err.issues.map((e) => e.message).join(", "));
    }

    throw new Error(Errors.RegistrationFailed);
  }
}

/**
 * アクターIDからアクターを取得！🔍
 * @param actorId アクターID
 * @returns ActivityPubActorオブジェクト（見つからない場合はnull）
 * @throws Error データベースエラー
 */
export async function getActorById(actorId: string): Promise<ActivityPubActor | null> {
  const {databases} = await createSessionClient();
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
 * アクターIDからアクターを取得！🔍
 * @param preferredUsername アクターID
 * @returns Actorオブジェクト（見つからない場合はnull）
 * @throws Error データベースエラー
 */
export async function getActorByPreferredUsername(preferredUsername: string): Promise<ActivityPubActor | null> {
  const {databases} = await createSessionClient();
  const {documents} = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    [Query.equal("preferredUsername", [preferredUsername])]
  );
  //console.log("actorId", actorId);

  if (documents.length > 1) {
    throw new Error("アクターが複数見つかったよ！💦");
  }
  if (documents.length === 0) {
    return null;
  }

  const doc = documents[0];
  const actorSubs = await databases.getDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!, doc.$id);
  if(!actorSubs){
    throw new Error("サブアクターの取得に失敗したよ！💦");
  }
  if (!isActor(doc)) {
    throw new Error("サブアクターの取得に失敗したよ！💦");
  }
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    type: "Person",
    id: doc.actorId,
    preferredUsername: doc.preferredUsername,
    displayName: doc.displayName,
    followers: doc.actorId + "/followers",
    inbox: doc.inbox,
    outbox: doc.outbox,
    following: doc.following || `${process.env.NEXT_PUBLIC_DOMAIN}/users/${doc.preferredUsername}/following`,
    publicKey: {
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
  const {documents} : Actor = await databases.getDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    userId.$id
  );
  return documents.mutedUsers || [];
}