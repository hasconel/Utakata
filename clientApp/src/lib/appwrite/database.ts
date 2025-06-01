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
import { createCipheriv, randomBytes } from "crypto";
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
export interface Actor {
    $id: string;
    actorId: string;
    preferredUsername: string;
    displayName?: string;
    privateKey: string;
    userId: string;
    mutedUsers?: string[];
    following?: string[];
    avatarUrl?: string;
    bio?: string;
    followers?: string[];
  }
  export interface ActorSub extends Models.Document {
    followers?: string[];
    }

const ActorSchema = z.object({
    $id: z.string(),
    actorId: z.string(),
    preferredUsername: z.string(),
    displayName: z.string().optional(), // 既存データ対応
    followers: z.array(z.string()).optional(),
    privateKey: z.string(),
    userId: z.string(),
    mutedUsers: z.array(z.string()).optional(),
    following: z.array(z.string()).optional(),
    avatarUrl: z.string().optional(),
    bio: z.string().optional(),
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
  export async function getActorByUserId(userId: string): Promise<Actor | null> {
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
        const actor: Actor = {
          $id: doc.$id,
          actorId: doc.actorId,
          preferredUsername: doc.preferredUsername,
          displayName: doc.displayName || doc.preferredUsername, // 移行用
          privateKey: doc.privateKey,
          userId: doc.userId,
          mutedUsers: doc.mutedUsers || [],
          following: doc.following || [],
          followers: actorSubs[0].followers || doc.followers || [],
          avatarUrl: doc.avatarUrl || "",
          bio: doc.bio || "",
        };
  
        /*displayNameがない場合、preferredUsernameを保存
        if (!doc.displayName) {
          await databases.updateDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, actor.$id, {
            displayName: actor.preferredUsername,
          });
        }*/
  
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
    const actor : Actor = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_COLLECTION_ID!,
      userId,
      {
        userId: userId,
        preferredUsername,
        displayName: displayName,
        actorId: `https://${process.env.APPWRITE_DOMAIN}/users/${preferredUsername}`,
        inbox: `https://${process.env.APPWRITE_DOMAIN}/users/${preferredUsername}/inbox`,
        outbox: `https://${process.env.APPWRITE_DOMAIN}/users/${preferredUsername}/outbox`,
        publicKey:publicKey,
        privateKey: encryptPrivateKey,
        avatarUrl: ``,
        bio: "",
      },
      [
        Permission.read(Role.users()),
        Permission.write(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    ).then((res) => {
      if (!isActor(res)) {
        throw new Error("アクターの作成に失敗したよ！💦");
      }
      return {
        $id: res.$id,
        actorId: res.actorId,
        preferredUsername: res.preferredUsername,
        displayName: res.displayName,
        followers: res.followers || [],
        privateKey: res.privateKey,
        userId: res.userId,
        mutedUsers: res.mutedUsers || [],
        following: res.following || [],
        avatarUrl: res.avatarUrl || "",
        bio: res.bio || "",
      };
    });
    const actorSub : ActorSub = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
      actor.$id,
      {
        followers: [],
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
    return {
      $id: actor.$id,
      actorId: actor.actorId,
      preferredUsername: actor.preferredUsername,
      displayName: actor.displayName,
      followers: actorSub.followers || [],
      privateKey: actor.privateKey,
      userId: actor.userId,
      mutedUsers: actor.mutedUsers || [],
      following: actor.following || [],
      avatarUrl: actor.avatarUrl || "",
      bio: actor.bio || "",
    } as Actor;
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
      throw new Error(err.errors.map((e) => e.message).join(", "));
    }

    throw new Error(Errors.RegistrationFailed);
  }
}

/**
 * アクターIDからアクターを取得！🔍
 * @param actorId アクターID
 * @returns Actorオブジェクト（見つからない場合はnull）
 * @throws Error データベースエラー
 */
export async function getActorById(actorId: string): Promise<Actor | null> {
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
  const actorSubs = await databases.getDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!, doc.$id);
  if(!actorSubs){
    throw new Error("サブアクターの取得に失敗したよ！💦");
  }
  if (!isActor(doc)) {
    throw new Error("サブアクターの取得に失敗したよ！💦");
  }
  return {
    $id: doc.$id,
    actorId: doc.actorId,
    preferredUsername: doc.preferredUsername,
    displayName: doc.displayName,
    followers: actorSubs.followers,
    privateKey: doc.privateKey,
    userId: doc.userId,
    mutedUsers: doc.mutedUsers || [],
    following: doc.following || [],
    avatarUrl: doc.avatarUrl,
    bio: doc.bio,
  } as Actor;
}