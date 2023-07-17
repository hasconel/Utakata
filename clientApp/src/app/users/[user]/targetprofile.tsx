import LoadingScreen from "@/contents/loading";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import { Button, Metric } from "@tremor/react";
import Link from "next/link";
import { useQuery } from "react-query";
import Linkify from "react-linkify";
import { AlertMessage } from "@/contents/alert";
import { Models, Query } from "appwrite";
import Genque from "@/contents/genque";
import { GetGenqueStream, GetLoginUser } from "@/feature/hooks";
import { Dispatch, SetStateAction, useState } from "react";
import MuteButton from "@/contents/muteButton";

const TargetProfile = ({
  uname,
  current,
  currentData,
  ModalContentsFunc,
  setModalBoolean,
}: {
  uname: string;
  current: boolean;
  currentData: string;
  ModalContentsFunc: Dispatch<SetStateAction<JSX.Element>>;
  setModalBoolean: Dispatch<SetStateAction<boolean>>;
}) => {
  const [QueryData, setQueryData] = useState([
    Query.equal("createUserId", [uname]),
  ]);
  const currentUserData = GetLoginUser();
  const TargetGenqueList = GetGenqueStream(QueryData);
  const { isLoading, isError, data, error } = useQuery(uname, async () => {
    try {
      if (
        typeof Server.endpoint === "string" &&
        typeof Server.project === "string" &&
        typeof Server.collectionID === "string" &&
        typeof Server.usercollectionID === "string" &&
        typeof Server.databaseID === "string" &&
        typeof Server.bucketID === "string" &&
        typeof Server.userThumbnailBucketID === "string"
      ) {
        const Target = await api
          .provider()
          .database.getDocument(
            Server.databaseID,
            Server.usercollectionID,
            uname
          );
        return { TargetProfile: Target };
      }
    } catch {}
  });
  return (
    <>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {isError ? (
            <>
              <AlertMessage message="Error" />
            </>
          ) : (
            <>
              {data && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-4 min-w-410 gap-4">
                    <div className="aspect-square min-w-fit min-h-48  rounded  row-span-2 ">
                      <img
                        className="w-full object-cover rounded aspect-square object-center	"
                        src={data.TargetProfile.UserThumbnailURL}
                        alt="thumbnail"
                        height="300"
                      />
                    </div>
                    <div className="col-span-3 ">
                      <Metric>{data.TargetProfile.DisplayName}</Metric>
                      <p>@{data.TargetProfile.DisplayUID}</p>
                    </div>
                    <div className="col-span-3 ">
                      <p>
                        <Linkify>{data.TargetProfile.ProfileBIO}</Linkify>
                      </p>
                      <p>
                        {data.TargetProfile.UserURL && (
                          <Link href={data.TargetProfile.UserURL}>
                            {data.TargetProfile.UserURL}
                          </Link>
                        )}
                      </p>
                    </div>
                    <>
                      {current ? (
                        <>
                          <span className="col-span-2">
                            <Link href={"/settings/profile"}>
                              <button className="rounded-md text-center w-full h-full p-2 bg-sky-700 text-white hover:bg-sky-600">
                                プロフィールを編集
                              </button>
                            </Link>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="col-span-2">
                            {currentUserData.data && (
                              <MuteButton
                                className="rounded-md text-center p-2 w-full h-full"
                                targetUser={data.TargetProfile.$id}
                                currentUserId={currentData}
                                UserMuteList={
                                  currentUserData.data.data.MuteUserId
                                }
                              />
                            )}
                          </span>
                        </>
                      )}
                    </>
                  </div>
                  <div>
                    {TargetGenqueList.isLoading ? (
                      <LoadingScreen />
                    ) : (
                      <>
                        {TargetGenqueList.data && (
                          <>
                            {TargetGenqueList.data.docs.map((d) => {
                              if (TargetGenqueList.data) {
                                const UserDoc =
                                  TargetGenqueList.data.userList.find(
                                    (arg) => arg.$id === d.createUserId
                                  );
                                if (UserDoc === undefined) {
                                  return <span key={d.$id}></span>;
                                } else;
                                {
                                  return (
                                    <Genque
                                      data={d}
                                      currentUserId={currentData}
                                      UserDoc={UserDoc}
                                      setModalBoolean={setModalBoolean}
                                      ModalContentsFunc={ModalContentsFunc}
                                      key={d.$id}
                                    />
                                  );
                                }
                              }
                            })}
                          </>
                        )}
                        {TargetGenqueList.data?.docs.length && (
                          <>
                            {!(TargetGenqueList.data.docs.length < 25) && (
                              <>
                                <button
                                  onClick={() => {
                                    if (TargetGenqueList.data)
                                      setQueryData([
                                        Query.equal("createUserId", [uname]),
                                        Query.lessThan(
                                          "$createdAt",
                                          TargetGenqueList.data?.docs[
                                            TargetGenqueList.data.docs.length -
                                              1
                                          ].$createdAt
                                        ),
                                      ]);
                                  }}
                                >
                                  より古いつぶやき
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};
export default TargetProfile;
