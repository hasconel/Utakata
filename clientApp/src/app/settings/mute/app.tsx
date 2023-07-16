import LoadingScreen from "@/contents/loading";
import MuteButton from "@/contents/muteButton";
import ListOfUser from "@/contents/userlist";
import { GetLoginUser } from "@/feature/hooks";
import { Metric } from "@tremor/react";

const App = () => {
  const User = GetLoginUser();
  return (
    <>
      <Metric className="">ミュート中のユーザー</Metric>
      {User.isLoading ? (
        <div className="flex justify-center items-center">
          <LoadingScreen />
        </div>
      ) : (
        <>
          {User.data && (
            <>
              {User.data.data.MuteUserId.map((d: string) => {
                return (
                  <div
                    key={d}
                    className="grid grid-cols-[2fr_1fr] gap-6 grid-rows-1 mt-2 h-12"
                  >
                    <div className="col-start-1">
                      <ListOfUser target={d} />
                    </div>{" "}
                    <div className="col-start-2">
                      {User.data && (
                        <MuteButton
                          className="w-full h-full rounded"
                          targetUser={d}
                          currentUserId={User.data.user.$id}
                          UserMuteList={User.data.data.MuteUserId}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </>
  );
};
export default App;
