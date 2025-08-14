"use client";
import { Notification as NotificationType } from "@/lib/appwrite/posts";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { getActorById } from "@/lib/appwrite/database";
import { useState, useEffect } from "react";
import ReplyToPost from "../post/reply/ReplyToPost";
import PostReplies from "../post/reply/PostReplies";

/**
 * 通知コンポーネント！✨
 * キラキラな通知を表示するよ！💖
 */
export default function Notification({ notification }: { notification: NotificationType }) {
    const [post, setPost] = useState<any | null>(null);
    const [actor, setActor] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if(notification.type === "Reply" || notification.type === "Like"){
            setIsLoading(true);
            setPost(notification.target);
        }
        if(notification.from){
            setIsLoading(true);
            getActorById(notification.from).then((actor)=>{
                setActor(actor);
                setIsLoading(false);
            });
        }
    }, [notification]);

    return (
        <div className="w-full p-2">
            <Card className={`w-full ${notification.read ? "dark:bg-gray-800/80 bg-gray-100/80" : "dark:bg-gray-700/80 bg-gray-200/80"} backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 dark:border-purple-900`}>       
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 dark:border-pink-500"></div>
                    </div>
                ) : (
                    notification.type === "Like" && (
                    <div className="flex items-center gap-2 p-2 md:px-4">
                        <div className="hidden md:block">
                            <Avatar                
                                src={actor?.icon?.url}
                                alt={actor?.name}
                                fallback={actor?.displayName?.charAt(0)}
                                size="lg"
                                attributedTo={actor?.actorId}
                                variant="default"
                                className="ring-2 ring-purple-500/20 dark:ring-pink-500/20 hover:ring-purple-500/40 dark:hover:ring-pink-500/40 transition-all duration-300"
                            />
                            <span className="text-2xl bg-purple-500 dark:bg-pink-500 text-transparent bg-clip-text">✨️</span>
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-purple-600 dark:text-pink-400"><a href={actor?.id}>{actor?.name}</a></span>
                                <span className="text-gray-600 dark:text-gray-300">があなたの投稿をいいねしてくれたよ！</span>
                            </div>
                            {post && <ReplyToPost post={post} />}
                        </div>
                    </div>
                ))}
                {notification.type === "Follow" && (
                    <div className="flex items-center gap-2 p-2 md:px-4">
                        <div className="hidden md:block">
                            <Avatar      
                                src={actor?.icon?.url}
                                alt={actor?.name}
                                attributedTo={actor?.actorId}
                                fallback={actor?.displayName?.charAt(0)}
                                size="lg"
                                variant="default"
                                className="ring-2 ring-purple-500/20 dark:ring-pink-500/20 hover:ring-purple-500/40 dark:hover:ring-pink-500/40 transition-all duration-300"
                            />
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-purple-600 dark:text-pink-400"><a href={actor?.id}>{actor?.name}</a></span>
                                <span className="text-gray-600 dark:text-gray-300">がフォローしてくれたよ！</span>
                            </div>
                        </div>
                    </div>
                )}
                {notification.type === "Reply" && (
                    <div className="flex items-center gap-2 p-2 md:px-4">
                        <div className="hidden md:block">
                            <Avatar                
                                src={actor?.icon?.url}
                                alt={actor?.name}
                                fallback={actor?.displayName?.charAt(0)}
                                size="lg"
                                attributedTo={actor?.actorId}
                                variant="default"
                                className="ring-2 ring-purple-500/20 dark:ring-pink-500/20 hover:ring-purple-500/40 dark:hover:ring-pink-500/40 transition-all duration-300"
                            />
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-purple-600 dark:text-pink-400"><a href={actor?.id}>{actor?.name}</a></span>
                                <span >があなたの投稿にリプライしてくれたよ！</span>
                            </div>
                            {post && <PostReplies post={post} />}
                        </div>
                    </div>
                )}
            </Card>     
        </div>
    );
}

