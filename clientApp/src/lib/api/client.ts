/**
 * APIクライアント！✨
 * AppwriteのAPIをキラキラに管理するよ！💖
 */
import { Post } from "@/lib/appwrite/posts";
import { Models } from "node-appwrite";
import { getLoggedInUser, createSessionClient,  getPost, createPost, deletePostById, getUserPosts, updateUserProfile } from "@/lib/appwrite/serverConfig";
import { getActorByUserId } from "@/lib/appwrite/database";

// APIエラーの型定義！✨
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// セッションを確認する関数！✨
const checkSession = async () => {
  try {
    const user = await getLoggedInUser();
    return user;
  } catch (error) {
    return null;
  }
};

// 投稿関連のAPI！✨
export const postsApi = {
  
  // タイムラインの投稿を取得！✨
  getTimeline: async (limit: number = 10, offset: number = 0): Promise<Post[]> => {
    /*
    try {
      const session = await checkSession();
      if (!session) {
        throw new ApiError('セッションが見つからないよ！💦', 401);
      }
      const documents = await getTimelinePosts(limit, offset);
      
      return documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        content: doc.content,
        username: doc.username || doc.$id,
        published: doc.published || doc.$createdAt,
        avatar: doc.avatar,
        activityId: doc.$id,
        to: doc.to || '',
        cc: doc.cc || [],
        inReplyTo: doc.inReplyTo || null,
        replyCount: doc.replyCount || 0,
        attributedTo: doc.attributedTo || doc.$id,
        attachment: doc.attachment || [],
        LikedActors: doc.LikedActors || [],
        isLiked: doc.LikedActors?.map((actor:string)=>actor.split("/").pop() || "").includes(session.name) || false,
        canDelete: doc.$id === session.$id
      })) as unknown as Post[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('タイムラインの取得に失敗したよ！💦');
    }
    */
    const documents = await fetch(`/api/posts?limit=${limit}&offset=${offset}`).then(res => res.json());
    return documents.postsAsPostArray as Post[];
  },
  

  // 投稿の詳細を取得！✨
  getPost: async (postId: string): Promise<Post> => {
    try {
      const session = await checkSession();
      if (!session) {
        throw new ApiError('セッションが見つからないよ！💦', 401);
      }

      const document = await getPost(postId);

      return {
        $id: document.$id,
        $createdAt: document.$createdAt,
        $updatedAt: document.$updatedAt,
        content: document.content,
        username: document.username || document.$id,
        published: document.published || document.$createdAt,
        avatar: document.avatar,
        activityId: document.$id,
        to: document.to || '',
        cc: document.cc || [],
        inReplyTo: document.inReplyTo || null,
        replyCount: document.replyCount || 0,
        attributedTo: document.attributedTo || document.$id,
        attachment: document.attachment || [],
        LikedActors: document.LikedActors || [],
        isLiked: document.LikedActors?.map((actor:string)=>actor.split("/").pop() || "").includes(session.name) || false,
        canDelete: document.$id === session.$id
      } as unknown as Post;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('投稿の取得に失敗したよ！💦');
    }
  },

  // 投稿を作成！✨
  createPost: async (content: string, images?: File[]): Promise<Post> => {
    try {
      const session = await checkSession();
      if (!session) {
        throw new ApiError('セッションが見つからないよ！💦', 401);
      }

      const document = await createPost(content, session.$id, images);

      return {
        $id: document.$id,
        $createdAt: document.$createdAt,
        $updatedAt: document.$updatedAt,
        content: document.content,
        username: session.$id,
        published: document.published,
        avatar: undefined,
        activityId: document.$id,
        to: '',
        cc: [],
        inReplyTo: null,
        replyCount: 0,
        attributedTo: session.$id,
        attachment: document.attachment || [],
        LikedActors: [],
        isLiked: false,
        canDelete: true
      } as unknown as Post;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('投稿の作成に失敗したよ！💦');
    }
  },

  // 投稿を削除！✨
  deletePost: async (postId: string): Promise<void> => {
    try {
      const session = await checkSession();
      if (!session) {
        throw new ApiError('セッションが見つからないよ！💦', 401);
      }

      await deletePostById(postId);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('投稿の削除に失敗したよ！💦');
    }
  },
};

// ユーザー関連のAPI！✨
export const usersApi = {
  // ユーザー情報を取得！✨
  getUser: async (): Promise<Models.User<Models.Preferences>> => {
    try {
      const session = await checkSession();
      if (!session) {
        throw new ApiError('セッションが見つからないよ！💦', 401);
      }

      const { account } = await createSessionClient();
      const user = await account.get();
      return user;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('ユーザー情報の取得に失敗したよ！💦');
    }
  },

  // ユーザーの投稿を取得！✨
  getUserPosts: async (userId: string): Promise<Post[]> => {
    try {
      const session = await checkSession();
      if (!session) {
        throw new ApiError('セッションが見つからないよ！💦', 401);
      }

      const documents = await getUserPosts(userId);

      return documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        content: doc.content,
        username: doc.username || doc.$id,
        published: doc.published || doc.$createdAt,
        avatar: doc.avatar,
        activityId: doc.$id,
        to: doc.to || '',
        cc: doc.cc || [],
        inReplyTo: doc.inReplyTo || null,
        replyCount: doc.replyCount || 0,
        attributedTo: doc.attributedTo || doc.$id,
        attachment: doc.attachment || [],
        LikedActors: doc.LikedActors || [],
        isLiked: doc.LikedActors?.map((actor:string)=>actor.split("/").pop() || "").includes(session.name) || false,
        canDelete: doc.$id === session.$id
      })) as unknown as Post[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('ユーザーの投稿の取得に失敗したよ！💦');
    }
  },

  // プロフィールを更新！✨
  updateProfile: async (data: {
    displayName?: string;
    bio?: string;
    avatar?: File;
  }): Promise<Models.User<Models.Preferences>> => {
    try {
      const session = await checkSession();
      if (!session) {
        throw new ApiError('セッションが見つからないよ！💦', 401);
      }

      const { account } = await createSessionClient();
      const user = await account.updateName(data.displayName || '');
      return user;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('プロフィールの更新に失敗したよ！');
    }
  },
};

export const api = {
  // プロフィールを更新！✨
  updateProfile: async (data: { displayName: string; bio: string }) => {
    try {
      const user = await checkSession();
      if (!user) throw new ApiError('ログインが必要だよ！💦');
      const actor = await getActorByUserId(user.$id);
      if (!actor) throw new ApiError('アクターが見つからないよ！💦');
      await updateUserProfile(actor.$id, data);
      return true;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('プロフィールの更新に失敗したよ！');
    }
  },
}; 