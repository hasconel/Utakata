import LoadingScreen from "@/contents/loading";
import { GetProfileScreen } from "@/feature/hooks";
import TargetProfile from "./targetprofile";
import Link from "next/link";
import { Button } from "@tremor/react";
import { AlertMessage } from "@/contents/alert";

const App = ({ username }: { username: string }) => {
  const user = GetProfileScreen(username);
  return (
    <>
      {user.isLoading ? (
        <>
          <div className="flex justify-center">
            <LoadingScreen />
          </div>
        </>
      ) : (
        <>
          {user.isError ? (
            <>
              {user.error != null && (
                <>
                  {typeof user.error === "object" && (
                    <>
                      {"message" in user.error && (
                        <>
                          {typeof user.error.message === "string" && (
                            <AlertMessage message={user.error.message} />
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              <Link href="/">
                <Button>ホームへ戻る</Button>
              </Link>
            </>
          ) : (
            <>
              {" "}
              <>
                {user.data?.username && (
                  <TargetProfile
                    uname={user.data?.username}
                    current={user.data.isCurrentUser}
                  />
                )}
              </>
            </>
          )}
        </>
      )}
    </>
  );
};
export default App;
