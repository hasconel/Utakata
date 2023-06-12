import React, { useState } from "react";
import api from "../feature/api";
import { Server } from "../feature/config";
import { AlertMessage } from "./alert";
import { ID } from "appwrite";

const StyledInput = styled("input")({
  display: "none",
});

const ProfileImageUpload = ({ uid }: { uid: string }) => {
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
        setError("画像p専用です");
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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        gap={2}
      >
        {selectedFile && (
          <img
            src={previewUrl}
            alt="プレビュー"
            style={{ width: "300px", height: "auto" }}
          />
        )}
        {error && <AlertMessage message={error} />}
        <label htmlFor="upload-input">
          <StyledInput
            id="upload-input"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
          />
          <Button
            variant="contained"
            component="span"
            startIcon={<CloudUploadIcon />}
            color="primary"
          >
            プロフィール画像を選択
          </Button>
        </label>
        {selectedFile && (
          <>
            <Typography variant="body1" align="center">
              選択したファイル: {selectedFile.name}
            </Typography>{" "}
            <Button
              variant="contained"
              color="primary"
              onClick={(e) => setSelectedFile(null)}
            >
              選択解除
            </Button>
          </>
        )}
        <Button variant="contained" color="primary" onClick={handleUploadFile}>
          プロフィール画像アップロード
        </Button>
      </Box>
    </div>
  );
};

export default ProfileImageUpload;
