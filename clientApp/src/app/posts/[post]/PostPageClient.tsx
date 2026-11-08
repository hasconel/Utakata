"use client";

import { useEffect, useState } from "react";
import PostDetailCard from "@/components/features/post/card/PostDetailCard";
import PostForm from "@/components/features/post/form/PostForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/hooks/auth/useAuth";
import { FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { actorHandle } from "@/lib/utils";

/**
 * 投稿のページ🫧
 * 投稿の詳細の下に、リプライの入力欄をいつも出しておく。
 */
export default function PostPageClient({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const activityId = `${process.env.NEXT_PUBLIC_DOMAIN}/posts/${postId}`;

  // 削除したらタイムラインへ戻る
  useEffect(() => {
    const onDeleted = () => (window.location.href = "/timeline");
    window.addEventListener("postDeleted", onDeleted);
    return () => window.removeEventListener("postDeleted", onDeleted);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <PageHeader backHref={user ? "/timeline" : "/"} />
      <section className={FEED_SURFACE}>
        <PostDetailCard
          post={activityId}
          reloadToken={reloadToken}
          setIsDetailOpen={() => {}}
          // ページでは入力欄が下にあるので、リプライボタンはそこへ移動する
          // ログインしていなければログイン画面へ
          setIsReplyOpen={() =>
            user ? document.getElementById("reply-form")?.querySelector("textarea")?.focus() : (window.location.href = "/login")
          }
          setIsModalOpen={setIsModalOpen}
          isModalOpen={isModalOpen}
          setModalImages={() => {}}
          setModalIndex={() => {}}
          setPost={setPost}
        />
      </section>

      {user && post?.id && (
        <section id="reply-form" className={`${FEED_SURFACE} p-3`}>
          <PostForm
            post={{
              activityId: post.id,
              preferredUsername: actorHandle(post._user?.id || post.attributedTo || "", post._user?.preferredUsername || ""),
              attributedTo: post._user?.id || "",
            }}
            isReplyDisplay={false}
            refreshTimeline={() => setReloadToken((n) => n + 1)}
          />
        </section>
      )}
    </div>
  );
}
