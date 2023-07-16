"use client";
import { Card } from "@tremor/react";
import { QueryClientProvider, QueryClient } from "react-query";
import App from "./app";
const queryClient = new QueryClient();
const Home = ({ params }: { params: { post: string } }) => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Card className="max-w-4xl mx-auto mt-8">
          <App postId={params.post} />
        </Card>
      </QueryClientProvider>
    </>
  );
};
export default Home;
