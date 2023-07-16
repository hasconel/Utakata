import Genque from "@/contents/genque";
import LoadingScreen from "@/contents/loading";
import ModalWindow from "@/contents/modal";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import { GetLoginUser, GetSingleGenque } from "@/feature/hooks";
import { Models } from "appwrite";
import { useEffect, useState } from "react";

const App = ({ postId }: { postId: string }) => {
  const [isModal, setIsModal] = useState<boolean>(false);
  const [modalWindow, setModalWindow] = useState<JSX.Element>(<></>);
  const LoginUser = GetLoginUser();
  const [ReplyTarget, setReplyTarget] = useState<string[]>([]);
  const forrep = async () => {
    if (Server.databaseID && Server.collectionID) {
      const first = await api.getDocument(
        Server.databaseID,
        Server.collectionID,
        postId
      );
      if (typeof first.replyTo === "string") {
        setReplyTarget([first.replyTo]);
      }
    } else {
      return;
    }
    for (let index = 0; index < 5; index++) {
      if (Server.databaseID && Server.collectionID && ReplyTarget[index]) {
        const arg = await api.getDocument(
          Server.databaseID,
          Server.collectionID,
          ReplyTarget[index]
        );
        if (typeof arg.replyTo === "string") {
          setReplyTarget([...ReplyTarget, arg.replyTo]);
        }
      } else {
        break;
      }
    }
  };
  useEffect(() => {
    forrep();
  }, []);
  const GenqueW = ({ target }: { target: string }) => {
    const Triger = GetSingleGenque(target);
    return (
      <>
        {Triger.isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            {LoginUser.data && Triger.data ? (
              <Genque
                ModalContentsFunc={setModalWindow}
                setModalBoolean={setIsModal}
                currentUserId={LoginUser.data.user.$id}
                UserDoc={Triger.data.User}
                data={Triger.data.Doc}
              />
            ) : (
              <>存在しないつぶやき</>
            )}
          </>
        )}
      </>
    );
  };
  return (
    <>
      {" "}
      <ModalWindow
        contents={modalWindow}
        Boolean={isModal}
        SetBoolean={setIsModal}
        fullContents={true}
      />
      <div className="grid grid-cols-[32px_1fr]">
        <div className="col-start-2">
          {ReplyTarget.map((d) => {
            return (
              <div key={d}>
                <GenqueW key={d} target={d} />
              </div>
            );
          })}
        </div>
        <div className="col-start-1 col-span-2">
          <GenqueW target={postId} />
        </div>
      </div>
    </>
  );
};
export default App;
