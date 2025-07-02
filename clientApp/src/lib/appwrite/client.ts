import { Post } from "./posts";
import { getLoggedInUser } from "./serverConfig";
import { convertToExternalUrl } from "../utils";

/**
 * リプライ先の投稿を取得する関数！✨
 * @param activityId アクティビティID
 * @returns 投稿情報とアクター情報
 */
export async function fetchReplyToPost(activityId: string): Promise<{ post: any; actor: any } | null> {
    const  response  = await fetch(`${convertToExternalUrl(activityId)}`,{
      method: "GET",
      headers: {
        "Accept": "application/activity+json",
      },
    });
    if(!response.ok){
      throw new Error("リプライ先の投稿取得に失敗したわ！");
    }
    const content = await response.body?.getReader().read();
    const decoder = new TextDecoder();
    const text = decoder.decode(content?.value || new Uint8Array(), { stream: true });
    const post = JSON.parse(text);
    const actor = await fetch(convertToExternalUrl(post.attributedTo),{
      method: "GET",
      headers: {
        "Accept": "application/activity+json",
      },
    }).then(res => res.json());
    //console.log("json",json);
    return { post, actor };
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
 * セッション情報を取得する関数！✨
 * @returns セッション情報
 */
export async function getSession() {
  const response = await fetch("/api/auth/session");
  if (!response.ok) {
    throw new Error("セッションの取得に失敗したよ！💦");
  }
  return response.json();
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
