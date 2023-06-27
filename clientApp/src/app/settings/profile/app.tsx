import { GetLoginUser } from "@/feature/hooks";
import LoadingScreen from "@/contents/loading";
import { redirect } from "next/navigation";
import { Card } from "@tremor/react";
import ProfileImageUpload from "./imageUpload";
const ProfileSetting = () => {
  const { data, isLoading, isError, error } = GetLoginUser();
  return (
    <>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {data ? (
            <Card className="max-w-4xl mx-auto mt-8 gap-6">
              <ProfileImageUpload uid={data} />
            </Card>
          ) : (
            <>{redirect("/")} </>
          )}
        </>
      )}
    </>
  );
};
export default ProfileSetting;
