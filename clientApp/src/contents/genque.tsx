import { Models } from "appwrite";
import UrlInText from "./urlInText";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Temporal } from "temporal-polyfill";
import Image from "next/image";
import { HandThumbUpIcon, PlayIcon } from "@heroicons/react/20/solid";
import {
  NoSymbolIcon,
  ChatBubbleOvalLeftIcon,
  TrashIcon,
  HandThumbUpIcon as OutLineHandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { Card } from "@tremor/react";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import ReplaceJSX from "@/feature/replaceJSX";
import ListOfUser from "./userlist";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import { GetSingleGenque } from "@/feature/hooks";
import HandleGenque from "./handleGenque";

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
  const [replyWindowExist, setReplyWindowExist] = useState(false);
  const ReplyForm = useForm<{ replyData: string }>();
  const BrData = ReplaceJSX(data.data, "\n", <br />, 5);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [goodButtonLoading, setGoodButtonLoading] = useState(false);
  const [GoodIcon, setGoodIcon] = useState(
    <OutLineHandThumbUpIcon className="h-4 " />
  );
  const [currentUserGood, setCurrentUserGood] = useState(false);
  const NowTime = Temporal.Now;
  const TempPostTime = Temporal.Instant.from(data.$createdAt);
  const [goodCount, setGoodCount] = useState(0);
  const [ListOfGoodUsers, setListOfGoodUsers] = useState<string[]>([]);
  const GetGoodInfo = () => {
    if (Server.databaseID && Server.subCollectionID) {
      api
        .getDocument(Server.databaseID, Server.subCollectionID, data.$id)
        .then((d) => {
          setListOfGoodUsers(d.GoodedUsers);
          setGoodCount(d.GoodedUsers.length);
          setCurrentUserGood(d.GoodedUsers.includes(currentUserId));
          if (d.GoodedUsers.includes(currentUserId))
            setGoodIcon(<HandThumbUpIcon className="h-4 " />);
        })
        .catch(() => {
          setListOfGoodUsers([]);
        });
    }
  };
  useEffect(() => {
    GetGoodInfo();
    setGoodCount(ListOfGoodUsers.length);
    if (ListOfGoodUsers.includes(currentUserId)) {
      setGoodIcon(<HandThumbUpIcon className="h-4 " />);
      setCurrentUserGood(true);
    }
  }, []);
  const onReplySubmit: SubmitHandler<{ replyData: string }> = (resData) => {
    if (Server.databaseID && Server.collectionID && Server.subCollectionID) {
      api
        .createDocument(Server.databaseID, Server.collectionID, {
          data: resData.replyData,
          replyTo: data.$id,
          deleted: false,
          createUserId: currentUserId,
        })
        .then((d) => {
          if (
            Server.databaseID &&
            Server.collectionID &&
            Server.subCollectionID
          ) {
            api
              .provider()
              .database.createDocument(
                Server.databaseID,
                Server.subCollectionID,
                d.$id,
                {
                  GoodedUsers: [],
                }
              );
          }
        });
    }
    setReplyWindowExist(false);
  };
  const handleGood = async () => {
    setGoodButtonLoading(true);
    if (Server.databaseID && Server.subCollectionID) {
      try {
        const GoodList = await api.getDocument(
          Server.databaseID,
          Server.subCollectionID,
          data.$id
        );
        if (GoodList.GoodedUsers.includes(currentUserId)) {
          const newList = GoodList.GoodedUsers.filter(
            (d: string) => d != currentUserId
          );
          const newGoodUsers = await api
            .updateDocument(
              Server.databaseID,
              Server.subCollectionID,
              data.$id,
              { GoodedUsers: newList }
            )
            .catch();
          if (newGoodUsers) {
            setGoodCount(newGoodUsers.GoodedUsers.length);
          }
          setGoodIcon(<OutLineHandThumbUpIcon className="h-4 " />);
          setCurrentUserGood(false);
        } else {
          const newGoodUsers = await api
            .updateDocument(
              Server.databaseID,
              Server.subCollectionID,
              data.$id,
              {
                GoodedUsers: [currentUserId, ...GoodList.GoodedUsers],
              }
            )
            .catch();
          if (newGoodUsers) {
            setGoodCount(newGoodUsers.GoodedUsers.length);
          }
          setGoodIcon(<HandThumbUpIcon className="h-4 " />);
          setCurrentUserGood(true);
        }
      } catch {}
    }
    setGoodButtonLoading(false);
  };

  const [Time, setTime] = useState<string>(
    `${TempPostTime.toZonedDateTimeISO(
      NowTime.zonedDateTimeISO().timeZone
    ).toLocaleString()}`
  );

  const MuteUser = () => {
    if (Server.databaseID && Server.usercollectionID) {
      api
        .getDocument(Server.databaseID, Server.usercollectionID, currentUserId)
        .then((d) => {
          const MuteUsers: string[] = d.MuteUserId;
          if (MuteUsers.includes(UserDoc.$id)) {
            return;
          } else {
            if (Server.databaseID && Server.usercollectionID) {
              api.updateDocument(
                Server.databaseID,
                Server.usercollectionID,
                currentUserId,
                {
                  MuteUserId: [...MuteUsers, UserDoc.$id],
                }
              );
            }
          }
        });
    }
    setModalBoolean(false);
    setButtonLoading(false);
  };
  const DeletGenque = () => {
    setButtonLoading(true);

    if (Server.databaseID && Server.collectionID) {
      api
        .updateDocument(Server.databaseID, Server.collectionID, data.$id, {
          deleted: true,
        })
        .then(() => {})
        .catch(() => {});
    }

    setModalBoolean(false);
    setButtonLoading(false);
  };
  const handleDelete = () => {
    clickModal(
      <div className=" rounded-md w-full max-w-3xl dark:bg-slate-900 p-8 bg-slate-50">
        <div className="w-96">このつぶやきを削除しますか？</div>
        <figure className="max-w-full mx-2 mt-2 mb-6 p-4 rounded-md dark:bg-slate-700 bg-slate-200">
          <blockquote>{data.data}</blockquote>
          <figcaption className="text-right italic text-gray-400">
            ―{UserDoc.DisplayName}
          </figcaption>
        </figure>
        <div className="grid grid-cols-2">
          {" "}
          <div className="flex content-center justify-center  items-center">
            <button
              className="dark:bg-slate-800 bg-slate-400 hover:bg-rose-800 rounded py-2 w-28"
              onClick={DeletGenque}
            >
              削除する
            </button>
          </div>
          <div className="flex content-center justify-center  items-center">
            <button
              className="dark:bg-slate-800 bg-slate-400 hover:bg-slate-600 rounded py-2 w-28"
              onClick={() => setModalBoolean(false)}
              disabled={buttonLoading}
            >
              削除しない
            </button>
          </div>
        </div>
      </div>
    );
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
    <div className="grid grid-cols-[50px_1fr] mt-1 bg-transparent">
      <div
        id="thumbnail"
        className="col-start-1  row-span-2 col-span-1 row-start-1"
      >
        <img
          src={UserDoc.UserThumbnailURL}
          alt={UserDoc.DisplayName}
          width={48}
          height={48}
          className="rounded aspect-square"
        />
      </div>
      <div className="row-start-1 col-start-2 col-span-1 w-full grid grid-cols-[1fr_120px]">
        <div className="row-start-1 col-start-1 col-span-10">
          <Link href={`/users/${UserDoc.DisplayUID}`}>
            <span id="DisplayName" className="">
              {UserDoc.DisplayName}
            </span>
            <span id="DisplayUid" className="text-slate-500">
              @{UserDoc.DisplayUID}
            </span>
          </Link>
        </div>
        <div className="row-start-1 col-start-2 col-span-1 text-right">
          <Link href={`/posts/${data.$id}`}>{Time}</Link>
        </div>
      </div>
      <div
        id="data"
        className="sm:break-words break-all col-start-2 row-start-2 col-span-1"
      >
        {BrData}
        {data.MediaURL ? (
          <>
            <div id="mediaURL">
              {data.MediaURLtype === "video" ? (
                <>
                  <video controls src={data.MediaURL} />
                </>
              ) : (
                <>
                  {data.MediaURLtype === "audio" ? (
                    <>
                      <button
                        onClick={() =>
                          clickModal(<audio controls src={data.MediaURL} />)
                        }
                        className="rounded-xl m-2 px-4 bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 grid gap-2 grid-cols-[32px_1fr]"
                      >
                        <PlayIcon />
                        <span className="my-auto">音声</span>
                      </button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div id="ex">
            <UrlInText arg={data.data} />
          </div>
        )}
      </div>
      <div className="row-start-3 col-start-1 col-span-2 grid grid-cols-[minmax(0,160px)_repeat(3,minmax(0,50px))_1fr]">
        <div
          id="CreateTime"
          className="col-span-1 col-start-1 row-start-1 h-5 overflow-hidden"
        >
          {TempPostTime.toZonedDateTimeISO(
            NowTime.zonedDateTimeISO().timeZone
          ).toLocaleString()}
        </div>

        <div className="col-start-2">
          <button
            className="rounded-full flex items-center justify-center px-2 h-4 hover:bg-sky-600 hover:text-white"
            onClick={() => handleGood()}
            onMouseOver={() => {
              if (currentUserGood) {
                setGoodIcon(<OutLineHandThumbUpIcon className="h-4 " />);
              } else {
                setGoodIcon(<HandThumbUpIcon className="h-4 " />);
              }
            }}
            onMouseLeave={() => {
              if (currentUserGood) {
                setGoodIcon(<HandThumbUpIcon className="h-4 " />);
              } else {
                setGoodIcon(<OutLineHandThumbUpIcon className="h-4 " />);
              }
            }}
            disabled={goodButtonLoading}
          >
            {GoodIcon}
            {goodCount > 0 && goodCount}
          </button>
        </div>

        <div className="col-start-3">
          {UserDoc.$id === currentUserId ? (
            <button
              className="hover:bg-rose-600 rounded-full w-8 hover:text-white"
              onClick={() => handleDelete()}
            >
              <TrashIcon className="h-4 mx-auto" />
            </button>
          ) : (
            <button
              className="hover:bg-rose-600 rounded-full w-8 hover:text-white"
              onClick={() => {
                clickModal(
                  <div className=" rounded-md w-full max-w-3xl dark:bg-slate-900 p-8 bg-slate-50">
                    <div className="w-96">このユーザーをミュートしますか？</div>
                    <figure className="max-w-full mx-2 mt-2 mb-6 p-4 rounded-md dark:bg-slate-700 bg-slate-200">
                      <ListOfUser target={UserDoc.$id} />
                    </figure>
                    <div className="grid grid-cols-2">
                      {" "}
                      <div className="flex content-center justify-center  items-center">
                        <button
                          className="dark:bg-slate-800 bg-slate-400 hover:bg-rose-800 rounded py-2 w-32"
                          onClick={() => MuteUser()}
                        >
                          ミュートする
                        </button>
                      </div>
                      <div className="flex content-center justify-center  items-center">
                        <button
                          className="dark:bg-slate-800 bg-slate-400 hover:bg-slate-600 rounded py-2 w-32"
                          onClick={() => setModalBoolean(false)}
                          disabled={buttonLoading}
                        >
                          ミュートしない
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }}
            >
              {<NoSymbolIcon className="h-4 mx-auto" />}
            </button>
          )}
        </div>
        <div className="col-start-4">
          <button
            className="hover:bg-sky-600 hover:text-white w-8 rounded-full"
            onClick={() => {
              setReplyWindowExist(!replyWindowExist);
              ReplyForm.reset();
            }}
          >
            <ChatBubbleOvalLeftIcon className="h-4 mx-auto " />
          </button>
        </div>
      </div>

      {replyWindowExist && (
        <>
          <div className="row-start-4 col-start-2 col-span-1 w-full">
            <HandleGenque
              uid={currentUserId}
              replyTo={data.$id}
              defaultValue={`@${UserDoc.DisplayUID} `}
              exFunc={() => {
                setReplyWindowExist(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};
export default Genque;
