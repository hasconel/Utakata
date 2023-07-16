"use client";
//・レス機能 ・検索機能 ・ミュート機能 ・GOOD機能 ・粒内改行 ・利用規約 ・githubのreadme
import { ID, Models } from "appwrite";
import GenqueStreamScreen from "./genqueStreamScreen";
import { useRef, useState } from "react";
import ModalWindow from "@/contents/modal";
import { AlertMessage } from "@/contents/alert";
import { Button } from "@tremor/react";
import LoadingScreen from "@/contents/loading";
import {
  CloudArrowUpIcon,
  DocumentMinusIcon,
  DocumentPlusIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { useForm } from "react-hook-form";
import { Server } from "@/feature/config";
import api from "@/feature/api";
type FormValues = {
  genque: string;
  Image: File[];
};
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
  const {
    register,
    handleSubmit,
    reset,
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
        imageURL = await api.getFilePreview(Server.bucketID, CreateStrage.$id);
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
        deleted: false,
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
    reset();
    setSelectedFile(undefined);
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
        <div className="grid grid-cols-5 gap-2 border border-slate-300 rounded p-2">
          <div className="col-span-5 ">
            <textarea
              autoComplete="off"
              className="w-full h-full bg-transparent rounded border border-slate-700"
              {...register("genque", {
                required: true,
              })}
            />
          </div>
          {selectedFile && (
            <div className="col-span-5 ">
              <div className="relative bg-slate-800 rounded-xl p-3">
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="  
              object-cover rounded w-48 h-48 object-center"
                />
                <button
                  className="absolute top-1 right-1 w-10 h-10 rounded-full"
                  disabled={!Boolean(selectedFile)}
                  onClick={() => {
                    setSelectedFile(undefined);
                  }}
                >
                  <XCircleIcon />
                  <div className="hidden">解除</div>
                </button>
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="col-span-3 h-9"
            disabled={buttonIsLoading}
          >
            {buttonIsLoading ? <LoadingScreen /> : <>投稿</>}
          </Button>
          <div className="col-span-2  h-9">
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
                icon={CloudArrowUpIcon}
                type="button"
                color="gray"
                id="file-input"
                onClick={handleFileClick}
              >
                <div className="hidden sm:block">ファイルを選択</div>
              </Button>
            </label>
          </div>
        </div>
      </form>
      <div className="border border-slate-300 rounded p-1">
        <GenqueStreamScreen
          uid={uid}
          ModalContentsFunc={setModalWindow}
          setModalBoolean={setIsModal}
          UserPost={StreamPost}
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
