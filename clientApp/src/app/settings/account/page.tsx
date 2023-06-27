"use client";
import { QueryClientProvider, QueryClient } from "react-query";
import AccountSetting from "./app";
const queryClient = new QueryClient();
const settingsProfile = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AccountSetting />
      </QueryClientProvider>
    </>
  );
};
export default settingsProfile;
