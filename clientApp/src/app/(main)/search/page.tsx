"use client";
import { Search } from "lucide-react";
import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/Button";
import { TimelineContent } from "@/components/features/timeline/TimelineContent";
import { ActivityPubNoteInClient } from "@/types/activitypub";

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q: string }> }) {
  const resolvedSearchParams = use(searchParams);
  const urlSearchParams = new URLSearchParams(resolvedSearchParams);
  const [searchText, setSearchText] = useState(urlSearchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState<ActivityPubNoteInClient[]>([]);
  const fetchData = async () => {
    const response = await fetch(`/api/search?q=${(await searchParams).q}`);
    const data : ActivityPubNoteInClient[] = await response.json();
    setSearchResults(data);
  };

  useEffect(() => {
    fetchData();
  }, []);
  return (<>
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
      <div className="w-full">
        <TimelineContent isLoading={false} posts={searchResults} error={null} />
      </div>
    </div>
    </>
  );
}