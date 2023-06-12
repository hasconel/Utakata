"use client";

import React, { useRef, useState } from "react";
import api from "../feature/api";
import { Server } from "../feature/config";
import { AlertMessage } from "./alert";
import { ID } from "appwrite";
import { CloudArrowUpIcon } from "@heroicons/react/20/solid";
import { Button } from "@tremor/react";

const FileUploadPage: React.FC = () => {
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const handleFileClick = () => {
    hiddenFileInput.current?.click();
  };
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
          ID.unique(),
          selectedFile
        );
        console.log(data);
      } catch (e: any) {
        setError(e.response.message);
      }
    } else {
      setError("ファイルを選択する");
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

export default FileUploadPage;
