"use client";
import Genque from "@/contents/genque";
import LoadingScreen from "@/contents/loading";
import ModalWindow from "@/contents/modal";
import ListOfUser from "@/contents/userlist";
import { GetLoginUser, GetRankingList, GetSingleGenque } from "@/feature/hooks";
import { UserGroupIcon } from "@heroicons/react/20/solid";
import { UserGroupIcon as OutlineUserGroupIcon } from "@heroicons/react/24/outline";
import { Card, Metric } from "@tremor/react";
import { Models } from "appwrite";
import { useState } from "react";

const App = () => {
  const [isModal, setIsModal] = useState<boolean>(false);
  const [modalWindow, setModalWindow] = useState<JSX.Element>(<></>);
  const LoginUser = GetLoginUser();
  const RankingList = GetRankingList();
  const getGoodUserList = (arg: string[]) => {
    setModalWindow(
      <>
        <div className="rounded-md w-full max-w-3xl dark:bg-slate-900 p-4 bg-slate-50">
          {arg[0] ? (
            <div className="w-full">
              <div className="text-sm w-96">GOODしているユーザー</div>
              <div className="max-h-80 overflow-y-scroll">
                {arg.map((user: string) => {
                  return (
                    <div key={user} className="mt-1">
                      <ListOfUser key={user} target={user} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>GOODしているユーザーはいません</>
          )}
        </div>
      </>
    );
    setIsModal(true);
  };
  const GenqueW = ({
    target,
  }: {
    target: {
      Good: Models.Document;
      data: Models.Document;
      user: Models.Document;
    };
  }) => {
    return (
      <>
        {LoginUser.data ? (
          <div className="col-start-2 w-full grid grid-cols-1 sm:grid-cols-[1fr_40px] gap-2 z-0">
            <div className="col-start-1">
              <Genque
                ModalContentsFunc={setModalWindow}
                setModalBoolean={setIsModal}
                currentUserId={LoginUser.data.user.$id}
                UserDoc={target.user}
                data={target.data}
              />
            </div>
            <div className="sm:col-start-2 mb-1 flex justify-center items-center h-full w-full">
              <button
                className="w-full p-1 rounded text-center grid gap-2 grid-cols-2 sm:grid-cols-1 hover:bg-slate-500 dark:bg-slate-600 bg-slate-400"
                onClick={() => getGoodUserList(target.Good.GoodedUsers)}
              >
                {target.Good.GoodedUsers.includes(LoginUser.data.user.$id) ? (
                  <>
                    <div className="flex justify-end items-center my-auto sm:justify-center">
                      <UserGroupIcon className="h-5 sm:h-8" />
                    </div>

                    <div className="text-left sm:text-center my-auto">
                      {target.Good.GoodedUsers.length}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-end items-center my-auto sm:justify-center">
                      <OutlineUserGroupIcon className="h-5 sm:h-8" />
                    </div>
                    {target.Good.GoodedUsers.length > 0 && (
                      <div className="text-left sm:text-center my-auto">
                        {target.Good.GoodedUsers.length}
                      </div>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>削除されたつぶやき</>
        )}
      </>
    );
  };
  return (
    <>
      {" "}
      <Card className="max-w-4xl mx-auto mt-8">
        <Metric className="text-center w-full">Goodランキング</Metric>
        <div className="border-t-2 mt-3 border-gray-500">
          {RankingList.isLoading ? (
            <>
              <LoadingScreen />
            </>
          ) : (
            <>
              {RankingList.data && (
                <>
                  {RankingList.data
                    .sort((a, b) => {
                      return (
                        b.Good.GoodedUsers.length - a.Good.GoodedUsers.length
                      );
                    })
                    .map((d, index) => {
                      return (
                        <div
                          key={d.data.$id}
                          className="grid gap-1 border-b border-dark-tremor-content grid-cols-[32px_1fr] "
                        >
                          <div className="w-full text-center text-xl font-black my-auto">
                            {index + 1}
                          </div>
                          <GenqueW target={d} />{" "}
                        </div>
                      );
                    })}
                </>
              )}
            </>
          )}
        </div>{" "}
      </Card>{" "}
      <ModalWindow
        contents={modalWindow}
        Boolean={isModal}
        SetBoolean={setIsModal}
        fullContents={true}
      />
    </>
  );
};
export default App;
