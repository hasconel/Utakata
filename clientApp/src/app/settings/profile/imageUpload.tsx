"use client";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import { AlertMessage } from "@/contents/alert";
import { useRef, useState } from "react";
import { Button } from "@tremor/react";
import { CloudArrowUpIcon } from "@heroicons/react/24/solid";
import { ID, Models } from "appwrite";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingScreen from "@/contents/loading";

type FormValues = {
  DisplayName: string;
  ProfileBIO: string;
  ProfileImage: File[];
  UserURL: string;
};
const ProfileImageUpload = ({
  uid,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
}) => {
  const [inputError, setInputError] = useState<string>(
    "w-full bg-transparent rounded border border-slate-300"
  );

  const router = useRouter();
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
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    uid.data.UserThumbnailURL
  );
  const [buttonIsLoading, setButtonIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
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

  const handleUploadFile = async (data: FormValues) => {
    setButtonIsLoading(true);
    setError("");
    let imageURL = undefined;
    //ここから下は画像があったときだけ動かす
    if (
      !(typeof selectedFile === "undefined") &&
      typeof Server.userThumbnailBucketID === "string"
    ) {
      try {
        const CreateStrage = await api.createStorage(
          Server.userThumbnailBucketID,
          ID.unique(),
          selectedFile
        );
        imageURL = await api.getFilePreview(
          Server.userThumbnailBucketID,
          CreateStrage.$id,
          400,
          400
        );
        setSuccessMessage("プロフィールを更新しました");
        //        router.refresh();
      } catch {
        (e: any) => {
          if (typeof e.response.message === "string") {
            setError(e.response.massage);
          }
          setError(e.message);
        };
      }
    }
    //ここから上は画像があったときだけ動かす
    const PreUploadData = {
      UserThumbnailURL: imageURL,
      DisplayName: data.DisplayName,
      ProfileBIO: data.ProfileBIO,
      UserURL: data.UserURL,
    };
    const UploadData = JSON.stringify(PreUploadData);
    if (
      typeof Server.databaseID === "string" &&
      typeof Server.usercollectionID == "string"
    ) {
      if (!data.UserURL) {
        const withoutURLdata = {
          UserThumbnailURL: imageURL,
          DisplayName: data.DisplayName,
          ProfileBIO: data.ProfileBIO,
        };
        const UploadDataWithoutURL = JSON.stringify(withoutURLdata);
        await api.updateDocument(
          Server.databaseID,
          Server.usercollectionID,
          uid.user.$id,
          UploadDataWithoutURL
        );
      } else {
        await api.updateDocument(
          Server.databaseID,
          Server.usercollectionID,
          uid.user.$id,
          UploadData
        );
      }
    } else {
      setError("サーバーにアクセスできませんでした");
      throw new Error("さーばーにあくせすできませんでした");
    }
    setButtonIsLoading(false);
  };

  return (
    <div>
      {" "}
      <form onSubmit={handleSubmit(handleUploadFile)}>
        <div className="grid sm:grid-cols-4 min-w-410 gap-4">
          {{ successMessage } && (
            <div className=" bg-sky-700">
              <>{successMessage}</>
            </div>
          )}
          <div className="col-start-1 aspect-square  row-span-2 rounded  ">
            {" "}
            <img
              src={previewUrl}
              alt="プレビュー"
              className="  
              object-cover rounded aspect-square w-full object-center"
            />
          </div>
          <div className="sm:col-span-3 grid grid-cols-[350px_repeat(1,minmax(0,1fr))] ">
            <table className=" w-full inset-x-0 bottom-0">
              <tbody>
                <tr>
                  <th className="text-sm">ユーザー名：</th>
                  <td>
                    <input
                      type="text"
                      defaultValue={uid.data.DisplayName}
                      className="w-full bg-transparent rounded border border-slate-300 "
                      {...register("DisplayName", {
                        required: false,
                      })}
                    />
                  </td>
                </tr>
                <tr>
                  <th className="text-sm">ユーザーID：</th>
                  <td>{uid.user.name}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="sm:col-span-3 ">
            <p>
              <span className="text-sm">プロフィール</span>
              <textarea
                autoComplete="off"
                defaultValue={uid.data.ProfileBIO}
                className="w-full h-full bg-transparent rounded border border-slate-300"
                {...register("ProfileBIO", {
                  required: false,
                })}
              />
            </p>
            <p>
              URL
              <input
                type="text"
                defaultValue={uid.data.UserURL}
                className={
                  Boolean(errors.UserURL?.type)
                    ? "w-full bg-transparent rounded border-4 border-rose-500"
                    : "w-full bg-transparent rounded border border-slate-300"
                }
                {...register("UserURL", {
                  required: false,
                  pattern: /^https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/,
                })}
              />
              {errors.UserURL?.type && (
                <span className="text-rose-400">{errors.UserURL.type}</span>
              )}
            </p>
          </div>
          {error && (
            <div className=" ">
              <AlertMessage message={error} />
            </div>
          )}
          <input
            className="hidden"
            type="file"
            id="file-input"
            accept="image/*"
            {...register("ProfileImage", {
              required: false,
            })}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFileChange(e)
            }
          />
          <label
            className="sm:col-span-3"
            htmlFor="file-input"
            ref={hiddenfileinput}
          >
            <Button
              className="w-full"
              type="button"
              icon={CloudArrowUpIcon}
              id="file-input"
              onClick={handleFileClick}
            >
              ファイルを選択
            </Button>
          </label>
          <Button
            className=""
            disabled={!Boolean(selectedFile)}
            onClick={() => {
              setPreviewUrl(uid.data.UserThumbnailURL);
              setSelectedFile(undefined);
            }}
          >
            選択解除
          </Button>
          <Button
            type="submit"
            className="sm:col-span-2"
            disabled={buttonIsLoading}
          >
            {buttonIsLoading ? <LoadingScreen /> : <>アップロード</>}
          </Button>
          <Link href={`/users/${uid.user.name}`} className="sm:col-span-2">
            <Button type="button" className="w-full">
              プロフィール画面に戻る
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
};
export default ProfileImageUpload;
