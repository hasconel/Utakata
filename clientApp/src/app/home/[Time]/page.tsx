"use client";
import { QueryClientProvider, QueryClient } from "react-query";
import HomeSite from "../app";
const queryClient = new QueryClient();
const Home = ({ params }: { params: { Time: string } }) => {
  const DecodedTime = decodeURIComponent(params.Time);
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <HomeSite Time={DecodedTime} />
      </QueryClientProvider>
    </>
  );
};
export default Home;
