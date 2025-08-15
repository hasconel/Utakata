import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const { storage } = await createSessionClient(request);
  try{
    const fileMeta = await storage.getFile(process.env.APPWRITE_STORAGE_ID!, fileId);
    if(!fileMeta){
      return new NextResponse("ファイルが見つかりません！💦", { status: 404 });
    }
    const file = await storage.getFileView(process.env.APPWRITE_STORAGE_ID!, fileId);
    return new NextResponse(file, {
      headers: {
        "Content-Type": fileMeta.mimeType || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }catch(error){
    console.error("ファイル取得に失敗したよ！💦", error);
    return new NextResponse("ファイル取得に失敗したよ！💦", { status: 500 });
  }
}