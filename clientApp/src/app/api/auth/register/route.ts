/**
 * ユーザー登録APIエンドポイント！✨
 * preferredUsername（アルファベットのみ）とdisplayName（日本語/絵文字対応）をキラキラ登録！💖
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/appwrite/serverConfig";
import { createActor } from "@/lib/appwrite/database";
import { Errors } from "@/lib/activitypub/errors";
import { Query } from "node-appwrite";
import sanitizeHtml from "sanitize-html";
import { ID } from "node-appwrite";

/**
 * 登録入力のスキーマ！💎
 * preferredUsernameはアルファベットのみ、displayNameは日本語/絵文字OK！✨
 */
const RegisterSchema = z.object({
  email: z.string().email({ message: Errors.InvalidInput("メールアドレス") }),
  password: z.string().min(8, { message: Errors.InvalidInput("パスワードは8文字以上") }),
  preferredUsername: z
    .string()
    .min(3, { message: Errors.InvalidInput("ユーザー名は3文字以上") })
    .max(20, { message: Errors.InvalidInput("ユーザー名は20文字以内") })
    .regex(/^[a-zA-Z]+$/, { message: Errors.InvalidInput("ユーザー名はアルファベットのみ") }),
  displayName: z
    .string()
    .min(1, { message: Errors.InvalidInput("表示名を入力してね") })
    .max(100, { message: Errors.InvalidInput("表示名は100文字以内") }),
});

/**
 * POSTハンドラ：新しいユーザーとアクターを作成！🌟
 * @param req リクエスト（JSON：email, password, preferredUsername, displayName）
 * @returns 登録結果（201）またはエラー（400/409）
 */
export async function POST(req: NextRequest) {
  try {
    const { account, databases } = await createAdminClient();

    // リクエストボディをパース
    const input = await req.json();
    const { email, password, preferredUsername, displayName } = RegisterSchema.parse(input);

    // displayNameをサニタイズ
    const sanitizedDisplayName = sanitizeHtml(displayName, {
      allowedTags: [],
      allowedAttributes: {},
    });
    if (!sanitizedDisplayName) {
      return NextResponse.json(
        { error: Errors.InvalidInput("表示名に無効な内容が含まれてるよ！💦") },
        { status: 400 }
      );
    }

    // preferredUsernameのユニークチェック
    const { documents } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, [
      Query.equal("preferredUsername", preferredUsername),
    ]);
    if (documents.length > 0) {
      return NextResponse.json(
        { error: Errors.InvalidInput("このユーザー名はすでに使われてるよ！別の名前を試してね！💦") },
        { status: 409 }
      );
    }

    // ユーザー作成
    const user = await account.create(ID.unique(), email, password,preferredUsername);
    //console.log("User created:", { userId: user.$id, email });
    // セッション作成

    // アクター作成とセッション作成
    const actor = await createActor(user.$id, preferredUsername, sanitizedDisplayName,email,password);
    //console.log("Actor created:", { actorId: actor.$id, preferredUsername });

    // 成功レスポンス
    return NextResponse.json(
      { message: "登録成功！キラキラなSNSへようこそ！✨", actor },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Register error:", {
      message: err.message,
      code: err.code,
      type: err.type,
      stack: err.stack,
    });

    // Appwriteのエラー処理
    if (err.code === 409) {
      return NextResponse.json(
        { error: Errors.InvalidInput("このメールアドレスはすでに登録済みだよ！💦") },
        { status: 409 }
      );
    }
    if (err.code === 403) {
      return NextResponse.json(
        { error: Errors.RegistrationFailed + " 権限エラーだよ！管理者に連絡してね！💦" },
        { status: 403 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: Errors.RegistrationFailed }, { status: 400 });
  }
}