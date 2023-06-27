import { Models } from "appwrite";

const GenqueStreamScreen = ({
  uid,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
}) => {
  return (
    <>
      <div className="w-full rounded border border-white">
        リアルタイムデータベースによるストリーミング建設予定地
      </div>
    </>
  );
};
export default GenqueStreamScreen;
