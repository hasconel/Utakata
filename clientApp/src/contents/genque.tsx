import { Models } from "appwrite";
import UrlInText from "./urlInText";
import Image from "next/image";
import Link from "next/link";

const Genque = ({
  data,
  currentUserId,
  UserDoc,
}: {
  data: Models.Document;
  currentUserId: string;
  UserDoc: Models.Document;
}) => {
  if (data.createUserId != UserDoc.$id) return <></>;

  return (
    <div className="grid">
      <div id="thumbnail">
        <Image
          src={UserDoc.UserThumbnailURL}
          alt={UserDoc.DisplayName}
          width={48}
          height={48}
        />
      </div>
      <Link href={`/users/${UserDoc.DisplayUID}`}>
        <div id="DisplayName">{UserDoc.DisplayName}</div>
        <div id="DisplayUid">{UserDoc.DisplayUID}</div>
      </Link>
      <div id="data">{data.data}</div>
      {data.mediaURL ? (
        <div id="mediaURL"></div>
      ) : (
        <div id="ex">
          <UrlInText arg={data.data} />
        </div>
      )}
      <div id="CreateTime"></div>
      {data.GoodUserId.length && (
        <div id="goodUsers">{data.GoodUserId.length}</div>
      )}
    </div>
  );
};
export default Genque;
