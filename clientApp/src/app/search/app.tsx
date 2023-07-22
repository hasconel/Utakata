"use client";
import Genque from "@/contents/genque";
import LoadingScreen from "@/contents/loading";
import ModalWindow from "@/contents/modal";
import ListOfUser from "@/contents/userlist";
import { SearchGetGenques, GetLoginUser } from "@/feature/hooks";
import { UserGroupIcon } from "@heroicons/react/20/solid";
import { UserGroupIcon as OutlineUserGroupIcon } from "@heroicons/react/24/outline";
import { Card, Metric } from "@tremor/react";
import { Models, Query } from "appwrite";
import { useEffect, useState } from "react";

const App = ({ query }: { query: string }) => {
  const [isModal, setIsModal] = useState<boolean>(false);
  const [modalWindow, setModalWindow] = useState<JSX.Element>(<></>);
  const LoginUser = GetLoginUser();
  const Search = SearchGetGenques(query);
  return (
    <>
      {" "}
      <Card className="max-w-4xl mx-auto mt-8">
        <Metric className="text-center w-full">
          <span className="text-2xl">検索：</span>
          {query}
        </Metric>
        <div className="border-t-2 mt-3 border-gray-500">
          {Search.isLoading ? (
            <>
              <LoadingScreen />
            </>
          ) : (
            <>
              {Search.data && LoginUser.data ? (
                <>
                  {Search.data.docs.map((d) => {
                    if (Search.data) {
                      const UserDoc = Search.data.userList.find(
                        (arg) => arg.$id === d.createUserId
                      );
                      if (UserDoc === undefined) {
                        return <span key={d.$id}>ないです</span>;
                      } else;
                      {
                        if (LoginUser.data)
                          return (
                            <div
                              key={d.$id}
                              className=" border-b  border-dark-tremor-content"
                            >
                              <Genque
                                data={d}
                                currentUserId={LoginUser.data.user.$id}
                                UserDoc={UserDoc}
                                setModalBoolean={setIsModal}
                                ModalContentsFunc={setModalWindow}
                              />
                            </div>
                          );
                      }
                    }
                  })}
                </>
              ) : (
                <>ないです</>
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
