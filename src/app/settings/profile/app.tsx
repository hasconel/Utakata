"use client";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import { AlertMessage } from "@/contents/alert";
import { useState, useRef } from "react";
import { Button, Card } from "@tremor/react";
import { CloudArrowUpIcon } from "@heroicons/react/24/solid";
import { getLoginUser } from "@/feature/hooks";
import LoadingScreen from "@/contents/loading";
import hoge from "./default-thumbnail.svg";
import Image from "next/image";

const ProfileImageUpload = ({ uid }: { uid: string }) => {
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const handleFileClick = () => {
    hiddenFileInput.current?.click();
  };
  const [error, setError] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
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

  const handleUploadFile = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError("");
    if (selectedFile && typeof Server.bucketID === "string") {
      try {
        const data = await api.createStorage(
          Server.bucketID,
          uid,
          selectedFile
        );
        console.log(data);
      } catch (e: any) {
        setError(e.response.message);
      }
    } else {
      setError("プロフィール画像を選択する");
    }
  };

  return (
    <div>
      {selectedFile && (
        <img
          src={previewUrl}
          alt="プレビュー"
          style={{ width: "300px", height: "auto" }}
        />
      )}
      {error && <AlertMessage message={error} />}
      <label htmlFor="upload-input">
        <input
          id="upload-input"
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          ref={hiddenFileInput}
        />
        <Button icon={CloudArrowUpIcon} onClick={handleFileClick}>
          ファイルを選択
        </Button>
      </label>
      {selectedFile && (
        <>
          選択したファイル: {selectedFile.name}
          <Button onClick={(e) => setSelectedFile(null)}>選択解除</Button>
        </>
      )}
      <Button onClick={handleUploadFile}>アップロード</Button>
    </div>
  );
};
const ProfileSetting = () => {
  const { data, isLoading, isError, error } = getLoginUser();
  return (
    <>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {data && (
            <Card className="max-w-lg mx-auto mt-8 gap-6">
              <ProfileImageUpload uid={data.$id} />
              <Image
                src="http://192.168.10.114/v1/storage/buckets/64848d260bbc1991fc66/files/6485a0507fa347da1a86/view?project=642bf5b7bb1dc99d8f5d"
                alt="hoge"
                width="400"
                height="400"
              />
            </Card>
          )}
        </>
      )}
    </>
  );
};
export default ProfileSetting;
