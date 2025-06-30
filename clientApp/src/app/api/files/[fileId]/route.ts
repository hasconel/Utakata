import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { fileId: string } }) {
  const { fileId } = params;
  const { storage } = await createSessionClient(request);
  const fileMeta = await storage.getFile(process.env.APPWRITE_STORAGE_ID!, fileId);
  const file = await storage.getFileView(process.env.APPWRITE_STORAGE_ID!, fileId);
  return new NextResponse(file, {
    headers: {
      "Content-Type": fileMeta.mimeType || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}