/**
 * ファイルアップロードのAPI！✨
 * ファイルをアップロードするよ！💖
 */
import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { InputFile } from "node-appwrite/file";
import { ID } from "node-appwrite";
import { getImageUrl } from "@/lib/appwrite/client";


export async function POST(request: Request) {
  try {
    const { account,storage } = await createSessionClient(request);
    if (!account) {
      throw new Error("セッションが見つからないよ！💦");
    }
    const { file } = await request.json();
    //console.log("file",file);
    let fileType : "Image" | "Video" | "Audio" = "Image";
    if(file.type.includes("video")){
      fileType = "Video";
    }else if(file.type.includes("audio")){
      fileType = "Audio";
    }
    const binnaryFile = Buffer.from(file.bin,"base64");  
    const uploadedFile = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!,
        ID.unique(),
        InputFile.fromBuffer(binnaryFile,file.name)
    );
    console.log("uploadedFile",uploadedFile);
    const fileUrl = await getImageUrl(uploadedFile.$id);
    
    const uploadedFiles : ActivityPubImage = {
        type: fileType,
        mediaType: file.type,
        url: fileUrl,
        name: file.name,
        width: 0,
        height: 0,
        blurhash: "",
    };
    return new Response(JSON.stringify(uploadedFiles));
  } catch (error) {
    console.error("ファイルアップロードに失敗したよ！💦", error);
    return new NextResponse("ファイルアップロードに失敗したよ！💦", { status: 500 });
  }
}


