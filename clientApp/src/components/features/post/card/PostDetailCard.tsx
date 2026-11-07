"use client";

//import { Post } from "@/types/post";  
import {useState, useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import ImageModal from "../modal/ImageModal";
//import PostReplies from "../reply/PostReplies";
import ContentsCard from "@/components/ui/ContentsCard";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ActivityPubActor, ActivityPubNoteInClient } from "@/types/activitypub";
import Link from "next/link";

//import { fetchReplyToPost} from "@/lib/appwrite/client";  
import ReplyToPost from "@/components/features/post/reply/ReplyToPost";
import { formatDate,  } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils/date";
import { LikeButton } from "./PostCard";  
import { Button } from "@/components/ui/Button";
import  {getActorById} from "@/lib/appwrite/database"; 
//import { useAuth } from "@/hooks/auth/useAuth";
import { Loader2, X } from "lucide-react";
import { getActorDisplayPreferredUsername } from "@/lib/activitypub/utils";
import { getLikedActivities } from "@/lib/appwrite/serverConfig";
import PostReplies from "@/components/features/post/reply/PostReplies";
import PostContent from "@/components/features/post/PostContent";
import { showToast } from "@/components/ui/Toast";

// いいねしたユーザーの一覧を表示するボタン！✨
const LikedUsersButton = ({ likeCount, onClick }: { 
  likeCount: number; 
  onClick: () => void;
}) => {
  if (likeCount === 0) return null;
  
  return (
    <Button
      onClick={onClick}
      className="text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-700 dark:hover:text-pink-500 hover:scale-105 transition-all duration-200 flex items-center gap-1.5 group px-3 py-1.5 rounded-xl border border-pink-200 dark:border-pink-800"
    >
      <span className="text-sm font-medium">
        {likeCount}人がいいねしてるよ！
      </span>
    </Button>
  );
};

// いいねしたユーザーのモーダル！✨
const LikedUsersModal = ({ 
  isOpen, 
  onClose, 
  postId,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  postId: string;
}) => {
  const [users, setUsers] = useState<ActivityPubActor[]>([]);
  useEffect(() => {
    setUsers([]);
    if (isOpen && postId) {
      async function getLikedActors(){
        //console.log("postId",postId);
        const likedActivities = await getLikedActivities(postId);
        // 1人ずつ待つと遅いので、まとめて取得する
        const actorIds = [...new Set(likedActivities.map((activity: any) => activity.actor as string))];
        const actors = await Promise.all(actorIds.map((id) => getActorById(id).catch(() => null)));
        setUsers(actors.filter((actor): actor is ActivityPubActor => !!actor));
      }
      getLikedActors();
    }
    return () => {
      setUsers([]);
    }
  }, [isOpen,postId]);

  if (!isOpen || !users.length) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">いいねしたユーザー</h3>
          <button
            onClick={onClose}
            className="text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-900/80 rounded-full p-2 hover:scale-110 hover:rotate-180 hover:bg-gray-200/20 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-pink-500 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-2">
          {users.map((user) => (
            <a key={user.id} href={user.id} className="block">
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
             
                  <Avatar
                    src={user.icon?.url || ""}
                    alt={user.preferredUsername}
                    fallback={user.preferredUsername?.charAt(0)}
                    size="md"
                    variant="outline"
                  />
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-gray-100">{user.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">@{user.preferredUsername}</span>
                  </div>
              </div>
              </a>
          ))}
        </div>
      </div>
    </div>
  );
};

// 削除ボタンのコンポーネント！✨
const DeleteButton = ({ postId, onDelete }: { postId: string; onDelete?: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/posts/${postId.split("/").pop()}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        throw new Error('投稿の削除に失敗しました');
      }
      
      
      // 削除完了の処理
      setIsDeleteModalOpen(false);
      
      // 親コンポーネントに削除完了を通知
      if (onDelete) {
        onDelete();
      } else {
        // デフォルトの処理：モーダルを閉じる
        window.dispatchEvent(new CustomEvent('postDeleted', { 
          detail: { postId } 
        }));
      }
      
      //console.log('🗑️ 投稿削除完了:', postId);
    } catch (error) {
      //console.error('削除に失敗したよ！💦', error);
      showToast('投稿を消せなかったの…もう一回試してみて💦');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsDeleteModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isDeleting}
        className="group relative px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-red-200 dark:border-red-800 disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <span className={`transition-transform duration-200 ${isHovered ? 'animate-bounce' : ''} ${isDeleting ? 'animate-spin' : ''}`}>
            {isDeleting ? '🔄' : (isHovered ? '💔' : '🗑️')}
          </span>
          <span className="font-medium">
            {isDeleting ? '削除中...' : '削除する'}
          </span>
        </div>
      </button>
      
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">投稿を削除する？</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              この投稿を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 404エラー表示コンポーネント
const NotFoundError = ({ postId }: { postId: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-gray-800 rounded-2xl p-8">
    <div className="text-6xl mb-6 animate-bounce">💫</div>
    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
      投稿が見つかりません
    </h1>
    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 text-center">
      お探しの投稿は存在しないか、削除された可能性があります。
    </p>
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
        {postId}
      </p>
    </div>
    <div className="flex gap-4">
      <button
        onClick={() => window.history.back()}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        前のページに戻る
      </button>
      <button
        onClick={() => window.location.href = "/timeline"}
        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        タイムラインに戻る
      </button>
    </div>
  </div>
);


// 投稿詳細カードのメインコンポーネント！✨
export default function PostDetailCard({
  post,
  setIsDetailOpen,
  setIsReplyOpen,
  setIsModalOpen,
  isModalOpen,
  setModalImages,
  setModalIndex,
  setPost,
  initialPost,
}: {
  post: string;
  /** カードから開いたときの投稿。渡すとすぐに表示し、裏で最新の状態とリプライを取得する */
  initialPost?: ActivityPubNoteInClient | null;
  setIsDetailOpen: (isDetailOpen: boolean) => void;
  setIsReplyOpen: (isReplyOpen: boolean) => void;
  setIsModalOpen: (isModalOpen: boolean) => void;
  isModalOpen: boolean;
  setModalImages: (images: ActivityPubImage[]) => void;
  setModalIndex: (index: number) => void;
  setPost?: (post: any) => void;
}) {
 // const [replyPosts,setReplyPosts] = useState<Post[]>([]);
  const [isLikedUsersOpen, setIsLikedUsersOpen] = useState(false);
  const [postData, setPostData] = useState<ActivityPubNoteInClient | null>(initialPost ?? null);
  const [parentPost, setParentPost] = useState<ActivityPubNoteInClient | null>(null);
  const [replies, setReplies] = useState<ActivityPubNoteInClient[]>([]);
  const [isPostLoading, setIsPostLoading] = useState(!initialPost);
  const [canDelete, setCanDelete] = useState<boolean>(false); 
  const images = postData?.attachment?.flatMap((image: any) => {
    try { return [JSON.parse(image) as ActivityPubImage]; } catch { return []; }
  }) || [];
  const [relativeTime, setRelativeTime] = useState<string>("");
  const [isPostLiked, setIsPostLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);  

  // 投稿・リプライ先・リプライを1回でまとめて取得する
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/thread?id=${encodeURIComponent(post)}`, { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          // カードから開いた場合は、手元の投稿をそのまま表示しておく
          if (!initialPost) setPostData(null);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setPostData(data.post);
        setParentPost(data.parent);
        setReplies(data.replies ?? []);
      } catch {
        if (!cancelled && !initialPost) setPostData(null);
      } finally {
        if (!cancelled) setIsPostLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [post]);

  useEffect(() => {
    //console.log("postData?.attributedTo",postData?.attributedTo);
    setCanDelete(postData?._canDelete || false);
    setIsPostLiked(postData?._isLiked || false);
    setLikeCount(postData?.likes?.totalItems || 0);
  }, [postData]);

  useEffect(() => {
    const updateRelativeTime = () => {
      const published = new Date(postData?.published || "");
      setRelativeTime(getRelativeTime(published));
    };
    if(postData){
      setPost?.(postData || null);
    }
    const interval = setInterval(updateRelativeTime, 60000);
    return () => {
      setPost?.(null);
      clearInterval(interval);
      setRelativeTime("");
    }
  }, [postData]);

  // 投稿データとアクターデータが読み込まれていない場合はローディング中を表示
  if(isPostLoading){
    return <div className="flex items-center justify-center h-40">
      <Loader2 className="w-6 w-6 animate-spin" />
    </div>
  }
  
  // 投稿が見つからない場合は404エラーを表示
  if(!postData || !postData.published){
    return <NotFoundError postId={post} />;
  }
  return (
    <div >
      <div className="space-y-6 m-4">
        {parentPost && (
          <div className="">
            <ReplyToPost note={parentPost} />
          </div>
        )}
        <div className="flex items-center">
          <Avatar
            src={postData?._user?.icon?.url}
            alt={postData?._user?.preferredUsername}
            fallback={postData?._user?.preferredUsername?.charAt(0)}
            size="lg"
            variant={postData?.to?.includes("https://www.w3.org/ns/activitystreams#Public") ? "outline" : "default"}
            className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"
          />
          <div className="ml-4">
            <Link href={`/@${getActorDisplayPreferredUsername(postData?._user)}`}>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {postData?._user?.displayName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{getActorDisplayPreferredUsername(postData?._user)}
              </p>
            </Link>
            <Link href={`${postData?.id}`}>
              <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(postData?.published)}
              </p>
            </Link>
          </div>
          <div className="ml-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {relativeTime}
            </span>
          </div>
        </div>

        <PostContent content={postData?.content} className="text-xl text-gray-800 dark:text-gray-200" />

        {images.length > 0 ? (
          <div onClick={(e) => e.stopPropagation()}>
            <ImageModal images={images} setIsModalOpen={setIsModalOpen} isModalOpen={isModalOpen} ModalSwitch={false} setModalImages={setModalImages} setModalIndex={setModalIndex} />
          </div>
        ) : (
          <ContentsCard arg={postData?.content || ""} />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsDetailOpen(false);
                setIsReplyOpen(true);
              }}
              className="text-purple-600 dark:text-pink hover:text-purple-700 dark:hover:text-pink-600 hover:scale-105 transition-all duration-200 flex items-center gap-1.5 group"
              aria-label={`@${getActorDisplayPreferredUsername(postData?._user)} にリプライ`}
            >
              <span className="group-hover:animate-bounce">💭</span>
              <span>言及する</span>
            </button>
            <LikeButton 
              postId={postData?.id || ""} 
              isPostLiked={isPostLiked} 
              initialLikes={likeCount} 
              actorInbox={postData?._user?.inbox || ""}
              onLikeChange={setIsPostLiked}
              onLikeCountChange={setLikeCount}
            />
            <LikedUsersButton 
              likeCount={likeCount} 
              onClick={() => setIsLikedUsersOpen(true)} 
            />
          </div>
          {canDelete && (
            <DeleteButton 
              postId={postData?.id || ""} 
              onDelete={() => {
                // 投稿削除完了時の処理
                setIsDetailOpen(false);
                setIsModalOpen(false);
                // 投稿一覧から削除された投稿を除外
                window.dispatchEvent(new CustomEvent('postDeleted', { 
                    detail: { postId: postData?.id } 
                }));
              }}
            />
          )}
        </div>

        <LikedUsersModal 
          isOpen={isLikedUsersOpen} 
          onClose={() => {
            setIsLikedUsersOpen(false);
          }}  
            postId={post} 
        />

        {replies.length > 0 && (
          <div className="flex flex-col gap-2">
            {replies.map((reply) => (
              <PostReplies key={reply.id} note={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}