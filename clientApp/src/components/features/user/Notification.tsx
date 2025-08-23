"use client";
import { Notification as NotificationType } from "@/types/appwrite";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useEffect } from "react";
import ReplyToPost from "../post/reply/ReplyToPost";
import PostReplies from "../post/reply/PostReplies";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/api/useApi";

/**
 * 通知コンポーネント！✨
 * キラキラな通知を表示するよ！💖
 */
export default function Notification({ notification }: { notification: NotificationType }) {
    const [post, setPost] = useState<string | null>(null);
    const { data: actor, isLoading: isActorLoading } = useUser(notification.from);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        if(notification.type === "Reply" || notification.type === "Like"){
            setPost(notification?.target || null);
        }
        setIsLoading(false);
    }, [notification]);
    if(isLoading || isActorLoading ){
        return (
            <div className="flex items-center justify-center h-40 w-full bg-gray-100 dark:bg-gray-900 rounded-2xl">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="w-full p-2">
            <Card className={`w-full ${notification.read ? "dark:bg-gray-800/80 bg-gray-100/80" : "dark:bg-gray-700/80 bg-gray-200/80"} backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 dark:border-purple-900`}>       
                { (
                    notification.type === "Like" ? (
                        <div className="flex items-center gap-2 p-2 md:px-4">
                            <div className="hidden md:block">
                                <Avatar                
                                    src={actor?.icon?.url}
                                    alt={actor?.name}
                                    fallback={actor?.displayName?.charAt(0)}
                                    size="lg"
                                    attributedTo={actor?.id}
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
                                {post && <ReplyToPost post={post} setIsLoading={setIsLoading} />}
                            </div>
                        </div>
                    ) : notification.type === "Follow" ? (
                        <div className="flex items-center gap-2 p-2 md:px-4">
                            <div className="hidden md:block">
                                <Avatar      
                                    src={actor?.icon?.url}
                                    alt={actor?.name}
                                    attributedTo={actor?.id}
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
                    ) : notification.type === "Reply" ? (
                        <div className="flex items-center gap-2 p-2 md:px-4">
                            <div className="hidden md:block">
                                <Avatar                
                                    src={actor?.icon?.url}
                                    alt={actor?.name}
                                    fallback={actor?.displayName?.charAt(0)}
                                    size="lg"
                                    attributedTo={actor?.id}
                                    variant="default"
                                    className="ring-2 ring-purple-500/20 dark:ring-pink-500/20 hover:ring-purple-500/40 dark:hover:ring-pink-500/40 transition-all duration-300"
                                />
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-purple-600 dark:text-pink-400"><a href={actor?.id}>{actor?.name}</a></span>
                                    <span className="text-gray-600 dark:text-gray-300">があなたの投稿にリプライしてくれたよ！</span>
                                </div>
                                {post && <PostReplies post={post} setIsLoading={setIsLoading} />}
                            </div>
                        </div>
                    ) : (   
                        <div className="flex items-center justify-center h-40">
                            <p className="text-gray-500 dark:text-gray-400">不明な通知</p>
                        </div>
                    )
                    )
                }
            </Card>     
        </div>
    );
}

