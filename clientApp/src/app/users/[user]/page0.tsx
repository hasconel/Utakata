"use client";
import { QueryClient, QueryClientProvider } from "react-query";
import App from "./app";
import { Card } from "@tremor/react";

const queryClient = new QueryClient();
const UserPage0 = ({ params }: { params: { user: string } }) => {

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Card className="max-w-4xl mx-auto mt-8 gap-6">
          <App username={params.user} />
        </Card>

      </QueryClientProvider>
    </>
  );
};
export default UserPage0;
