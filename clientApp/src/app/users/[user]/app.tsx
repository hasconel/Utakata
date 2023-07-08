import LoadingScreen from "@/contents/loading";
import { GetProfileScreen } from "@/feature/hooks";
import TargetProfile from "./targetprofile";
import Link from "next/link";
import { Button } from "@tremor/react";
import { AlertMessage } from "@/contents/alert";
import ModalWindow from "@/contents/modal";
import { useState } from "react";

const App = ({ username }: { username: string }) => {
  const user = GetProfileScreen(username);
  const [isModal, setIsModal] = useState<boolean>(false);
  const [modalWindow, setModalWindow] = useState<JSX.Element>(<></>);

  return (
    <>
      <ModalWindow
        contents={modalWindow}
        Boolean={isModal}
        SetBoolean={setIsModal}
        fullContents={true}
      />
      {user.isLoading ? (
        <>
          <div className="flex justify-center">
            <LoadingScreen />
          </div>
        </>
      ) : (
        <>
          {user.isError ? (
            <>
              {user.error != null && (
                <>
                  {typeof user.error === "object" && (
                    <>
                      {"message" in user.error && (
                        <>
                          {typeof user.error.message === "string" && (
                            <AlertMessage message={user.error.message} />
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              <Link href="/">
                <Button>ホームへ戻る</Button>
              </Link>
            </>
          ) : (
            <>
              {" "}
              <>
                {user.data?.username && (
                  <TargetProfile
                    ModalContentsFunc={setModalWindow}
                    setModalBoolean={setIsModal}
                    uname={user.data?.username}
                    current={user.data.isCurrentUser}
                    currentData={user.data.current.$id}
                  />
                )}
              </>
            </>
          )}
        </>
      )}
    </>
  );
};
export default App;
