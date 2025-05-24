"use client"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PostCard from "@/components/features/post/PostCard";
import { Post } from "@/lib/appwrite/posts";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";

export default function PostPage() {
    const [document, setDocument] = useState<Post | null>(null);
    const [canDelete, setCanDelete] = useState(false);
    const { post } = useParams();
    useEffect(() => {
        fetch(`/api/posts/${post}`)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                setDocument(data);
            })
            .catch(err => {
                console.error(err);
            })
    }, [post]);
    return (
        <div className="m-5 justify-center items-center mx-auto max-w-2xl">
            {document && <PostCard post={document} />}
            {!document && <div>Loading...</div>}
        </div>
    )
}