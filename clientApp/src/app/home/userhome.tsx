import { Models } from "appwrite";
import GenqueStreamScreen from "./genqueStreamScreen";
import GenqueApplyScreen from "./genqueApplyScreen";
import { useState } from "react";
import ModalWindow from "@/contents/modal";

const UserHome = ({
  uid,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
}) => {
  const [isModal, setIsModal] = useState<boolean>(false);
  const [modalWindow, setModalWindow] = useState<JSX.Element>(<></>);
  return (
    <>
      <GenqueApplyScreen uid={uid}  />
      <GenqueStreamScreen uid={uid} ModalContentsFunc={setModalWindow} setModalBoolean={setIsModal}/>
      <ModalWindow
        contents={modalWindow}
        Boolean={isModal}
        SetBoolean={setIsModal}
      />
    </>
  );
};
export default UserHome;
