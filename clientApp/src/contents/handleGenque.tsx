import { useEffect, useRef, useState } from "react";
import LoadingScreen from "./loading";
import { CloudArrowUpIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { Button } from "@tremor/react";
import { useForm } from "react-hook-form";
import { Server } from "@/feature/config";
import api from "@/feature/api";
import { ID } from "appwrite";
import { watch } from "fs";
type FormValues = {
  data: string;
  Image: File[];
};
const HandleGenque = ({
  defaultValue,
  replyTo,
  uid,
  exFunc,
}: {
  defaultValue?: string;
  replyTo?: string;
  uid: string;
  exFunc?: () => void;
}) => {
  const Form = useForm<FormValues>();
  const [buttonIsLoading, setButtonIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  useEffect(() => {
    const FileArray = Form.watch("Image");
    if (typeof FileArray != "undefined") {
      if (FileArray[0]) {
        const file = FileArray[0];
        if (file.size < 3 * 1024 ** 2) {
          if (file?.type.match(/(image|video\/mp4|audio\/mpeg|audio\/wav)/)) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
          } else {
          }
        } else {
        }
      }
    }
  }, [Form.watch("Image")]);
  const hiddenfileinput = useRef<HTMLLabelElement>(null);
  const handleFileClick = () => {
    hiddenfileinput.current?.click();
  };
  const onSubmit = async (data: FormValues) => {
    setButtonIsLoading(true);
    let imageURL: URL | undefined = undefined;
    let MediaURLtype: "image" | "video" | "audio" | undefined = undefined;
    //ここから下は画像があったときだけ動かす
    if (
      data.Image[0] != undefined &&
      typeof Server.bucketID === "string" &&
      data.Image[0].size < 3 * 1024 ** 2
    ) {
      try {
        const CreateStrage = await api.createStorage(
          Server.bucketID,
          ID.unique(),
          data.Image[0]
        );
        if (CreateStrage.mimeType.includes("image")) {
          imageURL = await api.getFilePreview(
            Server.bucketID,
            CreateStrage.$id
          );
          MediaURLtype = "image";
        } else {
          imageURL = await api
            .provider()
            .storage.getFileView(Server.bucketID, CreateStrage.$id);
          if (CreateStrage.mimeType.includes("video")) {
            MediaURLtype = "video";
          } else {
            if (CreateStrage.mimeType.match("audio")) {
              MediaURLtype = "audio";
            }
          }
        }
        //        router.refresh();
      } catch {
        (e: any) => {
          if (typeof e.response.message === "string") {
          }
        };
      }
    } else {
    }
    //ここから上は画像があったときだけ動かす
    try {
      const PreUploadData = {
        data: data.data,
        createUserId: uid,
        replyTo: replyTo,
        MediaURL: imageURL,
        deleted: false,
        MediaURLtype: MediaURLtype,
      };
      const UploadData = JSON.stringify(PreUploadData);
      if (
        typeof Server.databaseID === "string" &&
        typeof Server.collectionID == "string" &&
        typeof Server.subCollectionID == "string"
      ) {
        const createData = await api.createDocument(
          Server.databaseID,
          Server.collectionID,
          UploadData
        );
        await api
          .provider()
          .database.createDocument(
            Server.databaseID,
            Server.subCollectionID,
            createData.$id,
            { GoodedUsers: [] }
          );
      } else {
        throw new Error("さーばーにあくせすできませんでした");
      }
    } catch {}
    Form.reset();

    if (exFunc != undefined) {
      exFunc();
    }
    setButtonIsLoading(false);
  };
  return (
    <>
      <form
        className="grid grid-cols-[3fr_2fr]  w-full"
        onSubmit={Form.handleSubmit(onSubmit)}
      >
        <div className="row-start-1 col-span-2 w-full ">
          {" "}
          {Form.formState.errors.data && (
            <span className="text-rose-800">本文は必須です</span>
          )}
        </div>
        <div className="row-start-2 col-span-2 w-full m-1">
          <textarea
            className="bg-transparent w-full border h-full border-slate-500"
            defaultValue={defaultValue}
            {...Form.register("data", { required: true })}
          />
        </div>
        <div className="col-span-2 row-start-3">
          {typeof Form.watch("Image") != "undefined" &&
            Form.watch("Image")[0] && (
              <div className="relative bg-slate-800 rounded-xl p-3">
                {previewUrl?.match(/^data:image/) ? (
                  <img
                    src={previewUrl}
                    alt="プレビュー"
                    className="  
              object-cover rounded w-48 h-48 object-center"
                  />
                ) : (
                  <>
                    {previewUrl?.match(/^data:video/) ? (
                      <video src={previewUrl} controls />
                    ) : (
                      <>
                        {previewUrl?.match(/^data:audio/) ? (
                          <>
                            <audio controls src={previewUrl} />{" "}
                          </>
                        ) : (
                          <>
                            <LoadingScreen />
                          </>
                        )}
                      </>
                    )}
                  </>
                )}

                <button
                  className="absolute top-1 right-1 w-10 h-10 rounded-full"
                  disabled={!Boolean(Form.watch("Image"))}
                  onClick={() => {
                    setPreviewUrl("");
                    Form.resetField("Image");
                  }}
                >
                  <XCircleIcon />
                  <div className="hidden">解除</div>
                </button>
              </div>
            )}{" "}
        </div>
        <Button
          className="row-start-4 h-9 col-start-1 m-1 w-full rounded-md bg-sky-500 hover:bg-sky-400 text-sm text-slate-900"
          type="submit"
          disabled={buttonIsLoading}
        >
          {buttonIsLoading ? <LoadingScreen /> : <>投稿</>}
        </Button>
        <div className="row-start-4 col-start-2 m-1 pl-1">
          <input
            className="hidden"
            type="file"
            id="file-input"
            accept="image/*,video/mp4,audio/mp3"
            {...Form.register("Image", {
              required: false,
            })}
          />
          <label className="" htmlFor="file-input" ref={hiddenfileinput}>
            <Button
              className="w-full h-9"
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
      </form>
    </>
  );
};
export default HandleGenque;
