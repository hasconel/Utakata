"use Client";
import LoadingScreen from "@/contents/loading";
import UrlInText from "@/contents/urlInText";
import api from "@/feature/api";
import { Server } from "@/feature/config";
import { ID, Models } from "appwrite";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const GenqueApplyScreen = ({
  uid,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
}) => {
  const [name, setName] = useState("");
  const [content, setContents] = useState(<></>);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const router = useRouter();
  const handlesubmit = async (e: any) => {
    e.preventDefault();
    setButtonLoading(true);
    try {
      const content = await UrlInText({ arg: name });
      if (content != undefined) {
        setContents(content);
      }
      if (Server.databaseID && Server.collectionID) {
        const UploadData = JSON.stringify({
          data: name,
          createUserId: uid.user.$id,
        });
        await api
          .createDocument(Server.databaseID, Server.collectionID, UploadData)
          .catch((e) => console.log(e));
      }
      setName("");
      setButtonLoading(false);
    } catch {}
  };
  return (
    <>
      {" "}
      <>
        <div className="grid w-full">
          <div className="w-full rounded border border-white">
            <form method="post" onSubmit={handlesubmit}>
              <div className="w-11/12">
                <textarea
                  name="name"
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  className="bg-slate-900 m-2 border border-slate-700 w-full"
                />
              </div>
              <div>
                {" "}
                <button
                  type="submit"
                  className="bg-slate-800 mx-2 px-4 w-20  py-1 rounded hover:bg-slate-600"
                  disabled={buttonLoading}
                >
                  {buttonLoading ? <LoadingScreen /> : <>投稿</>}
                </button>
              </div>
              <div> {content && <>{content}</>}</div>
            </form>
          </div>
        </div>
      </>
    </>
  );
};
export default GenqueApplyScreen;
