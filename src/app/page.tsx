"use client";
import LoginForm from "@/contents/loginform";
import { QueryClient } from "react-query";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: true,
      refetchInterval: 15 * 1000,
      cacheTime: 10 * 1000,
    },
  },
});

const DEBUG = true;

export default function Home() {
  return (
    <>
      <LoginForm />
    </>
  );
}
