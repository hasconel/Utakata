"use client";
import { ID, Models } from "appwrite";
import GenqueStreamScreen from "./genqueStreamScreen";
import GenqueApplyScreen from "./genqueApplyScreen";
import { useRef, useState } from "react";
import ModalWindow from "@/contents/modal";
import { AlertMessage } from "@/contents/alert";
import { Button } from "@tremor/react";
import LoadingScreen from "@/contents/loading";
import Link from "next/link";
import { CloudArrowUpIcon } from "@heroicons/react/20/solid";
import { useForm } from "react-hook-form";
import { Server } from "@/feature/config";
import api from "@/feature/api";
import Genque from "@/contents/genque";
type FormValues = {
  genque: string;
  Image: File[];
};
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const hiddenfileinput = useRef<HTMLLabelElement>(null);
  const handleFileClick = () => {
    hiddenfileinput.current?.click();
  };
  const [error, setError] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [buttonIsLoading, setButtonIsLoading] = useState<boolean>(false);
  const UserPost: Models.Document[] = [];
  const [StreamPost, setStreamPost] = useState<Models.Document[]>([]);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file?.type.indexOf("image") === 0) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError("画像専用です");
      }
    }
  };
  const handleGenque = async (data: FormValues) => {
    setButtonIsLoading(true);
    setError("");
    let imageURL: URL | undefined = undefined;
    //ここから下は画像があったときだけ動かす
    if (selectedFile != undefined && typeof Server.bucketID === "string") {
      try {
        const CreateStrage = await api.createStorage(
          Server.bucketID,
          ID.unique(),
          selectedFile
        );
        imageURL = await api.getFilePreview(
          Server.bucketID,
          CreateStrage.$id,
          400
        );
        console.log(imageURL);
        //        router.refresh();
      } catch {
        (e: any) => {
          console.log(e);
          if (typeof e.response.message === "string") {
            setError(e.response.massage);
          }
          setError(e.message);
        };
      }
    }
    //ここから上は画像があったときだけ動かす
    try {
      const PreUploadData = {
        data: data.genque,
        createUserId: uid.user.$id,
        MediaURL: imageURL,
      };
      const UploadData = JSON.stringify(PreUploadData);
      if (
        typeof Server.databaseID === "string" &&
        typeof Server.collectionID == "string"
      ) {
        const createData = await api.createDocument(
          Server.databaseID,
          Server.collectionID,
          UploadData
        );
        UserPost.unshift(createData);
        setStreamPost(UserPost);
      } else {
        setError("サーバーにアクセスできませんでした");
        throw new Error("さーばーにあくせすできませんでした");
      }
    } catch {}
    setButtonIsLoading(false);
  };
  return (
    <>
      {" "}
      {error && (
        <div className=" ">
          <AlertMessage message={error} />
        </div>
      )}
      <form onSubmit={handleSubmit(handleGenque)}>
        <div className="grid grid-cols-6 gap-2 border border-white rounded p-2">
          <div className="col-span-6 ">
            <textarea
              autoComplete="off"
              defaultValue={uid.data.ProfileBIO}
              className="w-full h-full bg-transparent rounded border border-slate-700"
              {...register("genque", {
                required: true,
              })}
            />
          </div>
          {selectedFile && (
            <div className="col-span-6">
              <img
                src={previewUrl}
                alt="プレビュー"
                className="  
              object-cover rounded w-80 object-center"
              />
            </div>
          )}
          <Button
            type="submit"
            className="col-span-3"
            disabled={buttonIsLoading}
          >
            {buttonIsLoading ? <LoadingScreen /> : <>投稿</>}
          </Button>
          <div className="col-span-2">
            <input
              className="hidden"
              type="file"
              id="file-input"
              accept="image/*"
              {...register("Image", {
                required: false,
              })}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFileChange(e)
              }
            />
            <label className="" htmlFor="file-input" ref={hiddenfileinput}>
              <Button
                className="w-full"
                type="button"
                icon={CloudArrowUpIcon}
                color="gray"
                id="file-input"
                onClick={handleFileClick}
              >
                ファイルを選択
              </Button>
            </label>
          </div>
          <Button
            className="col-span-1"
            disabled={!Boolean(selectedFile)}
            onClick={() => {
              setPreviewUrl(uid.data.UserThumbnailURL);
              setSelectedFile(undefined);
            }}
            color="gray"
          >
            選択解除
          </Button>
        </div>
      </form>
      <div className="border border-white rounded p-1">
        <GenqueStreamScreen
          uid={uid}
          ModalContentsFunc={setModalWindow}
          setModalBoolean={setIsModal}
          UserPost={StreamPost}
        />
      </div>
      <ModalWindow
        contents={modalWindow}
        Boolean={isModal}
        SetBoolean={setIsModal}
      />
    </>
  );
};
export default UserHome;
