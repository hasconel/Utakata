"use client";
import { Notification as NotificationType } from "@/lib/appwrite/posts";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { getActorById } from "@/lib/appwrite/database";
import { getPostFromActivityId as fetchPostFromActivityId } from "@/lib/appwrite/serverConfig";
import { useState, useEffect } from "react";


export default function Notification({ notification }: { notification: NotificationType }) {
    const [post, setPost] = useState<any | null>(null);
    const [actor, setActor] = useState<any | null>(null);
    useEffect(() => {
        const fromActor = getActorById(notification.from).then(actor=>{
            setActor(actor);
        });
        if(notification.target){
            const post = fetchPostFromActivityId(notification.target).then(post=>{
                setPost(post);
            });
        }
    }, []);
    return (
        <div className="w-full">
             <Card className={`w-full ${notification.read ? "dark:bg-gray-800 bg-gray-100" : "dark:bg-gray-700 bg-gray-200"} flex flex-col gap-2 p-2`}>       
                {notification.type === "like" && <div className="flex flex-row gap-2">
                    <p>{notification.message}</p>
                    <Avatar                
                     src={actor?.avatarUrl}
                     alt={actor?.name}
                     fallback={actor?.displayName?.charAt(0)}
                     size="lg"
                     variant="outline"
                     className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"/>
                    <p>{actor?.name}</p>
                    <p className="text-sm">{post?.content}</p>
                </div>}
                {notification.type === "follow" && <div className="flex flex-row gap-2">
                    <p>{notification.message}</p>
                    <Avatar                
                     src={actor?.avatarUrl}
                     alt={actor?.name}
                     fallback={actor?.displayName?.charAt(0)}
                     size="lg"
                     variant="outline"
                     className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"/>                    
                     <p className="text-sm">{actor?.name}</p>
                </div>}
                {notification.type === "reply" && <div className="flex flex-row gap-2">
                    <p>{notification.message}</p>
                    <Avatar                
                     src={actor?.avatarUrl}
                     alt={actor?.name}
                     fallback={actor?.displayName?.charAt(0)}
                     size="lg"
                     variant="outline"
                     className="bg-gradient-to-br from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600"/>                    
                     <p className="text-sm">{actor?.name}</p>
                    <p>{post?.content}</p>
                </div>}
            </Card>     
            
        </div>
    )
}

