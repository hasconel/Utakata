import "dotenv/config";
type Config = {
  endpoint: string | undefined;
  project: string | undefined;
  collectionID: string | undefined;
  usercollectionID: string | undefined;
  databaseID: string | undefined;
  bucketID: string | undefined;
  userThumbnailBucketID: string | undefined;
  Key: string | undefined;
};
export const Server: Config = {
  endpoint: process.env.REACT_APP_ENDPOINT,
  project: process.env.REACT_APP_PROJECT,
  collectionID: process.env.REACT_APP_COLLECTION_ID,
  usercollectionID: process.env.REACT_APP_USERCOLLECTION_ID,
  databaseID: process.env.REACT_APP_DATABASE_ID,
  bucketID: process.env.REACT_APP_BUCKET_ID,
  userThumbnailBucketID: process.env.REACT_APP_USERTHUMBNAIL_BUCKET_ID,
  Key: process.env.REACT_APP_APIKEY,
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
