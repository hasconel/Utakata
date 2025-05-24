import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const USERS_COLLECTION_ID = process.env.APPWRITE_ACTORS_COLLECTION_ID!;

/**
 * ユーザー情報を取得するAPI！✨
 * @param request リクエスト
 * @param params パラメータ
 * @returns ユーザー情報
 */
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { databases } = await createSessionClient();
    const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal("preferredUsername", [params.username]),
    ]);
    if (response.documents.length === 0) {
      return NextResponse.json(
        { error: "ユーザーが見つからないわ！💦" },
        { status: 404 }
      );
    }
    const user = response.documents[0];
    return NextResponse.json(user);
    
    
  } catch (error) {
    console.error("ユーザー情報の取得に失敗したわ！", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生したわ！💦" },
      { status: 500 }
    );
  }
} 