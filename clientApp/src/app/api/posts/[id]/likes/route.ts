// 投稿のいいねを取得するAPI
// 返答はOrderedCollectionPage

import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Acceptヘッダーのチェック
        if(!request.headers.get("Accept")?.includes("application/activity+json")){
            return NextResponse.json({ error: "Accept header is required" }, { status: 400 });
        }
        
        const url = new URL(request.url);
        const page = url.searchParams.get("page") || null;
        const { id } = await params;
        
        //console.log(`Likes取得開始: postId=${id}, page=${page}`);
        
        // 環境変数のチェック
        if (!process.env.APPWRITE_DATABASE_ID || !process.env.APPWRITE_LIKES_COLLECTION_ID) {
            console.error("環境変数が設定されていません");
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }
        
        const { databases } = await createSessionClient();
        
        // いいねデータを取得
        const likes = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_LIKES_COLLECTION_ID,
            [
                Query.equal("object", `${process.env.NEXT_PUBLIC_DOMAIN}/posts/${id}`), 
                Query.offset((parseInt(page || "1") - 1) * 10), 
                Query.limit(10)
            ]
        );
        
        //console.log(`取得されたいいね数: ${likes.documents.length}, 総数: ${likes.total}`);
        
        // いいねデータをActivityPub形式に変換
        const orderedItems = likes.documents.map((like: any) => ({
            "type": "Like",
            "actor": like.actor,
            "object": `${process.env.NEXT_PUBLIC_DOMAIN}/posts/${id}`,
            "id": like.id,
            "published": like.published || new Date().toISOString()
        }));
        if(!page){
            const orderedCollection = {
                "@context": "https://www.w3.org/ns/activitystreams",
                "type": "OrderedCollection",
                "id": `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes`,
                "totalItems": likes.total,
                "first": `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes?page=1`,
            }
            return NextResponse.json(orderedCollection, {
                headers: {
                    "Content-Type": "application/activity+json",
                    "Cache-Control": "no-cache"
                }
            });
        }
        const orderedCollectionPage = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "OrderedCollectionPage",
            "id": `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes?page=${page}`,
            "partOf": `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes`,
            "orderedItems": orderedItems,
            "next": likes.total > parseInt(page) * 10 ? `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes?page=${parseInt(page) + 1}` : null,
            "prev": parseInt(page) > 1 ? `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes?page=${parseInt(page) - 1}` : null,
            "totalItems": likes.total,
        };
        
        //console.log("レスポンス準備完了:", JSON.stringify(orderedCollectionPage, null, 2));
        
        return NextResponse.json(orderedCollectionPage, {
            headers: {
                "Content-Type": "application/activity+json",
                "Cache-Control": "no-cache"
            }
        });
        
    } catch (error) {
        console.error("いいね取得エラー:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { 
            status: 500,
            headers: {
                "Content-Type": "application/activity+json"
            }
        });
    }
}