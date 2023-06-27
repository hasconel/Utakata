"use client";
import { QueryClientProvider, QueryClient } from "react-query";
import EmailVerify from "./app";
const queryClient = new QueryClient();
const Verification = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <span className="hidden">eメール認証画面</span>
        <EmailVerify />
      </QueryClientProvider>
    </>
  );
};
export default Verification;
