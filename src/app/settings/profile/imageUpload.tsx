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
  const isError = (state: boolean) => {
    if (state === true) {
      return setInputError(
        "w-full bg-transparent rounded border border-slate-300"
      );
    } else {
      return "w-full bg-transparent rounded border border-rose";
    }
  };
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

  const HandleEmailVerification = async () => {
    try {
      const res = await api
        .provider()
        .account.createVerification(
          "http://localhost:3000/auth/emailverification/"
        );
      alert(`send email to ${uid.user.email}`);
      console.log(res);
    } catch (e) {
      alert(e);
    }
  };

  const handleUploadFile = async (data: FormValues) => {
    setError("");
    let imageURL = undefined;
    //ここから下は画像があったときだけ動かす
    if (
      !(typeof selectedFile === "undefined") &&
      typeof Server.userThumbnailBucketID === "string"
    ) {
      console.log(selectedFile);
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
        router.refresh();
      } catch {
        (e: any) => {
          if (e.response.message === "string") {
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
      await api.updateDocument(
        Server.databaseID,
        Server.usercollectionID,
        uid.user.$id,
        UploadData
      );
    } else {
      setError("サーバーにアクセスできませんでした");
      throw new Error("さーばーにあくせすできませんでした");
    }
  };

  return (
    <div>
      {" "}
      <form onSubmit={handleSubmit(handleUploadFile)}>
        <div className="grid grid-cols-1 sm:grid-cols-4 min-w-410 gap-4">
          <span className="  aspect-square  row-span-2  rounded  ">
            {" "}
            <img
              src={previewUrl}
              alt="プレビュー"
              className="  
              object-cover rounded aspect-square w-full object-center"
            />
          </span>
          <div className=" col-span-3 ">
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
          <div className="col-span-3 ">
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
            <div className="col-span-4 ">
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
            className="col-span-2"
            htmlFor="file-input"
            ref={hiddenfileinput}
          >
            <span>
              {" "}
              <Button
                className="w-full"
                type="button"
                icon={CloudArrowUpIcon}
                id="file-input"
                onClick={handleFileClick}
              >
                ファイルを選択
              </Button>
            </span>
          </label>
          <Button
            className="col-span-2 "
            disabled={!Boolean(selectedFile)}
            onClick={() => {
              setPreviewUrl(uid.data.UserThumbnailURL);
              setSelectedFile(undefined);
            }}
          >
            選択解除
          </Button>
          <Button type="submit" className="col-span-3 ">
            アップロード
          </Button>
          <Link href={`/users/${uid.user.name}`}>
            <Button type="button" className="col-span-3">
              プロフィール画面に戻る
            </Button>
          </Link>
          <Button type="button" onClick={HandleEmailVerification}>
            eメール認証
          </Button>
        </div>
      </form>
    </div>
  );
};
export default ProfileImageUpload;
