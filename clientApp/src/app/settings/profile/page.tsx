"use client";
import { QueryClientProvider, QueryClient } from "react-query";
import ProfileSetting from "./app";
const queryClient = new QueryClient();
const settingsProfile = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ProfileSetting />
      </QueryClientProvider>
    </>
  );
};
export default settingsProfile;
