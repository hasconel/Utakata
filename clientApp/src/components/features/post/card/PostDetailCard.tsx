"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, MessageCircle, Trash2, Users } from "lucide-react";
import { PublicMark, isPublicPost } from "@/components/features/post/PublicMark";
import { Avatar } from "@/components/ui/Avatar";
import ImageModal from "../modal/ImageModal";
import ContentsCard from "@/components/ui/ContentsCard";
import Modal from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { ActivityPubActor, ActivityPubNoteInClient } from "@/types/activitypub";
import ReplyToPost from "@/components/features/post/reply/ReplyToPost";
import PostReplies from "@/components/features/post/reply/PostReplies";
import PostContent from "@/components/features/post/PostContent";
import { EmojiText } from "@/components/features/post/EmojiText";
import { ContentWarning } from "@/components/features/post/ContentWarning";
import { LikeButton } from "./PostCard";
import { fetchActors } from "@/lib/api/actors";
import { getLikedActivities } from "@/lib/appwrite/serverConfig";
import { formatDate } from "@/lib/utils/date";
import { actorHandle, profileHref } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";

const iconButton =
  "-ml-2 inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-primary";

/** いいねした人の一覧（開いたときだけ取得する） */
function LikedUsersModal({ isOpen, onClose, postId }: { isOpen: boolean; onClose: () => void; postId: string }) {
  const [users, setUsers] = useState<ActivityPubActor[] | null>(null);
  useEffect(() => {
    if (!isOpen || !postId) return;
    let cancelled = false;
    setUsers(null);
    (async () => {
      const activities = await getLikedActivities(postId).catch(() => []);
      const ids = [...new Set((activities as any[]).map((a) => a.actor as string))];
      // 外のサーバーの人もまとめて読む（以前はこのサーバーの人しか出ていなかった）
      const actors = await fetchActors(ids).catch(() => []);
      if (!cancelled) setUsers(actors);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, postId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
      <div className="p-3 pt-14">
        {users === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <ul className="flex flex-col">
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  href={profileHref(user.id, user.preferredUsername)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent"
                >
                  <Avatar src={user.icon?.url} alt={user.preferredUsername} fallback={user.preferredUsername?.charAt(0)} size="md" interactive={false} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-foreground"><EmojiText text={user.displayName || user.name || user.preferredUsername} emojis={user.emojis} /></span>
                    <span className="truncate text-sm text-muted-foreground">@{actorHandle(user.id, user.preferredUsername)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/** 投稿が見つからないとき */
function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
      <div aria-hidden className="relative h-14 w-14">
        <span className="absolute inset-2 rounded-full border-2 border-dashed border-current opacity-40" />
        <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-current opacity-30" />
      </div>
      <p className="text-sm">この投稿はもう見られないみたい🫧</p>
      <Link
        href="/timeline"
        aria-label="タイムラインへ"
        title="タイムラインへ"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
      >
        <Home className="h-5 w-5" />
      </Link>
    </div>
  );
}

/**
 * 投稿の詳細🫧
 * リプライ先 → 投稿 → 操作 → リプライ一覧 の順に縦に並べる。
 * モーダルの中（タイムラインから開いたとき）と、投稿のページの両方で使う。
 */
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
  reloadToken = 0,
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
  /** 変えると取得し直す（リプライを送ったあとなど） */
  reloadToken?: number;
}) {
  const [postData, setPostData] = useState<ActivityPubNoteInClient | null>(initialPost ?? null);
  const [parentPost, setParentPost] = useState<ActivityPubNoteInClient | null>(null);
  const [replies, setReplies] = useState<ActivityPubNoteInClient[]>([]);
  const [isPostLoading, setIsPostLoading] = useState(!initialPost);
  const [isLiked, setIsLiked] = useState(initialPost?._isLiked || false);
  const [likeCount, setLikeCount] = useState(initialPost?.likes?.totalItems || 0);
  const [isLikedUsersOpen, setIsLikedUsersOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, reloadToken]);

  useEffect(() => {
    setIsLiked(postData?._isLiked || false);
    setLikeCount(postData?.likes?.totalItems || 0);
    setPost?.(postData ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postData]);

  const handleDelete = async () => {
    if (!postData?.id || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postData.id.split("/").pop()}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      setIsDeleteOpen(false);
      setIsDetailOpen(false);
      setIsModalOpen(false);
      // 一覧から消す
      window.dispatchEvent(new CustomEvent("postDeleted", { detail: { postId: postData.id } }));
    } catch {
      showToast("投稿を消せなかったの…もう一回試してみて💦");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isPostLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!postData || !postData.published) return <NotFound />;

  const user = postData._user;
  const href = profileHref(user?.id || postData.attributedTo, user?.preferredUsername);
  const images: ActivityPubImage[] =
    postData.attachment?.flatMap((image: any) => {
      try {
        return [JSON.parse(image) as ActivityPubImage];
      } catch {
        return [];
      }
    }) || [];
  const isPublic = isPublicPost(postData.to, postData.cc);

  return (
    <div className="flex flex-col">
      {/* 右上はモーダルの×ボタンの場所なので空けておく */}
      {parentPost && (
        <div className="pl-4 pr-14 pt-4">
          <ReplyToPost note={parentPost} />
        </div>
      )}

      <article className={`flex flex-col gap-3 px-4 pb-3 ${parentPost ? "pt-3" : "pt-4"}`}>
        <header className="flex items-center gap-3 pr-10">
          <div className="relative shrink-0">
            <Avatar src={user?.icon?.url} alt={user?.preferredUsername} href={href} fallback={user?.preferredUsername?.charAt(0)} size="lg" />
            {isPublic && <PublicMark size="lg" />}
          </div>
          <Link href={href} className="flex min-w-0 flex-col hover:underline">
            <span className="truncate font-semibold text-foreground"><EmojiText text={user?.displayName || user?.preferredUsername} emojis={user?.emojis} /></span>
            <span className="truncate text-sm text-muted-foreground">@{actorHandle(user?.id || postData.attributedTo, user?.preferredUsername || "")}</span>
          </Link>
        </header>

        <ContentWarning summary={postData.summary}>
        <PostContent content={postData.content} emojis={postData.emojis} className="text-[17px] leading-relaxed text-foreground" />

        {images.length > 0 ? (
          <div onClick={(e) => e.stopPropagation()}>
            <ImageModal
              images={images}
              setIsModalOpen={setIsModalOpen}
              isModalOpen={isModalOpen}
              ModalSwitch={false}
              setModalImages={setModalImages}
              setModalIndex={setModalIndex}
            />
          </div>
        ) : (
          <ContentsCard arg={postData.content || ""} />
        )}
        </ContentWarning>

        {/* 詳細では正確な日時を出す */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <time dateTime={postData.published} className="tabular-nums">
            {formatDate(postData.published)}
          </time>
        </div>

        <footer className="flex items-center gap-4 border-t border-border pt-2">
          <button
            type="button"
            onClick={() => {
              setIsDetailOpen(false);
              setIsReplyOpen(true);
            }}
            className={iconButton}
            aria-label={`@${user?.preferredUsername} にリプライ`}
            title="リプライ"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            {replies.length > 0 && <span className="tabular-nums">{replies.length}</span>}
          </button>
          <LikeButton
            postId={postData.id || ""}
            isPostLiked={isLiked}
            initialLikes={likeCount}
            actorInbox={user?.inbox || ""}
            onLikeChange={setIsLiked}
            onLikeCountChange={setLikeCount}
          />
          {likeCount > 0 && (
            <button
              type="button"
              onClick={() => setIsLikedUsersOpen(true)}
              className={iconButton}
              aria-label="いいねした人"
              title="いいねした人"
            >
              <Users className="h-[18px] w-[18px]" />
            </button>
          )}
          {postData._canDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="投稿を削除"
              title="削除"
            >
              <Trash2 className="h-[18px] w-[18px]" />
            </button>
          )}
        </footer>
      </article>

      {replies.length > 0 && (
        <div className="divide-y divide-border border-t border-border">
          {replies.map((reply) => (
            <PostReplies key={reply.id} note={reply} />
          ))}
        </div>
      )}

      <LikedUsersModal isOpen={isLikedUsersOpen} onClose={() => setIsLikedUsersOpen(false)} postId={post} />
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="この投稿を削除する？"
        description="消した投稿は元に戻せないわ。"
        confirmLabel="削除"
      />
    </div>
  );
}
