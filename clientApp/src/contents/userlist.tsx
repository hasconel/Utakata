import LoadingScreen from "./loading";
import { Server } from "@/feature/config";
import { useQuery } from "react-query";
import api from "@/feature/api";
import { Metric } from "@tremor/react";
import { useEffect, useState } from "react";
import Link from "next/link";

const ListOfUser = ({ target }: { target: string }) => {
  const [imageURL, setImageURL] = useState<string>("");
  const [DisplayName, setDisplayName] = useState("");
  const [DisplayUID, setDisplayUID] = useState("");
  const [ProfileBIO, setProfileBIO] = useState("");
  const getParam = () => {
    try {
      if (
        typeof Server.usercollectionID === "string" &&
        typeof Server.databaseID === "string"
      ) {
        api
          .provider()
          .database.getDocument(
            Server.databaseID,
            Server.usercollectionID,
            target
          )
          .then((d) => {
            setDisplayName(d.DisplayName);
            setDisplayUID(d.DisplayUID);
            setImageURL(d.UserThumbnailURL);
            setProfileBIO(d.ProfileBIO);
          });
      }
    } catch {}
  };
  useEffect(() => {
    getParam();
    return;
  }, []);
  return (
    <>
      <div className="w-full grid grid-cols-[48px_1fr] grid-rows-2 h-12 gap-2 overflow-hidden">
        {DisplayUID === "" ? (
          <div className="col-span-2 flex items-center justify-center">
            <LoadingScreen />
          </div>
        ) : (
          <>
            <div className="row-span-2 col-start-1">
              <img
                src={imageURL}
                height={32}
                className="aspect-square rounded w-full"
              />
            </div>
            <div className="col-start-2 row-start-1">
              <Link href={`/home/${DisplayUID}`}>
                <span>{DisplayName}</span>
                <span className="text-gray-500">{DisplayUID}</span>
              </Link>
            </div>
            <div className="col-start-2 row-start-2">{ProfileBIO}</div>
          </>
        )}
      </div>
    </>
  );
};
export default ListOfUser;
