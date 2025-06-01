"use client";
import PostCard from "@/components/features/post/card/PostCard";
import { Models } from "appwrite";
import { MeiliSearch } from "meilisearch";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
import { Search } from "lucide-react";
const meilisearch = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST!,
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY!,
});
import { Post } from "@/lib/appwrite/posts";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ActivityPubImage } from "@/types/activitypub/collections";
import ImageModalContent from "@/components/features/post/modal/ImageModalContent";
import { getPostFromActivityId } from "@/lib/appwrite/serverConfig";

export default function SearchPage() {
  const router = useRouter();
  const [, setCurrentUser] = useState<Models.User<Models.Preferences> | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<ActivityPubImage[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const checkSession = async () => {
    const currentUser = getLoggedInUser().then((user) => {
      if (!user) {
        router.push("/login");
      }
      setCurrentUser(user);
      return user;
    }).catch((err: any) => {
      console.log(err);
      router.push("/login");
    });
    return currentUser;
  }

  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await meilisearch.index("posts").search(search);
      const filteredPosts = (result.hits as Post[]).filter((post) => 
        post.$createdAt > new Date(Date.now() - 1000 * 60 * 60 * 84).toISOString()
      );
      const postlist = await Promise.all(filteredPosts.map(async (post) => {
        const postData = await getPostFromActivityId(post.activityId);
        return postData;
      }));
      setPosts(postlist);
      console.log(postlist);
    } catch (error) {
      console.error('検索に失敗したよ！💦', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-purple-100 dark:border-purple-900">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-8">
          検索 ✨
        </h1>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Textarea
              className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-purple-200 dark:border-purple-800 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-pink-500 focus:border-transparent transition-all duration-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="キーワードを入力してね！✨"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500 dark:text-pink-500" />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
          >
            検索
          </Button>
        </form>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 dark:border-purple-900">
          <div className="text-6xl mb-4 animate-bounce">🔍</div>
          <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
            検索結果はまだないよ！✨
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            別のキーワードで検索してみよう！💖
          </p>
        </div>
      ) : (
        <div className="space-y-6">
                {isModalOpen  && (
        <div className="fixed inset-0 z-50">
          <ImageModalContent 
          imagesTable={modalImages} 
          isModalOpen={isModalOpen} 
          setIsModalOpen={setIsModalOpen} 
          index={modalIndex}
        />
        </div>
      )}
          {posts.map((post) => (
            <PostCard key={post.$id} post={post} setIsModalOpen={setIsModalOpen} isModalOpen={isModalOpen} setModalImages={setModalImages} setModalIndex={setModalIndex} />
          ))}
        </div>
      )}
    </div>
  );
}