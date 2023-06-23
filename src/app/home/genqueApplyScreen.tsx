import { Models } from "appwrite";

const GenqueApplyScreen = ({
  uid,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
}) => {
  return (
    <>
      {" "}
      <>
        <div className="max-width-full rounded border border-white">
          ツイート画面建設予定地
        </div>
      </>
    </>
  );
};
export default GenqueApplyScreen;
