"use client";
import { Models } from "appwrite";
import GenqueStreamScreen from "./genqueStreamScreen";
import { useState } from "react";
import ModalWindow from "@/contents/modal";
import HandleGenque from "@/contents/handleGenque";
import { Card } from "@tremor/react";
const UserHome = ({
  uid,
  Time,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
  Time?: string;
}) => {
  //console.log(Time);
  const [isModal, setIsModal] = useState<boolean>(false);
  const [modalWindow, setModalWindow] = useState<JSX.Element>(<></>);
  return (
    <>
      {" "}
      <Card className="grid max-w-4xl mt-4  mx-auto gap-6">
        <div className="border border-slate-300 rounded p-2">
          <HandleGenque uid={uid.user.$id} />
        </div>
        <div className="border border-slate-300 rounded p-2">
          <GenqueStreamScreen
            uid={uid}
            ModalContentsFunc={setModalWindow}
            setModalBoolean={setIsModal}
            Time={Time}
          />
        </div>
      </Card>
      <ModalWindow
        contents={modalWindow}
        Boolean={isModal}
        SetBoolean={setIsModal}
        fullContents={true}
      />
    </>
  );
};
export default UserHome;
