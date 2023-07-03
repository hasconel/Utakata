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
  UserPost,
  Time,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
  ModalContentsFunc: Dispatch<SetStateAction<JSX.Element>>;
  setModalBoolean: Dispatch<SetStateAction<boolean>>;
  UserPost: Models.Document[];
  Time?: string;
}) => {
  const QueryTime: string[] = [];
  if (Time) {
    QueryTime.push(Query.lessThan("$createdAt", Time));
  }
  const { isLoading, isError, data, error } = GetGenqueStream(QueryTime);
  const PastIsLoading: boolean | undefined = false;
  const [StreamUserPost, setStreamUserPost] =
    useState<Models.Document[]>(UserPost);
  const TestStream = () => {
    if (data != undefined) {
      const docArray: Models.Document[] = data.docs;
      const userArray: Models.Document[] = data.userList;
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
                if (!userArray.includes(response.payload.createUserId)) {
                  async () => {
                    if (
                      Server.databaseID != undefined &&
                      Server.usercollectionID != undefined &&
                      TypeCheck.isDocument(response.payload)
                    ) {
                      const newUserDoc = await api.getDocument(
                        Server.databaseID,
                        Server.usercollectionID,
                        response.payload.createUserId
                      );
                      setStreamUserPost([]);
                      userArray.push(newUserDoc);
                    }
                  };
                }
                if (
                  !docArray.map((d) => {
                    if (TypeCheck.isDocument(response.payload)) {
                      return d.$id === response.payload.$id;
                    } else {
                      return true;
                    }
                  })
                ) {
                  docArray.push(response.payload);
                }
              }
            }
          }
        );

      return { docArray: docArray, userArray: userArray };
    } else {
      const nullDocArray: Models.Document[] = [];
      return { docArray: nullDocArray, userArray: nullDocArray };
    }
  };
  const [streamLastTime, setStreamLastTime] = useState<string>("");
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
              {Time ? (
                <>
                  {data && (
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
                            <Genque
                              data={d}
                              currentUserId={uid.user.$id}
                              UserDoc={UserDoc}
                              key={d.$id}
                            />
                          );
                        }
                      })}
                      {!(data.docs.length < 25) && (
                        <>
                          <Link
                            href={`/home/${encodeURIComponent(
                              TestStream().docArray[
                                TestStream().docArray.length - 1
                              ].$createdAt
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
              ) : (
                <>
                  {
                    <>
                      {StreamUserPost[0] && (
                        <>
                          {StreamUserPost.map((arg) => (
                            <Genque
                              data={arg}
                              currentUserId={uid.user.$id}
                              UserDoc={uid.data}
                              key={arg.$id}
                            />
                          ))}
                        </>
                      )}
                      {TestStream().docArray.map((d) => {
                        const UserDoc = TestStream().userArray.find(
                          (arg) => arg.$id === d.createUserId
                        );
                        if (UserDoc === undefined) {
                          return <span key={d.$id}></span>;
                        } else;
                        {
                          return (
                            <Genque
                              data={d}
                              currentUserId={uid.user.$id}
                              UserDoc={UserDoc}
                              key={d.$id}
                            />
                          );
                        }
                      })}

                      {!(TestStream().docArray.length < 25) && (
                        <>
                          <Link
                            className="text-center hover:bg-slate-700 "
                            href={`/home/${encodeURIComponent(
                              TestStream().docArray[
                                TestStream().docArray.length - 1
                              ].$createdAt
                            )}`}
                          >
                            より古いつぶやき
                          </Link>
                        </>
                      )}
                    </>
                  }
                </>
              )}
            </>
          )}
        </>
      </div>
    </>
  );
};
export default GenqueStreamScreen;
