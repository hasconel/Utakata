"use Client";
import Genque from "@/contents/genque";
import LoadingScreen from "@/contents/loading";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import { GetGenqueStream } from "@/feature/hooks";
import { TypeCheck } from "@/feature/typecheck";
import { Models } from "appwrite";
import { Dispatch, SetStateAction, useState } from "react";

const GenqueStreamScreen = ({
  uid,
  ModalContentsFunc,
  setModalBoolean,
  UserPost,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
  ModalContentsFunc: Dispatch<SetStateAction<JSX.Element>>;
  setModalBoolean: Dispatch<SetStateAction<boolean>>;
  UserPost: Models.Document[];
}) => {
  const { isLoading, isError, data, error } = GetGenqueStream();
  const [StreamUserPost, setStreamUserPost] =
    useState<Models.Document[]>(UserPost);
  const TestStream = () => {
    if (data != undefined) {
      const docArray: Models.Document[] = data.docs;
      const userArray: Models.Document[] = data.userList;
      api
        .provider()
        .appwrite.subscribe(
          `databases.${Server.databaseID}.collections.${Server.collectionID}.documents`,
          (response) => {
            if (
              response.events.includes(
                "databases.*.collections.*.documents.*.create"
              )
            ) {
              if (TypeCheck.isDocument(response.payload)) {
                if (!userArray.includes(response.payload.createUserId)) {
                  async () => {
                    if (
                      Server.databaseID != undefined &&
                      Server.usercollectionID != undefined &&
                      TypeCheck.isDocument(response.payload)
                    ) {
                      const newUserDoc = await api.getDocument(
                        Server.databaseID,
                        Server.usercollectionID,
                        response.payload.createUserId
                      );
                      setStreamUserPost([]);
                      userArray.push(newUserDoc);
                    }
                  };
                }
                if (
                  !docArray.map((d) => {
                    if (TypeCheck.isDocument(response.payload)) {
                      return d.$id === response.payload.$id;
                    } else {
                      return true;
                    }
                  })
                ) {
                  docArray.push(response.payload);
                }
              }
            }
          }
        );
      return { docArray: docArray, userArray: userArray };
    } else {
      const nullDocArray: Models.Document[] = [];
      return { docArray: nullDocArray, userArray: nullDocArray };
    }
  };
  const clickModal = () => {
    setModalBoolean(true);
    ModalContentsFunc(<>やったね</>);
  };
  return (
    <>
      <div className="w-full grid ">
        {/*<button onClick={clickModal}>モーダル</button> */}
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            {StreamUserPost[0] && (
              <>
                {StreamUserPost.map((arg) => (
                  <Genque
                    data={arg}
                    currentUserId={uid.user.$id}
                    UserDoc={uid.data}
                    key={arg.$id}
                  />
                ))}
              </>
            )}
            {TestStream().docArray.map((d) => {
              const UserDoc = TestStream().userArray.find(
                (arg) => arg.$id === d.createUserId
              );
              if (UserDoc === undefined) return <span key={d.$id}></span>;
              return (
                <Genque
                  data={d}
                  currentUserId={uid.user.$id}
                  UserDoc={UserDoc}
                  key={d.$id}
                />
              );
            })}
          </>
        )}
      </div>
    </>
  );
};
export default GenqueStreamScreen;
