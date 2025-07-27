/**
 * ファイルアップロードのAPI！✨
 * ファイルをアップロードするよ！💖
 * file.visibility: public, unlisted, private
 * public: 公開
 * unlisted: 未収載(ユーザーのみ閲覧可能)
 * private: 非公開(未実装)
 */
import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/serverConfig";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { InputFile } from "node-appwrite/file";
import { ID, Permission, Role } from "node-appwrite";


export async function POST(request: Request) {
  try {
    const { account,storage } = await createSessionClient(request);
    if (!account) {
      throw new Error("セッションが見つからないよ！💦");
    }
    const userId = (await account.get()).$id
    const { file } = await request.json();
    //console.log("file",file);
    let fileType : "Image" | "Video" | "Audio" = "Image";
    if(file.type.includes("video")){
      fileType = "Video";
    }else if(file.type.includes("audio")){
      fileType = "Audio";
    }
    const binnaryFile = Buffer.from(file.bin,"base64");  
    const Query = [Permission.write(Role.user(userId)),Permission.delete(Role.user(userId))];
    if(file.visibility === "public"){
      Query.push(Permission.read(Role.any()));
    }
    if(file.visibility === "unlisted"){
      Query.push(Permission.read(Role.users()));
    }
    const uploadedFile = await storage.createFile(
        process.env.APPWRITE_STORAGE_ID!,
        ID.unique(),
        InputFile.fromBuffer(binnaryFile,file.name),
        Query
    );
    console.log("uploadedFile",uploadedFile);
    const fileUrl = process.env.NEXT_PUBLIC_DOMAIN! + "/api/files/" + uploadedFile.$id ;
    
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


