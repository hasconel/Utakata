"use client";
import { GetLoginUser } from "@/feature/hooks";
import LoadingScreen from "@/contents/loading";
import { redirect } from "next/navigation";
import { Card } from "@tremor/react";
import UserHome from "./userhome";
const HomeSite = ({ Time }: { Time?: string }) => {
  const { data, isLoading, isError, error } = GetLoginUser();
  return (
    <>
      <Card className="grid max-w-4xl col-start-2 mt-4 mx-auto gap-6">
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            {data ? <UserHome uid={data} Time={Time} /> : <>{redirect("/")} </>}
          </>
        )}
      </Card>{" "}
    </>
  );
};
export default HomeSite;
