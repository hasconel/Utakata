"use client"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PostDetailCard from "@/components/features/post/card/PostDetailCard";
import { Post } from "@/lib/appwrite/posts";
import PostForm from "@/components/features/post/form/PostForm";
import { useAuth } from "@/hooks/auth/useAuth";
 
export default function PostPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    useEffect(() => {
        if (!user && !isAuthLoading) {
            window.location.href = "/login";
        }
    }, [user, isAuthLoading]);
    const [document, setDocument] = useState<Post | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [error,setError]= useState<string | null>(null);
    const { post } = useParams();

    useEffect(() => {
        fetch(`/api/posts/${post}`)
            .then(res => res.json())
            .then(data => {
                setDocument(data);
            })
            .catch(err => {
                setError(err.message)
                //console.error(err);
            })
    }, [post]);

    return (
        <div className="justify-center items-center mx-auto max-w-2xl bg-white dark:bg-gray-800 rounded-2xl py-2 px-4  shadow-lg">
            {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 border-2 border-red-200 dark:border-red-800 animate-bounce">
                    <p className="font-bold">エラーが発生したよ！💦</p>
                    <p>{error}</p>
                </div>
            )}
            {document && (
                <PostDetailCard 
                    post={document} 
                    setIsDetailOpen={setIsDetailOpen} 
                    setIsReplyOpen={setIsReplyOpen} 
                    setIsModalOpen={setIsModalOpen} 
                    isModalOpen={isModalOpen}
                    setModalImages={()=>{}}
                    setModalIndex={()=>{}}
                />
            )}
            {isReplyOpen && document && !isDetailOpen && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl py-2 px-4 mb-2 ">
                <PostForm post={document} onClose={()=>{setIsReplyOpen(false)}} isReplyDisplay={false} />
                </div>
            )}
            {!document &&       <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-pink-500"></div>
      </div>}
        </div>
    )
}