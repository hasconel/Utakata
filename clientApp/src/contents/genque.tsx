import { Models } from "appwrite";
import UrlInText from "./urlInText";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Temporal } from "temporal-polyfill";
import Image from "next/image";
import { TrashIcon } from "@heroicons/react/20/solid";
import { TrashIcon as OutLineTrashIcon } from "@heroicons/react/24/outline";
import { Card } from "@tremor/react";
import api from "@/feature/api";
import { Server } from "@/feature/config";

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
  const [SuccessMessage, setSuccessMessage] = useState<string>("");
  const [MessageError, setMessageError] = useState<string>(
    "bg-sky-800 w-full rounded py-2 px-6 "
  );
  const [buttonLoading, setButtonLoading] = useState(false);
  const NowTime = Temporal.Now;
  const TempPostTime = Temporal.Instant.from(data.$createdAt);
  const [Time, setTime] = useState<string>(
    `${TempPostTime.toZonedDateTimeISO(
      NowTime.zonedDateTimeISO().timeZone
    ).toLocaleString()}`
  );
  const DeletGenque = () => {
    setButtonLoading(true);

    if (Server.databaseID && Server.collectionID) {
      api
        .updateDocument(Server.databaseID, Server.collectionID, data.$id, {
          deleted: true,
        })
        .then(() => {
          setSuccessMessage("削除しました");
        })
        .catch(() => {
          setSuccessMessage("失敗しました");
          setMessageError("bg-rose-700 w-full rounded py-2 px-6");
        });
    }

    setModalBoolean(false);
    setSuccessMessage("");
    setButtonLoading(false);
  };
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
  if (data.deleted) return <></>;
  return (
    <div className="grid grid-cols-[50px_repeat(11,minmax(0,1fr))] border-b mt-1 border-dark-tremor-content">
      <div id="thumbnail" className=" w-12  row-span-2 ">
        <img
          src={UserDoc.UserThumbnailURL}
          alt={UserDoc.DisplayName}
          width={48}
          height={48}
          className="rounded aspect-square"
        />
      </div>
      <div className="row-start-1 col-start-2 col-span-8">
        <Link href={`/users/${UserDoc.DisplayUID}`}>
          <span id="DisplayName" className="">
            {UserDoc.DisplayName}
          </span>
          <span id="DisplayUid" className="text-slate-500">
            @{UserDoc.DisplayUID}
          </span>
        </Link>
      </div>
      <div className="col-span-3 text-right">{Time}</div>
      <div
        id="data"
        className="break-words col-start-2 row-start-2 col-span-11"
      >
        {data.data}
        {data.MediaURL ? (
          <div id="mediaURL">
            <img
              src={data.MediaURL}
              alt="media"
              width={300}
              height={300}
              className="object-cover aspect-video  w-full"
              onClick={() => {
                clickModal(
                  <div className="max-h-[90%] min-h-5 rounded w-full  bg-slate-700 ">
                    <img
                      src={data.MediaURL}
                      alt="image"
                      width={900}
                      height={900}
                      className="object-contain max-h-[90vh] w-fit "
                    />
                  </div>
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
        {TempPostTime.toZonedDateTimeISO(
          NowTime.zonedDateTimeISO().timeZone
        ).toLocaleString()}
      </div>
      {UserDoc.$id === currentUserId && (
        <div>
          <button
            className="hover:bg-rose-600 rounded-full w-8 "
            onClick={() => {
              clickModal(
                <div className=" rounded-md w-full max-w-3xl bg-slate-900 p-8">
                  {SuccessMessage && (
                    <div className={MessageError}>{SuccessMessage}</div>
                  )}
                  <div className="w-96">このつぶやきを削除しますか？</div>
                  <figure className="max-w-full mx-2 mt-2 mb-6 p-4 rounded-md bg-slate-700">
                    <blockquote>{data.data}</blockquote>
                    <figcaption className="text-right italic text-gray-400">
                      ―{UserDoc.DisplayName}
                    </figcaption>
                  </figure>
                  <div className="grid grid-cols-2">
                    {" "}
                    <div className="flex content-center justify-center  items-center">
                      <button
                        className="bg-slate-800 hover:bg-rose-800 rounded py-2 w-28"
                        onClick={DeletGenque}
                      >
                        削除する
                      </button>
                    </div>
                    <div className="flex content-center justify-center  items-center">
                      <button
                        className="bg-slate-800 hover:bg-slate-600 rounded py-2 w-28"
                        onClick={() => setModalBoolean(false)}
                        disabled={buttonLoading}
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                </div>
              );
            }}
          >
            <TrashIcon className="h-4 mx-auto" />
          </button>
        </div>
      )}
      {/*{Boolean(data.GoodUserId.length) && (
        <div id="goodUsers" className="">
          {data.GoodUserId.length}
        </div>
      )}*/}
    </div>
  );
};
export default Genque;
