import LoadingScreen from "@/contents/loading";
import { getProfileScreen } from "@/feature/hooks";
import TargetProfile from "./targetprofile";
import Link from "next/link";
import { Button } from "@tremor/react";

const App = ({ username }: { username: string }) => {
  const user = getProfileScreen(username);
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
              {user.error.message}{" "}
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
