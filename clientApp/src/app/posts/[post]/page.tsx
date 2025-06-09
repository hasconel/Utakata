"use client"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PostDetailCard from "@/components/features/post/card/PostDetailCard";
import { Post } from "@/lib/appwrite/posts";
import PostForm from "@/components/features/post/form/PostForm";

export default function PostPage() {
    const [document, setDocument] = useState<Post | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { post } = useParams();

    useEffect(() => {
        fetch(`/api/posts/${post}`)
            .then(res => res.json())
            .then(data => {
                setDocument(data);
            })
            .catch(err => {
                console.error(err);
            })
    }, [post]);

    return (
        <div className="justify-center items-center mx-auto max-w-2xl bg-white dark:bg-gray-800 rounded-2xl py-2 px-4  shadow-lg">
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