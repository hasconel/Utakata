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
        <div className="m-5 justify-center items-center mx-auto max-w-2xl">
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
                <PostForm post={document} onClose={()=>{setIsReplyOpen(false)}} isReplyDisplay={false} />
            )}
            {!document && <div>Loading...</div>}
        </div>
    )
}