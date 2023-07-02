"use client";
import { QueryClientProvider, QueryClient } from "react-query";
import HomeSite from "./app";
const queryClient = new QueryClient();
const Home0 = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <HomeSite />
      </QueryClientProvider>
    </>
  );
};
export default Home0;
