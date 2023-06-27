import { GetLoginUser } from "@/feature/hooks";
import LoadingScreen from "@/contents/loading";
import { redirect } from "next/navigation";
import { Card, Grid } from "@tremor/react";
import UserHome from "./userhome";
const HomeSite = () => {
  const { data, isLoading, isError, error } = GetLoginUser();
  return (
    <>
      <Grid numItemsMd={1} numItemsLg={3} className="gap-4 mx-auto  mt-8">
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            {data ? (
              <Card className="max-w-4xl col-start-2 mt-8 gap-6">
                <UserHome uid={data} />
              </Card>
            ) : (
              <>{redirect("/")} </>
            )}
          </>
        )}
      </Grid>{" "}
    </>
  );
};
export default HomeSite;
