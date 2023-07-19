"use client";
import { QueryClientProvider, QueryClient } from "react-query";
import App from "./app";
const queryClient = new QueryClient();
const Home = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
          <App  />
      </QueryClientProvider>
    </>
  );
};
export default Home;
