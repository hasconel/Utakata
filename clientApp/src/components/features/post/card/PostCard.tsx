"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, getShortRelativeTime } from "@/lib/utils/date";
import { MessageCircle, Sparkles } from "lucide-react";
import { PublicMark, isPublicPost } from "@/components/features/post/PublicMark";
import { profileHref } from "@/lib/utils";
import { POST_WINDOW_HOURS, remainingLife } from "@/lib/postWindow";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ActivityPubNoteInClient } from "@/types/activitypub";
import PostContent from "@/components/features/post/PostContent";
import { EmojiText } from "@/components/features/post/EmojiText";
import { ContentWarning } from "@/components/features/post/ContentWarning";
import { showToast } from "@/components/ui/Toast";
import ContentsCard from "@/components/ui/ContentsCard";
import { likePost, unlikePost } from "@/lib/appwrite/serverConfig";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { useAuth } from "@/hooks/auth/useAuth";
import ImageModal from "@/components/features/post/modal/ImageModal";
import Modal from "@/components/ui/Modal";
import PostDetailCard from "@/components/features/post/card/PostDetailCard";
import PostForm from "@/components/features/post/form/PostForm"; 

// いいねボタンのコンポーネント！✨
export const LikeButton = ({ 
  postId, 
  initialLikes, 
  isPostLiked, 
  actorInbox,
  onLikeChange,
  onLikeCountChange
}: { 
  postId: string; 
  initialLikes: number; 
  isPostLiked: boolean; 
  actorInbox: string;
  onLikeChange: (isLiked: boolean) => void;
  onLikeCountChange: (count: number) => void;
}) => {
  const [isLiked, setIsLiked] = useState(isPostLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();
  
  // 親の状態が変わったら同期
  useEffect(() => {
    setIsLiked(isPostLiked);
  }, [isPostLiked]);
  
  useEffect(() => {
    setLikeCount(initialLikes);
  }, [initialLikes]);
  
  const handleLike = async () => {
    // ログインしていない人は、ログインしてから
    if (!user) return void (window.location.href = "/login");
    if (isAnimating) return;
    
    const newIsLiked = !isLiked;
    setIsAnimating(true);
    setIsLiked(newIsLiked);

    try {
      if (isLiked) {
        const response = await unlikePost(postId, actorInbox);
        if (!response) throw new Error("ライク解除に失敗したわ！💦");
        const newCount = likeCount - 1;
        setLikeCount(newCount);
        onLikeCountChange(newCount);
      } else {
        const response = await likePost(postId, actorInbox);
        if (!response) throw new Error("ライクに失敗したわ！💦");
        const newCount = likeCount + 1;
        setLikeCount(newCount);
        onLikeCountChange(newCount);
      }
      onLikeChange(newIsLiked);
    } catch (error) {
      console.error("ライクに失敗したわ！", error);
      setIsLiked(isLiked);
      showToast(isLiked ? "いいねを取り消せなかったの…💦" : "いいねが届かなかったみたい…もう一回押してみて💦");
    }

    setTimeout(() => setIsAnimating(false), 500);
  };
  
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleLike();
      }}
      aria-pressed={isLiked}
      aria-label={isLiked ? "いいねを取り消す" : "いいね"}
      title={isLiked ? "いいねを取り消す" : "いいね"}
      className={`group/like -ml-2 inline-flex h-8 min-w-8 items-center gap-1 rounded-full px-2 text-sm transition-colors ${
        isLiked ? "text-primary" : "text-muted-foreground hover:bg-accent hover:text-primary"
      }`}
    >
      <Sparkles
        className={`h-[18px] w-[18px] ${isLiked ? "fill-current" : ""} ${isAnimating ? "animate-pop" : ""}`}
        strokeWidth={isLiked ? 1.5 : 2}
      />
      {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
    </button>
  );
};

/**
 * 表示期間（84時間）の残りを表す小さな泡。投稿したばかりは満ちていて、だんだん欠けていく。
 */
const LifeBubble = ({ published }: { published: string }) => {
  const life = remainingLife(published);
  const hoursLeft = Math.ceil(life * POST_WINDOW_HOURS);
  return (
    <span
      role="img"
      aria-label={`タイムラインに残るのは、あと${hoursLeft}時間`}
      title={`あと${hoursLeft}時間`}
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(var(--primary) ${life * 360}deg, var(--border) 0deg)`,
        opacity: 0.35 + life * 0.65,
      }}
    />
  );
};

/**
 * 投稿カードコンポーネント！🫧
 * 押すと詳細、💬でリプライ、✨でいいね。
 */
const PostCard = ({ post, setIsModalOpen, isModalOpen, setModalImages, setModalIndex}: { 
  post: ActivityPubNoteInClient,
  setIsModalOpen: (isOpen: boolean) => void, 
  isModalOpen: boolean, 
  setModalImages: (images: ActivityPubImage[]) => void, 
  setModalIndex: (index: number) => void 
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReplyOpenState, setIsReplyOpenState] = useState(false);
  const { user: viewer } = useAuth();
  const isReplyOpen = isReplyOpenState && !!viewer;
  // ログインしていない人がリプライしようとしたら、ログイン画面へ
  const setIsReplyOpen = (open: boolean) => {
    if (open && !viewer) return void (window.location.href = "/login");
    setIsReplyOpenState(open);
  };
  const images: ActivityPubImage[] = post?.attachment?.flatMap((image: any) => {
    try { return [JSON.parse(image) as ActivityPubImage]; } catch { return []; }
  }) || [];

  if (!post?.id) return null;
  if (!post.published) return <LoadingSkeleton count={1} />;

  const user = post._user;
  const href = profileHref(user?.id || post.attributedTo, user?.preferredUsername);
  const isPublic = isPublicPost(post.to);

  return (
    <>
      <article
        className="flex cursor-pointer gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40"
        onClick={() => setIsDetailOpen(true)}
      >
        <div className="relative h-fit shrink-0">
          <Avatar
            src={user?.icon?.url}
            alt={user?.preferredUsername}
            href={href}
            fallback={user?.preferredUsername?.charAt(0)}
            size="md"
          />
          {isPublic && <PublicMark />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <header className="flex items-center gap-1.5 text-sm">
            <Link
              href={href}
              onClick={(e) => e.stopPropagation()}
              className="flex min-w-0 items-baseline gap-1.5 hover:underline"
            >
              <span className="truncate font-semibold text-foreground"><EmojiText text={user?.displayName || user?.preferredUsername} emojis={user?.emojis} /></span>
              <span className="truncate text-muted-foreground">@{user?.preferredUsername}</span>
            </Link>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-muted-foreground">
              <time dateTime={post.published} title={formatDate(post.published)} className="tabular-nums">
                {getShortRelativeTime(post.published)}
              </time>
              <LifeBubble published={post.published} />
            </span>
          </header>

          <ContentWarning summary={post.summary}>
          <PostContent content={post.content} emojis={post.emojis} className="text-[15px] leading-relaxed text-foreground" />

          {images.length > 0 ? (
            <div onClick={(e) => e.stopPropagation()} className="mt-1">
              <ImageModal
                images={images}
                setIsModalOpen={setIsModalOpen}
                isModalOpen={isModalOpen}
                ModalSwitch={true}
                setModalImages={setModalImages}
                setModalIndex={setModalIndex}
              />
            </div>
          ) : (
            <ContentsCard arg={post.content || ""} />
          )}
          </ContentWarning>

          <footer className="mt-0.5 flex items-center gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsReplyOpen(true);
              }}
              className="-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              aria-label={`@${user?.preferredUsername} にリプライ`}
              title="リプライ"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </button>
            <LikeButton
              postId={post.id}
              initialLikes={post.likes?.totalItems || 0}
              isPostLiked={post._isLiked || false}
              actorInbox={user?.inbox || ""}
              onLikeChange={() => {}}
              onLikeCountChange={() => {}}
            />
          </footer>
        </div>
      </article>

      {isDetailOpen && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}>
          <PostDetailCard 
            post={post.id} 
            initialPost={post}
            setIsDetailOpen={setIsDetailOpen} 
            setIsReplyOpen={setIsReplyOpen} 
            setIsModalOpen={setIsModalOpen} 
            isModalOpen={isModalOpen} 
            setModalImages={setModalImages} 
            setModalIndex={setModalIndex} 
          />
        </Modal>
      )}

      {isReplyOpen && (
        <Modal isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} className="max-w-xl">
          <div className="p-4 pt-14">
            <PostForm
              post={{ activityId: post.id, preferredUsername: user?.preferredUsername || "", attributedTo: user?.id || "", note: post }}
              onClose={() => setIsReplyOpen(false)}
            />
          </div>
        </Modal>
      )}
    </>
  );
};
export default PostCard;
