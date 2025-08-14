// 投稿のいいねを取得するAPI
// 返答はOrderedCollectionPage

import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { Query } from "node-appwrite";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if(!request.headers.get("Accept")?.includes("application/activity+json")){
        return NextResponse.json({ error: "Accept header is required" }, { status: 400 });
    }
    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "1";
    const { id } = await params;
    const { databases } = await createSessionClient();
    const likes = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_LIKES_COLLECTION_ID!, [Query.equal("object", id), Query.offset((parseInt(page) - 1) * 10), Query.limit(10)]);
    const orderedCollectionPage = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "OrderedCollectionPage",
        "id": `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes?page=${page}`,
        "partOf": `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes`,
        "orderedItems": likes.documents,
        "next": `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes?page=${parseInt(page) + 1}`,
        "prev": `${process.env.NEXT_PUBLIC_DOMAIN}/api/posts/${id}/likes?page=${parseInt(page) - 1}`,
        "totalItems": likes.total,
    }
    return NextResponse.json(orderedCollectionPage, {
        headers: {
            "Content-Type": "application/activity+json"
        }
    });
}