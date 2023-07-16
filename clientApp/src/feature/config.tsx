type Config = {
  endpoint: string | undefined;
  project: string | undefined;
  collectionID: string | undefined;
  usercollectionID: string | undefined;
  subCollectionID: string | undefined;
  databaseID: string | undefined;
  bucketID: string | undefined;
  userThumbnailBucketID: string | undefined;
  deployPont: string | undefined;
};
export const Server: Config = {
  endpoint: process.env.NEXT_PUBLIC_REACT_APP_ENDPOINT,
  project: process.env.NEXT_PUBLIC_REACT_APP_PROJECT,
  collectionID: process.env.NEXT_PUBLIC_REACT_APP_COLLECTION_ID,
  usercollectionID: process.env.NEXT_PUBLIC_REACT_APP_USERCOLLECTION_ID,
  subCollectionID: process.env.NEXT_PUBLIC_REACT_APP_SUBCOLLECTION_ID,
  databaseID: process.env.NEXT_PUBLIC_REACT_APP_DATABASE_ID,
  bucketID: process.env.NEXT_PUBLIC_REACT_APP_BUCKET_ID,
  userThumbnailBucketID:
    process.env.NEXT_PUBLIC_REACT_APP_USERTHUMBNAIL_BUCKET_ID,
  deployPont: process.env.NEXT_PUBLIC_KEY_PUBLIC_DEPLOYPOINT,
};
export const Check = () => {
  if (
    typeof Server.endpoint === "string" &&
    typeof Server.project === "string" &&
    typeof Server.collectionID === "string" &&
    typeof Server.usercollectionID === "string" &&
    typeof Server.databaseID === "string" &&
    typeof Server.bucketID === "string" &&
    typeof Server.userThumbnailBucketID === "string"
  ) {
    return true;
  } else {
    return false;
  }
};
