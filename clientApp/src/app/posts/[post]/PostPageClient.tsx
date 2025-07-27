"use client"
import { useEffect, useState } from "react";
import PostDetailCard from "@/components/features/post/card/PostDetailCard";
import PostForm from "@/components/features/post/form/PostForm";
import { useAuth } from "@/hooks/auth/useAuth";

/**
 * 投稿詳細ページコンポーネント！✨
 * 投稿の詳細を表示して、リプライもできるよ！💖
 */
export default function PostPageClient({ postId }: { postId: string }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [post, setPost] = useState<any>(null)
    useEffect(() => {
        if (!user && !isAuthLoading) {
            window.location.href = "/login";
        }
    }, [user, isAuthLoading]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    return (
        <div className="justify-center items-center mx-auto max-w-2xl bg-white dark:bg-gray-800 rounded-2xl py-2 px-4  shadow-lg">
                <PostDetailCard 
                    post={`${process.env.NEXT_PUBLIC_DOMAIN}/posts/${postId}`} 
                    setIsDetailOpen={setIsDetailOpen} 
                    setIsReplyOpen={setIsReplyOpen} 
                    setIsModalOpen={setIsModalOpen} 
                    isModalOpen={isModalOpen}
                    setModalImages={()=>{}}
                    setModalIndex={()=>{}}
                    setPost={setPost}
                />
            {isReplyOpen && !isDetailOpen && user && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl py-2 px-4 mb-2 ">
                <PostForm post={{
                    activityId: `${process.env.NEXT_PUBLIC_DOMAIN}/posts/${postId}`,
                    preferredUsername: post?.actor?.preferredUsername || "",
                    attributedTo:post?.actor?.id || ""
                }} onClose={()=>{setIsReplyOpen(false)}} isReplyDisplay={false} />
                </div>
            )}
        </div>
    )
} 