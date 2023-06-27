"use Client;";
import UrlInText from "@/contents/urlInText";
import { Models } from "appwrite";
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
  const [value, setValue] = useState<string>("");
  const [content, setContents] = useState(<></>);
  const handlesubmit = async (e: any) => {
    e.preventDefault();
    try {
      setValue(name);
      const content = await UrlInText({ arg: name });
      if (content != undefined) {
        setContents(content);
      }
    } catch {}
  };
  return (
    <>
      {" "}
      <>
        <div className="grid w-full">
          <div className="w-full rounded border border-white">
            ツイート画面建設予定地
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
                  className="bg-slate-800 mx-2 px-4  py-1 rounded hover:bg-slate-600"
                >
                  test
                </button>
              </div>
              <div>{value}</div>
              <div> {content && <>{content}</>}</div>
            </form>
          </div>
        </div>
      </>
    </>
  );
};
export default GenqueApplyScreen;
