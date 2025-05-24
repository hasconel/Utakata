"use client";
import PostCard from "@/components/features/post/PostCard";
import { Models } from "appwrite";
import { MeiliSearch } from "meilisearch";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
import { Loader2 } from "lucide-react";
const meilisearch = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST!,
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY!,
});
import { Post } from "@/lib/appwrite/posts";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
export default  function  SearchPage() {
    const router = useRouter();
    const [currentUser,setCurrentUser] = useState<Models.User<Models.Preferences> | undefined>(undefined);
    const checkSession = async () => {
        const currentUser = getLoggedInUser().then((user)=>{
            if(!user){
                router.push("/login");
            }
            setCurrentUser(user);
            return user;
        }).catch((err:any)=>{
            console.log(err);
            router.push("/login");
        });
        return currentUser;
    }

    const [search,setSearch] = useState("");
    const [posts,setPosts] = useState<Post[]>([]);
    const [isLoading,setIsLoading] = useState(false);
    const [error,setError] = useState<string | null>(null);
    useEffect(()=>{
        checkSession();
    },[]);
    useEffect(()=>{
        setIsLoading(true);
        const getPosts = async () => {
            const posts = (await meilisearch.index("posts").search(search)).hits as Post[];
            //console.log(posts)
            const filteredPosts = posts.filter((post)=>post.$createdAt > new Date(Date.now() - 1000 * 60 * 60 * 84).toISOString());
            setPosts(filteredPosts);
        }
        setIsLoading(false);
        getPosts();
    },[search]);
    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {}
  return <div className="max-w-2xl mx-auto min-h-screen my-8 mb-4 px-4 py-8">
    {isLoading && <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin" />
    </div>}
    <div className="group relative px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-red-200 dark:border-red-800">
        <form onSubmit={handleSearch}>
            <Textarea className="w-full" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <Button className="w-40 h-10" type="submit">検索</Button>
        </form>
    </div>
    <div className="space-y-4">
    {posts.map((post)=>(
        <PostCard key={post.$id} post={post} />
    ))}</div>
  </div>;
}