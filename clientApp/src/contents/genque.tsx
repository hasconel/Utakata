import { Models } from "appwrite";
import UrlInText from "./urlInText";
import Image from "next/image";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Temporal } from "temporal-polyfill";

const Genque = ({
  data,
  currentUserId,
  UserDoc,
  absTime,
  ModalContentsFunc,
  setModalBoolean,
}: {
  data: Models.Document;
  currentUserId: string;
  UserDoc: Models.Document;
  absTime?: boolean;
  ModalContentsFunc: Dispatch<SetStateAction<JSX.Element>>;
  setModalBoolean: Dispatch<SetStateAction<boolean>>;
}) => {
  const NowTime = Temporal.Now;
  const TempPostTime = Temporal.Instant.from(data.$createdAt);
  const [Time, setTime] = useState<string>(
    `${TempPostTime.toZonedDateTimeISO(
      NowTime.zonedDateTimeISO().timeZone
    ).toLocaleString()}`
  );
  useEffect(() => {
    if (!absTime) {
      setTime(
        `${TempPostTime.until(NowTime.instant(), {
          largestUnit: "hour",
          smallestUnit: "minutes",
        })
          .toLocaleString()
          .replace("PT", "")
          .replace("H", "時間")
          .replace("M", "分")}前`
      );
    }
  }, []);
  const clickModal = (contents: JSX.Element) => {
    setModalBoolean(true);
    ModalContentsFunc(contents);
  };
  if (data.createUserId != UserDoc.$id) return <></>;
  return (
    <div className="grid grid-cols-[50px_repeat(11,minmax(0,1fr))] border-b border-dark-tremor-content">
      <div id="thumbnail" className=" w-12  row-span-2 ">
        <img
          src={UserDoc.UserThumbnailURL}
          alt={UserDoc.DisplayName}
          width={48}
          height={48}
          className="rounded aspect-square"
        />
      </div>
      <Link
        href={`/users/${UserDoc.DisplayUID}`}
        className="row-start-1 col-start-2 col-span-10"
      >
        <span id="DisplayName" className="">
          {UserDoc.DisplayName}
        </span>
        <span id="DisplayUid" className="text-slate-500">
          @{UserDoc.DisplayUID}
        </span>
      </Link>
      <div
        id="data"
        className="break-words col-start-2 row-start-2 col-span-11"
      >
        {data.data}
        {data.MediaURL ? (
          <div id="mediaURL" className="">
            <img
              src={data.MediaURL}
              alt="media"
              width={300}
              height={300}
              className="object-cover aspect-video w-full"
              onClick={() => {
                console.log(data.MediaURL);
                clickModal(
                  <>
                    <img src={data.MediaURL} className="w-400" />
                  </>
                );
              }}
            />
          </div>
        ) : (
          <div id="ex">
            <UrlInText arg={data.data} />
          </div>
        )}
      </div>
      <div id="CreateTime" className="col-span-5">
        {Time}
      </div>
      {Boolean(data.GoodUserId.length) && (
        <div id="goodUsers" className="">
          {data.GoodUserId.length}
        </div>
      )}{" "}
    </div>
  );
};
export default Genque;
