"use client";
import { Notification as NotificationType } from "@/lib/appwrite/posts";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { getActorById } from "@/lib/appwrite/database";
import { getPostFromActivityId as fetchPostFromActivityId } from "@/lib/appwrite/serverConfig";
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
        if(notification.target){
            setIsLoading(true);
            fetchPostFromActivityId(notification.target).then((post)=>{
                setPost(post);
                setIsLoading(false);
            });
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
                    notification.type === "like" && (
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex-shrink-0">
                            <Avatar                
                                src={actor?.avatarUrl}
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
                                <span className="font-bold text-purple-600 dark:text-pink-400">{actor?.name}</span>
                                <span className="text-2xl ">💖</span>
                            </div>
                            {post && <ReplyToPost post={post} />}
                        </div>
                    </div>
                ))}
                {notification.type === "follow" && (
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex-shrink-0">
                            <Avatar      
                                src={actor?.avatarUrl}
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
                                <span className="font-bold text-purple-600 dark:text-pink-400">{actor?.name}</span>
                                <span className="text-2xl animate-pulse">✨</span>
                                <span className="text-gray-600 dark:text-gray-300">がフォローしてくれたよ！</span>
                            </div>
                        </div>
                    </div>
                )}
                {notification.type === "reply" && (
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex-shrink-0">
                            <Avatar                
                                src={actor?.avatarUrl}
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
                                <span className="font-bold text-purple-600 dark:text-pink-400">{actor?.name}</span>
                                <span className="text-2xl ">💭</span>
                            </div>
                            {post && <PostReplies post={post} />}
                        </div>
                    </div>
                )}
            </Card>     
        </div>
    );
}

