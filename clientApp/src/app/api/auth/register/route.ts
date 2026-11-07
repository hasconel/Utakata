/**
 * ユーザー登録API！🫧
 * POST /api/auth/register  { email, password, preferredUsername, displayName }
 *   → 201 { message, loggedIn }  /  4xx { error }
 *
 * ・ユーザー名は小文字にそろえて保存する（Alice と alice を別人として作れないように）
 * ・途中で失敗したら、作りかけのユーザーやアクターを消す（もう一度登録できるように）
 * ・同じIPからの登録は1時間に5回まで（簡易。本命は Cloudflare のレート制限）
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ID, Query } from "node-appwrite";
import sanitizeHtml from "sanitize-html";
import { createAdminClient } from "@/lib/appwrite/serverConfig";
import { Errors } from "@/lib/activitypub/errors";
import { createActorForUser, rollbackRegistration } from "@/lib/auth/registerActor";
import { setSessionCookie } from "@/lib/auth/sessionCookie";
import { clientIp, hitRateLimit } from "@/lib/auth/rateLimit";

const RegisterSchema = z.object({
  email: z.string().trim().email({ message: Errors.InvalidInput("メールアドレス") }),
  password: z
    .string()
    .min(8, { message: Errors.InvalidInput("パスワードは8文字以上") })
    .max(256, { message: Errors.InvalidInput("パスワードは256文字以内") }),
  preferredUsername: z
    .string()
    .trim()
    .min(3, { message: Errors.InvalidInput("ユーザー名は3文字以上") })
    .max(20, { message: Errors.InvalidInput("ユーザー名は20文字以内") })
    .regex(/^[a-zA-Z]+$/, { message: Errors.InvalidInput("ユーザー名はアルファベットのみ") })
    .transform((name) => name.toLowerCase()),
  displayName: z
    .string()
    .trim()
    .min(1, { message: Errors.InvalidInput("表示名を入力してね") })
    .max(100, { message: Errors.InvalidInput("表示名は100文字以内") }),
});

const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest) {
  if (!hitRateLimit(`register:ip:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return error("登録の試行が多すぎるわ！💦 しばらく待ってからもう一度試してね", 429);
  }

  const parsed = RegisterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return error(parsed.error.issues.map((e) => e.message).join(", "), 400);
  }
  const { email, password, preferredUsername, displayName } = parsed.data;

  const sanitizedDisplayName = sanitizeHtml(displayName, { allowedTags: [], allowedAttributes: {} }).trim();
  if (!sanitizedDisplayName) {
    return error(Errors.InvalidInput("表示名に無効な内容が含まれてるわ！💦"), 400);
  }

  const { account, databases } = await createAdminClient();

  // ユーザー名の重複チェック（同時に登録されたときの取りこぼしを防ぐには、Appwrite側に一意インデックスが必要）
  try {
    const { total } = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_ACTORS_COLLECTION_ID!, [
      Query.equal("preferredUsername", preferredUsername),
      Query.limit(1),
    ]);
    if (total > 0) return error("このユーザー名はもう使われてるわ！💦 別の名前を試してね", 409);
  } catch (err: any) {
    console.error("ユーザー名の確認に失敗:", err?.message);
    return error(Errors.RegistrationFailed, 500);
  }

  // ユーザー作成
  let userId: string;
  try {
    userId = (await account.create(ID.unique(), email, password, preferredUsername)).$id;
  } catch (err: any) {
    if (err?.code === 409) return error("このメールアドレスはもう登録されてるわ！💦", 409);
    if (err?.code === 400) return error("メールアドレスかパスワードの形が正しくないわ！💦", 400);
    console.error("ユーザーの作成に失敗:", err?.message);
    return error(Errors.RegistrationFailed, 500);
  }

  // アクター作成。失敗したら作りかけを全部消す
  try {
    await createActorForUser(userId, preferredUsername, sanitizedDisplayName);
  } catch (err: any) {
    console.error("アクターの作成に失敗:", err?.message);
    await rollbackRegistration(userId);
    if (err?.code === 409) return error("このユーザー名はもう使われてるわ！💦 別の名前を試してね", 409);
    return error(Errors.RegistrationFailed, 500);
  }

  // そのままログインする。失敗してもアカウントはできているので、ログイン画面に案内する
  let loggedIn = false;
  try {
    const session = await account.createEmailPasswordSession(email, password);
    await setSessionCookie(session.secret, session.expire);
    loggedIn = true;
  } catch (err: any) {
    console.error("登録後のログインに失敗:", err?.message);
  }

  return NextResponse.json({ message: "登録できたわ！うたかたへようこそ🫧", loggedIn }, { status: 201 });
}
