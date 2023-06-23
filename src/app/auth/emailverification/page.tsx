"use client";
import { QueryClientProvider, QueryClient } from "react-query";
import EmailVerify from "./app";
const queryClient = new QueryClient();
const Home = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <EmailVerify />
      </QueryClientProvider>
    </>
  );
};
export default Home;
