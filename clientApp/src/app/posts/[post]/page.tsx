"use client"
import { useEffect, useState } from "react";
import PostDetailCard from "@/components/features/post/card/PostDetailCard";
//import { Post } from "@/lib/appwrite/posts";
import PostForm from "@/components/features/post/form/PostForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePost } from "@/hooks/usePost";
import { useActor } from "@/hooks/useActor";

/**
 * 投稿詳細ページコンポーネント！✨
 * 投稿の詳細を表示して、リプライもできるよ！💖
 */
export default function PostPage( { params }: { params: { post: string } }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { data: postData } = usePost(params.post);
    const { getActor } = useActor();
    const [actor, setActor] = useState<string | null>(null);
    const [actorData, setActorData] = useState<any | null>(null);
    useEffect(() => {
        if (!user && !isAuthLoading) {
            window.location.href = "/login";
        }
    }, [user, isAuthLoading]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    useEffect(() => {
        if(postData){
            getActor(postData?.attributedTo).then(({actor,name}) => {
                setActor(name);
                setActorData(actor);
            });
        }
    }, [postData]);
    return (
        <div className="justify-center items-center mx-auto max-w-2xl bg-white dark:bg-gray-800 rounded-2xl py-2 px-4  shadow-lg">
                <PostDetailCard 
                    post={`${process.env.NEXT_PUBLIC_DOMAIN}/posts/${params.post}`} 
                    setIsDetailOpen={setIsDetailOpen} 
                    setIsReplyOpen={setIsReplyOpen} 
                    setIsModalOpen={setIsModalOpen} 
                    isModalOpen={isModalOpen}
                    setModalImages={()=>{}}
                    setModalIndex={()=>{}}
                />
            {isReplyOpen && !isDetailOpen && user && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl py-2 px-4 mb-2 ">
                <PostForm post={{
                    activityId: `${process.env.NEXT_PUBLIC_DOMAIN}/posts/${params.post}`,
                    preferredUsername: actor || "",
                    attributedTo: actorData?.id || "",
                }} onClose={()=>{setIsReplyOpen(false)}} isReplyDisplay={false} />
                </div>
            )}
        </div>
    )
}