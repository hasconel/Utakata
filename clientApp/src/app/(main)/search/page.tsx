"use client";
import PostCard from "@/components/features/post/card/PostCard";
import { Search } from "lucide-react";
import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/Button";
import { ActivityPubImage } from "@/types/activitypub/collections";
import ImageModalContent from "@/components/features/post/modal/ImageModalContent";

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q: string }> }) {
  const resolvedSearchParams = use(searchParams);
  const urlSearchParams = new URLSearchParams(resolvedSearchParams);
  const [searchText, setSearchText] = useState(urlSearchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/search?q=${searchText}`);
      const data = await response.json();
      setSearchResults(data);
    };
    fetchData();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<ActivityPubImage[]>([]);
  const [modalIndex, setModalIndex] = useState(0);

  return (<>
  <ImageModalContent imagesTable={modalImages} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} index={modalIndex} />
    <div className="flex flex-col items-center min-h-screen w-full max-w-2xl mx-auto gap-4 px-4">
      <div className="relative flex flex-row items-center justify-center w-full max-w-2xl">
        <input 
          type="text" 
          value={searchText} 
          onChange={(e) => setSearchText(e.target.value)} 
          className="w-full border-2 border-gray-300 rounded-full p-4" 
        />
        <Button 
          type="submit" 
          onClick={() => window.location.href = `/search?q=${searchText}`}
          className="absolute right-0 p-2 mr-2 rounded-full"
        >
          <Search />
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-4">
        {searchResults?.map((result: any, index: number) => {
          return (
            <PostCard key={index} post={result} setIsModalOpen={setIsModalOpen} isModalOpen={isModalOpen} setModalImages={setModalImages} setModalIndex={setModalIndex} />
          )
        })}
      </div>
    </div>
    </>
  );
}