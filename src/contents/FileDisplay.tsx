import api from "../feature/api";
import { Server } from "../feature/config";
import { Models } from "appwrite";
import { Button } from "@tremor/react";
const TestButton = () => {
  const [file, setFile] = useState<string | null>(null);
  const Test = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setFile(null);
    try {
      if (typeof Server.bucketID === "string") {
        const hoge = await api.listFiles(Server.bucketID);
        console.log(hoge);
        console.log(hoge.files[1].$id);
        const file0 = await api.getFilePreview(
          Server.bucketID,
          hoge.files[1].$id,
          800
        );
        console.log(file0);
        setFile(file0.href);
      }
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <>
      {file && <img src={file} />}
      <Button onClick={Test}>実験用</Button>
    </>
  );
};

export default TestButton;
