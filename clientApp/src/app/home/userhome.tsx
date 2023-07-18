"use client";
//・レス機能 ・検索機能 ・ミュート機能 ・GOOD機能 ・粒内改行 ・利用規約 ・githubのreadme
import { Models } from "appwrite";
import GenqueStreamScreen from "./genqueStreamScreen";
import { useState } from "react";
import ModalWindow from "@/contents/modal";
import HandleGenque from "@/contents/handleGenque";
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
