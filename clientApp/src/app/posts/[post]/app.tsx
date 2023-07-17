import Genque from "@/contents/genque";
import LoadingScreen from "@/contents/loading";
import ModalWindow from "@/contents/modal";
import ListOfUser from "@/contents/userlist";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import {
  GetGenqueStream,
  GetLoginUser,
  GetSingleGenque,
} from "@/feature/hooks";
import { Card, Metric } from "@tremor/react";
import { Models, Query } from "appwrite";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";

const App = ({ postId }: { postId: string }) => {
  const [isModal, setIsModal] = useState<boolean>(false);
  const [modalWindow, setModalWindow] = useState<JSX.Element>(<></>);
  const LoginUser = GetLoginUser();
  const getGoodUserList = (arg: string) => {
    if (Server.databaseID && Server.subCollectionID) {
      api
        .getDocument(Server.databaseID, Server.subCollectionID, arg)
        .then((d) => {
          setModalWindow(
            <>
              <div className="rounded-md w-full max-w-3xl dark:bg-slate-900 p-4 bg-slate-50">
                {d.GoodedUsers[0] ? (
                  <div className="w-full">
                    <div className="text-sm w-96">GOODしているユーザー</div>
                    <div className="max-h-80 overflow-y-scroll">
                      {d.GoodedUsers.map((user: string) => {
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
        })
        .catch((e) => {
          setModalWindow(
            <>
              <div className="rounded-md w-full max-w-3xl dark:bg-slate-900 p-8 bg-slate-50">
                error
              </div>
            </>
          );
        });
    } else {
      setModalWindow(
        <>
          <Card className="max-w-xl px-4 py-4 rounded dark:bg-slate-900 ">
            エラー
          </Card>
        </>
      );
    }
    setIsModal(true);
  };
  const [ReplyTarget, setReplyTarget] = useState<string[]>([]);
  const forrep = async () => {
    const TempTarget: string[] = [];
    if (Server.databaseID && Server.collectionID) {
      const first = await api.getDocument(
        Server.databaseID,
        Server.collectionID,
        postId
      );
      if (typeof first.replyTo === "string") {
        TempTarget.push(first.replyTo);
      }
    } else {
      return;
    }
    for (let index = 0; index < 5; index++) {
      if (Server.databaseID && Server.collectionID && TempTarget[index]) {
        const arg = await api.getDocument(
          Server.databaseID,
          Server.collectionID,
          TempTarget[index]
        );
        if (typeof arg.replyTo === "string") {
          TempTarget.push(arg.replyTo);
        }
      } else {
        break;
      }
    }
    setReplyTarget([...new Set(TempTarget)].reverse());
  };
  useEffect(() => {
    forrep();
  }, []);
  const ReplyFromList = GetGenqueStream([Query.equal("replyTo", [postId])]);
  const GenqueW = ({ target }: { target: string }) => {
    const Triger = GetSingleGenque(target);
    return (
      <>
        {Triger.isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            {LoginUser.data && Triger.data ? (
              <Genque
                ModalContentsFunc={setModalWindow}
                setModalBoolean={setIsModal}
                currentUserId={LoginUser.data.user.$id}
                UserDoc={Triger.data.User}
                data={Triger.data.Doc}
              />
            ) : (
              <>存在しないつぶやき</>
            )}
          </>
        )}
      </>
    );
  };
  return (
    <>
      {" "}
      <ModalWindow
        contents={modalWindow}
        Boolean={isModal}
        SetBoolean={setIsModal}
        fullContents={true}
      />
      <div className="grid grid-cols-[32px_1fr]">
        <div className="col-start-2">
          {ReplyTarget.map((d) => {
            return (
              <div key={d}>
                <GenqueW key={d} target={d} />
              </div>
            );
          })}
        </div>
        <div className="col-start-1 col-span-2">
          <GenqueW target={postId} />
          <button
            className="w-full p-1 rounded hover:bg-slate-500 dark:bg-slate-600 bg-slate-400"
            onClick={() => getGoodUserList(postId)}
          >
            Goodしているユーザーを表示
          </button>
        </div>
        <div className="col-start-2 mt-2">
          {ReplyFromList.isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingScreen />
            </div>
          ) : (
            <>
              {ReplyFromList.data && (
                <>
                  {ReplyFromList.data.docs.map((d) => {
                    if (ReplyFromList.data) {
                      const UserDataDoc = ReplyFromList.data.userList.find(
                        (arg) => arg.$id === d.createUserId
                      );
                      if (UserDataDoc && LoginUser.data) {
                        return (
                          <Genque
                            data={d}
                            currentUserId={LoginUser.data.user.$id}
                            UserDoc={UserDataDoc}
                            key={d.$id}
                            ModalContentsFunc={setModalWindow}
                            setModalBoolean={setIsModal}
                          />
                        );
                      }
                    }
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
export default App;
