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
        <div className="max-width-full rounded border border-white">
          ツイート画面建設予定地
          <form method="post" onSubmit={handlesubmit}>
            <input
              type="text"
              name="name"
              id="name"
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="bg-slate-900"
            />
            <button type="submit">test</button>
            {value}
            {content && <>{content}</>}
          </form>
        </div>
      </>
    </>
  );
};
export default GenqueApplyScreen;
