"use client";
import { Card } from "@tremor/react";
import { QueryClientProvider, QueryClient } from "react-query";
import App from "./app";
const queryClient = new QueryClient();
const Home = ({ params }: { params: { post: string } }) => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <App postId={params.post} />
      </QueryClientProvider>
    </>
  );
};
export default Home;
