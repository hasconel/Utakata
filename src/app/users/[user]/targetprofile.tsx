import LoadingScreen from "@/contents/loading";
import UrlInText from "@/contents/urlInText";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import { Button, Metric } from "@tremor/react";
import Link from "next/link";
import { useQuery } from "react-query";
import Linkify from 'react-linkify';

const TargetProfile = ({
  uname,
  current,
}: {
  uname: string;
  current: boolean;
}) => {
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
          return Target;
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
            <>エラー{error.message}</>
          ) : (
            <>
              {data && (
                <>
                  <div className="grid  grid-cols-4 grid-flow-row-dense gap-4 ">
                    <div className="aspect-square h-48  rounded  row-span-2 ">
                      <img
                        className="w-full object-cover rounded aspect-square object-center	"
                        src={data.UserThumbnailURL}
                        alt="thumbnail"
                        height="300"
                      />
                    </div>
                    <div className="col-span-3 ">
                      <Metric>{data.DisplayName}</Metric>
                      <p>@{data.DisplayUID}</p>
                    </div>
                    <div className="col-span-3 ">
                      <p>
                        <Linkify>{data.ProfileBIO}</Linkify>
                      </p>
                      <p>
                        {data.UserURL && (
                          <Link href={data.UserURL}>{data.UserURL}</Link>
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

                  <br />
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
