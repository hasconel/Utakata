"use client";
import { QueryClientProvider, QueryClient } from "react-query";
import App from "./app";
import { useSearchParams } from "next/navigation";
import { Query } from "appwrite";
const queryClient = new QueryClient();
const Home = () => {
  let DecodedQuery = "";
  const [searchParams, setSearchParams] = useSearchParams();
  if (searchParams[0] === "q" && searchParams[1]) {
    DecodedQuery = decodeURIComponent(searchParams[1]);
  }
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <App query={DecodedQuery}/>
      </QueryClientProvider>
    </>
  );
};
export default Home;
