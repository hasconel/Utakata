import LoadingScreen from "@/contents/loading";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import { Button, Metric } from "@tremor/react";
import Link from "next/link";
import { useQuery } from "react-query";
import Linkify from "react-linkify";
import { AlertMessage } from "@/contents/alert";
import { Query } from "appwrite";
import Genque from "@/contents/genque";
import { GetGenqueStream } from "@/feature/hooks";

const TargetProfile = ({
  uname,
  current,
  currentData,
}: {
  uname: string;
  current: boolean;
  currentData: string;
}) => {
  const TargetGenqueList = GetGenqueStream([
    Query.equal("createUserId", [uname]),
  ]);
  const { isLoading, isError, data, error } = useQuery(
    "TargetDoc",
    async () => {
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
    }
  );

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
                              <Button>プロフィールを編集</Button>
                            </Link>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="col-span-2">
                            <Button>フォロー</Button>
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
                        {TargetGenqueList.data?.docs.map((d) => (
                          <Genque
                            key={d.$id}
                            data={d}
                            currentUserId={currentData}
                            UserDoc={data.TargetProfile}
                          />
                        ))}
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
