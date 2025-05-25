import { Client, Storage, ImageFormat, Databases } from "appwrite";
import { Post } from "./posts";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { getLoggedInUser } from "./serverConfig";
/**
 * Appwriteのクライアント設定！✨
 * クライアントサイドで使う設定だよ！💖
 */
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setSession("current");

const storage = new Storage(client);


/**
 * リプライ先の投稿を取得する関数！✨
 * @param activityId アクティビティID
 * @returns 投稿情報
 */
export async function fetchReplyToPost(activityId: string): Promise<Post | null> {
  const  documents  = await fetch(`/api/posts/${activityId}`).then(res => res.json())
  return documents as Post || null;
}

/**
 * タイムラインの投稿を取得する関数！✨
 * @param limit 取得件数
 * @param offset オフセット
 * @returns 投稿一覧
 */
export async function fetchTimelinePosts(limit: number = 10, offset: number = 0): Promise<Post[]> {
  const currentUser = await getLoggedInUser();
  const url = `/api/posts?limit=${limit}&offset=${offset}&userId=${currentUser.$id}`
  try {
    const response = await fetch(url,{
      method: "GET",
      headers: {
      "Content-Type": "application/json",
    },
  }).then(res =>{  return res.json()})

  return response.postsAsPostArray as Post[];
  } catch (error) {
    console.error("タイムラインの投稿取得に失敗したわ！", error);
    return [];
  }
}

/**
 * 画像をアップロードする関数！✨
 * @param file 画像ファイル
 * @returns アップロード結果
 */
export async function uploadImage(file: File) {
  return await storage.createFile(
    process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!,
    "unique()",
    file
  );
}

/**
 * 画像のURLを取得する関数！✨
 * @param fileId ファイルID
 * @returns 画像URL
 */
export async function getImageUrl(fileId: string) {
  return await storage.getFileView(
    process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!,
    fileId
  );
}




export async function getReplyPost(postId: string) {
  const url = `/api/posts?inReplyTo=${postId}`
  const  documents  = await fetch(url,{
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(res => res.json())
return documents.postsAsPostArray as Post[];
}

/**
 * ユーザーの投稿を取得する関数！✨
 * @param username ユーザー名
 * @returns ユーザーの投稿一覧
 */
export async function getUserPosts(username: string): Promise<Post[]> {
  try {
    const response = await fetch(`/api/posts?attributedTo=${username}`).then(res => res.json());
    return response.postsAsPostArray || [];
  } catch (error) {
    console.error("ユーザーの投稿取得に失敗したわ！", error);
    return [];
  }
}

/**
 * 画像のプレビューを取得する関数！✨
 * @param fileImageId 画像情報
 * @param height 高さ
 * @param width 幅
 * @returns プレビューURL
 */
export async function getImagePreview(fileImageId: ActivityPubImage, height?: number, width?: number) {
  if (!fileImageId || !fileImageId.url) {
    console.error("画像情報が不正です");
    return null;
  }

  const urlParts = fileImageId.url.split("/");
  const fileId = urlParts[urlParts.length - 2];

  if (!fileId) {
    console.error("ファイルIDが見つかりません");
    return null;
  }

  try {
    return await storage.getFileView(process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!, fileId)
    /**
    storage.getFilePreview(
      process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!,
      fileId,
      width,
      height,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ImageFormat.Webp
    );
    */
  } catch (error) {
    console.error("プレビューの取得に失敗しました:", error);
    return null;
  }
}

export async function RegisterUser(preferredUsername: string, displayName: string, email: string, password: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
    preferredUsername: preferredUsername, 
    displayName: displayName, 
    email: email, 
    password: password 
    }),
  });
  if (!response.ok) {
    
    const errorData = await response.json();
    throw new Error(errorData.error);
  }
  return response.json();
}
