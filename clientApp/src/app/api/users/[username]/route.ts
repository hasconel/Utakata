import { NextResponse } from "next/server";
import { getActorById } from "@/lib/appwrite/database";

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
    if (request.url.split("/").pop()?.split("?")[0].split("&")[0].split("=")[0].split("#")[0] !== params.username) {
      return NextResponse.json(
        { error: "ユーザーが見つからないわ！💦" },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
    const actorId = `https://${process.env.NEXT_PUBLIC_DOMAIN}/users/${params.username}`;
    //console.log("actorId", actorId);
    const user = await getActorById(actorId);
    if (!user) {
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
    const actor = {
      type: "Person",
      id: user.actorId,
      preferredUsername: user.preferredUsername,
      publicKey: {
        id: user.actorId,
        owner: user.actorId,
        publicKeyPem: user.publicKey,
      },
      name: user.displayName,
      followers: {
        type: "OrderedCollection",
        id: user.actorId,
        totalItems: user.followers?.length || 0,
        first: user.followers?.[0] || null,
      },
      followersList: user.followers || [],
      icon: {
        type: "Image",
        mediaType: "image/png",
        url: user.avatarUrl,
      },
      image: {
        type: "Image",
        mediaType: "image/png",
        url: user.backgroundUrl,
      },
    }

    return NextResponse.json(actor, {
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