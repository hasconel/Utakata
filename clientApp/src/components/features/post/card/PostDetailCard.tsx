"use client";

//import { Post } from "@/types/post";  
import {useState, useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import ImageModal from "../modal/ImageModal";
//import PostReplies from "../reply/PostReplies";
import ContentsCard from "@/components/ui/ContentsCard";
import { ActivityPubImage } from "@/types/activitypub/collections";
import Link from "next/link";
//import { fetchReplyToPost} from "@/lib/appwrite/client";  
import ReplyToPost from "@/components/features/post/reply/ReplyToPost";
import { formatDate, isInternalUrl } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils/date";
import { LikeButton } from "./PostCard";
import { Button } from "@/components/ui/Button";
import  {getActorById,ActivityPubActor} from "@/lib/appwrite/database";
import { useActor } from "@/hooks/useActor";
import { usePost } from "@/hooks/usePost";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader2 } from "lucide-react";

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
  likedActors 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  likedActors: string[];
}) => {
  const [users, setUsers] = useState<ActivityPubActor[]>([]);

  useEffect(() => {
    setUsers([]);
    if (isOpen && likedActors.length > 0) {
      likedActors.forEach(async (actor) => {
        const user = await getActorById(actor);
        if(user){
          setUsers((prev) => [...prev, user]);
        }
      });
    }
  }, [isOpen, likedActors]);

  if (!isOpen || !likedActors.length) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">いいねしたユーザー</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <Avatar
                    src={user.icon?.url || ""}
                    alt={user.preferredUsername}
                    fallback={user.preferredUsername?.charAt(0)}
                    attributedTo={user.id}
                    size="md"
                    variant="outline"
                  />
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-gray-100">{user.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">@{user.preferredUsername}</span>
                  </div>
                </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 削除ボタンのコンポーネント！✨
const DeleteButton = ({ postId }: { postId: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setIsDeleteModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('削除に失敗したよ！💦', error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsDeleteModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-red-200 dark:border-red-800"
      >
        <div className="flex items-center gap-2">
          <span className={`transition-transform duration-200 ${isHovered ? 'animate-bounce' : ''}`}>
            {isHovered ? '💔' : '🗑️'}
          </span>
          <span className="font-medium">削除する</span>
        </div>
      </button>
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">投稿を削除する？</h3>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                削除する
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
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

// 投稿詳細カードのメインコンポーネント！✨
export default function PostDetailCard({
  post,
  setIsDetailOpen,
  setIsReplyOpen,
  setIsModalOpen,
  isModalOpen,
  setModalImages,
  setModalIndex,
}: {
  post: string;
  setIsDetailOpen: (isDetailOpen: boolean) => void;
  setIsReplyOpen: (isReplyOpen: boolean) => void;
  setIsModalOpen: (isModalOpen: boolean) => void;
  isModalOpen: boolean;
  setModalImages: (images: ActivityPubImage[]) => void;
  setModalIndex: (index: number) => void;
}) {
  const { getActor, isLoading: isActorLoading } = useActor();
  const [actor, setActor] = useState<string | null>(null);  
  const [actorData, setActorData] = useState<any | null>(null);
 // const [replyPosts,setReplyPosts] = useState<Post[]>([]);
  const [isLikedUsersOpen, setIsLikedUsersOpen] = useState(false);
  const { data: postData, isLoading: isPostLoading } = usePost(post);
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const { user } = useAuth();
  const images = postData?.attachment?.map((image) => JSON.parse(image) as ActivityPubImage) || [];
  const [relativeTime, setRelativeTime] = useState<string>("");
  const ContentsDocment = postData?.content ? (
    <div className="space-y-2">
      {postData?.content.split("\n").map((line, index) => (
        <p key={index} className="text-gray-800 dark:text-gray-200">{line}</p>
      ))}
    </div>
  ) : null;
  
  useEffect(() => {
    //console.log("postData?.attributedTo",postData?.attributedTo);
    if(`${process.env.NEXT_PUBLIC_DOMAIN}/users/${user?.$id}` === postData?.attributedTo){
      //console.log("canDelete",canDelete);
      setCanDelete(true);
    }
  }, [user,postData]);

  useEffect(() => {
    if(postData?.attributedTo){
      getActor(postData?.attributedTo).then(({actor,name}) => {
        setActorData(actor);
        setActor(name);
      });
    }
  }, [postData]);
  useEffect(() => {
    if(actorData && postData?.attributedTo && !isActorLoading){
      if(isInternalUrl(postData?.attributedTo)){
        //console.log("actorData",actorData);
        return setActor(actorData?.preferredUsername);
      }else{
        const domain = new URL(postData?.attributedTo || "").hostname;
        return setActor(`${actorData?.preferredUsername}@${domain}`);
      }
    }
    return setActor(null);
  }, [actorData,postData]);
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(postData?.published || ""));
    }, 60000);
    return () => clearInterval(interval);
  }, [postData]);

  // 投稿データとアクターデータが読み込まれていない場合はローディング中を表示
  if(isPostLoading || isActorLoading){
    return <div className="flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  }
  if(!postData?.published || !actorData){
    return <div className="flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  }
  return (
    <div >
      <div className="space-y-6 m-4">
        {postData?.inReplyTo && (
          <div className="">
            <ReplyToPost post={postData?.inReplyTo} />
          </div>
        )}
        <div className="flex items-center">
          <Avatar
            src={actorData?.icon?.url}
            alt={actorData?.preferredUsername}
            fallback={actorData?.preferredUsername?.charAt(0)}
            size="lg"
            variant={postData?.to ? "outline" : "default"}
            className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"
          />
          <div className="ml-4">
            <Link href={`/@${actor}`}>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {actorData?.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{actor}
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

        <div className="text-xl text-gray-800 dark:text-gray-200">{ContentsDocment}</div>

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
              aria-label={`@${actor} にリプライ`}
            >
              <span className="group-hover:animate-bounce">💭</span>
              <span>言及する</span>
            </button>
            <LikeButton 
              postId={postData?.id || ""} 
              isPostLiked={false} 
              initialLikes={0} 
            />
            <LikedUsersButton 
              likeCount={0} 
              onClick={() => setIsLikedUsersOpen(true)} 
            />
          </div>
          {canDelete && <DeleteButton postId={postData?.id || ""} />}
        </div>

        <LikedUsersModal 
          isOpen={isLikedUsersOpen} 
          onClose={() => {
            setIsLikedUsersOpen(false);
          }}  
          likedActors={[]} 
        />

        {/**postData?.replyCount > 0 && (
          replyPosts.map((reply) => (
            <div key={reply.id} className="flex flex-col gap-2">
              <PostReplies key={reply.id} post={reply.id} />
            </div>
          ))
        )*/}
      </div>
    </div>
  );
}