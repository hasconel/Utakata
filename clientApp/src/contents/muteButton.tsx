import api from "@/feature/api";
import { Server } from "@/feature/config";
import { MouseEvent, useEffect, useState } from "react";

const MuteButton = ({
  className,
  UserMuteList,
  targetUser,
  currentUserId,
}: {
  className: string;
  UserMuteList: string[];
  targetUser: string;
  currentUserId: string;
}) => {
  const [message, setMessage] = useState<string>("");
  const [muteBoolean, setMuteBoolean] = useState(false);
  const [style, setStyle] = useState("");
  useEffect(() => {
    if (UserMuteList.includes(targetUser)) {
      setMessage("ミュート中");
      setMuteBoolean(true);
      setStyle("bg-rose-700  hover:bg-rose-600 text-white");
    } else {
      setStyle("bg-sky-700  hover:bg-sky-600 text-white");
      setMuteBoolean(false);
      setMessage("購読中");
    }
    return;
  }, []);
  const [buttonDisable, setButtonDisable] = useState(false);
  const HandleMute = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (Server.databaseID && Server.usercollectionID) {
      try {
        setButtonDisable(true);
        api
          .getDocument(
            Server.databaseID,
            Server.usercollectionID,
            currentUserId
          )
          .then((d) => {
            if (d.MuteUserId.includes(targetUser)) {
              if (Server.databaseID && Server.usercollectionID) {
                const newData = d.MuteUserId.filter(
                  (data: string) => data != targetUser
                );
                api
                  .updateDocument(
                    Server.databaseID,
                    Server.usercollectionID,
                    currentUserId,
                    { MuteUserId: newData }
                  )
                  .then(() => {
                    setMuteBoolean(false);
                    setMessage("解除済み");
                    setStyle("bg-sky-700  hover:bg-sky-600 text-white");
                  });
              }
            } else {
              if (Server.databaseID && Server.usercollectionID) {
                d.MuteUserId.push(targetUser);
                api
                  .updateDocument(
                    Server.databaseID,
                    Server.usercollectionID,
                    currentUserId,
                    { MuteUserId: d.MuteUserId }
                  )
                  .then(() => {
                    setMessage("ミュート中");
                    setMuteBoolean(true);
                    setStyle("bg-rose-700  hover:bg-rose-600 text-white");
                  });
              }
            }
          });
        setButtonDisable(false);
      } catch {}
    }
  };
  return (
    <>
      <button
        className={`${className} ${style}`}
        onClick={(e) => HandleMute(e)}
        onMouseOver={() => {
          if (muteBoolean) {
            setMessage("ミュート解除する");
          } else {
            setMessage("ミュートする");
          }
        }}
        onMouseLeave={() => {
          if (muteBoolean) {
            setMessage("ミュート中");
          } else {
            setMessage("購読中");
          }
        }}
        disabled={buttonDisable}
      >
        {message}
      </button>
    </>
  );
};
export default MuteButton;
