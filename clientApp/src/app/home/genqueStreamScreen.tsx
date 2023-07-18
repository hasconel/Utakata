"use Client";
import Genque from "@/contents/genque";
import LoadingScreen from "@/contents/loading";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import { GetGenqueStream } from "@/feature/hooks";
import { TypeCheck } from "@/feature/typecheck";
import { Models, Query } from "appwrite";
import Link from "next/link";
import { Dispatch, SetStateAction, useState } from "react";

const GenqueStreamScreen = ({
  uid,
  ModalContentsFunc,
  setModalBoolean,
  Time,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
  ModalContentsFunc: Dispatch<SetStateAction<JSX.Element>>;
  setModalBoolean: Dispatch<SetStateAction<boolean>>;
  Time?: string;
}) => {
  const QueryTime: string[] = [];
  const newMuteUserId: string[] = uid.data.MuteUserId.filter(
    (user: string) => user != uid.user.$id
  );
  if (newMuteUserId[0]) {
    newMuteUserId.map((d) => QueryTime.push(Query.notEqual("createUserId", d)));
  }
  if (Time) {
    QueryTime.push(Query.lessThan("$createdAt", Time));
  }
  const { isLoading, isError, data, error } = GetGenqueStream(QueryTime);
  const [StreamPostList, setStreamPostList] = useState<Models.Document[]>([]);
  const [StreamPostUserList, setStreamPostUserList] = useState<
    Models.Document[]
  >([]);
  api
    .provider()
    .appwrite.subscribe(
      `databases.${Server.databaseID}.collections.${Server.collectionID}.documents`,
      (response) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          if (TypeCheck.isDocument(response.payload)) {
            if (
              !StreamPostUserList[0] ||
              StreamPostUserList.every((arg) => {
                if (TypeCheck.isDocument(response.payload)) {
                  arg.$id != response.payload.createUserId;
                } else {
                  false;
                }
              })
            ) {
              if (Server.databaseID && Server.usercollectionID) {
                api
                  .getDocument(
                    Server.databaseID,
                    Server.usercollectionID,
                    response.payload.createUserId
                  )
                  .then((res) => {
                    setStreamPostUserList([res, ...StreamPostUserList]);
                  });
              }
            }
            setStreamPostList([response.payload, ...StreamPostList]);
          }
        }
      }
    );
  const clickModal = () => {
    setModalBoolean(true);
    ModalContentsFunc(<>やったね</>);
  };
  return (
    <>
      <div className="w-full grid ">
        {/*<button onClick={clickModal}>モーダル</button> */}
        <>
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <>
              <>
                {data && (
                  <>
                    {Time ? (
                      <>
                        <Link
                          href={`/home`}
                          className="text-center border-b border-dark-tremor-content hover:bg-slate-700"
                        >
                          最新に戻る
                        </Link>
                        {data.docs.map((d) => {
                          const UserDoc = data.userList.find(
                            (arg) => arg.$id === d.createUserId
                          );
                          if (UserDoc === undefined) {
                            return <span key={d.$id}></span>;
                          } else;
                          {
                            return (
                              <div
                                key={d.$id}
                                className=" border-b  border-dark-tremor-content"
                              >
                                <Genque
                                  data={d}
                                  currentUserId={uid.user.$id}
                                  UserDoc={UserDoc}
                                  setModalBoolean={setModalBoolean}
                                  ModalContentsFunc={ModalContentsFunc}
                                />
                              </div>
                            );
                          }
                        })}
                      </>
                    ) : (
                      <>
                        {StreamPostList.map((d) => {
                          const UserDoc = StreamPostUserList.find(
                            (arg) => arg.$id === d.createUserId
                          );
                          if (
                            UserDoc &&
                            data.docs.every((datadoc) => datadoc.$id != d.$id)
                          ) {
                            return (
                              <div
                                key={d.$id}
                                className=" border-b  border-dark-tremor-content"
                              >
                                <Genque
                                  data={d}
                                  currentUserId={uid.user.$id}
                                  UserDoc={UserDoc}
                                  setModalBoolean={setModalBoolean}
                                  ModalContentsFunc={ModalContentsFunc}
                                />
                              </div>
                            );
                          } else {
                          }
                        })}
                        <>
                          {data.docs.map((d) => {
                            const UserDataDoc = data.userList.find(
                              (arg) => arg.$id === d.createUserId
                            );
                            if (UserDataDoc) {
                              return (
                                <div
                                  key={d.$id}
                                  className=" border-b  border-dark-tremor-content"
                                >
                                  <Genque
                                    data={d}
                                    currentUserId={uid.user.$id}
                                    UserDoc={UserDataDoc}
                                    key={d.$id}
                                    setModalBoolean={setModalBoolean}
                                    ModalContentsFunc={ModalContentsFunc}
                                  />
                                </div>
                              );
                            }
                          })}
                        </>
                      </>
                    )}
                    {!(data.docs.length < 25) && (
                      <>
                        <Link
                          href={`/home/${encodeURIComponent(
                            data.docs[data.docs.length - 1].$createdAt
                          )}`}
                          className="text-center hover:bg-slate-700"
                        >
                          古いつぶやき
                        </Link>
                      </>
                    )}
                  </>
                )}
              </>
            </>
          )}
        </>
      </div>
    </>
  );
};
export default GenqueStreamScreen;
