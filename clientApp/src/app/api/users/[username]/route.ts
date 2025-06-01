import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";
import { ENV } from "@/lib/api/config";

/**
 * ユーザー情報を取得するAPI！✨
 * @param params パラメータ
 * @returns ユーザー情報
 */
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {    
    //console.log("params", params);
    const { databases } = await createSessionClient(request);
    const response = await databases.listDocuments(ENV.DATABASE_ID, ENV.ACTORS_COLLECTION_ID, [
      Query.equal("preferredUsername", [params.username]),
    ]);
    if (response.documents.length === 0) {
      return NextResponse.json(
        { error: "ユーザーが見つからないわ！💦" },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
          }
        }
      );
    }
    const user = response.documents[0];
    return NextResponse.json(user, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
      }
    });
    
    
  } catch (error) {
    console.error("ユーザー情報の取得に失敗したわ！", error);
    return NextResponse.json(
      { error: `サーバーエラーが発生したわ！💦` },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, user-agent',
        }
      }
    );
  }
} 