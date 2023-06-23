import { Models } from "appwrite";
import GenqueStreamScreen from "./genqueStreamScreen";
import GenqueApplyScreen from "./genqueApplyScreen";

const UserHome = ({
  uid,
}: {
  uid: {
    user: Models.User<Models.Preferences>;
    data: Models.Document;
  };
}) => {
  return (
    <>
      <GenqueApplyScreen uid={uid} />
      <GenqueStreamScreen uid={uid} />
    </>
  );
};
export default UserHome;
