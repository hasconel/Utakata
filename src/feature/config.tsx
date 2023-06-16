import "dotenv/config";
type Config = {
  endpoint: string | undefined;
  project: string | undefined;
  collectionID: string | undefined;
  usercollectionID: string | undefined;
  databaseID: string | undefined;
  bucketID: string | undefined;
};
export const Server: Config = {
  endpoint: process.env.REACT_APP_ENDPOINT,
  project: process.env.REACT_APP_PROJECT,
  collectionID: process.env.REACT_APP_COLLECTION_ID,
  usercollectionID: process.env.REACT_APP_USERCOLLECTION_ID,
  databaseID: process.env.REACT_APP_DATABASE_ID,
  bucketID: process.env.REACT_APP_BUCKET_ID,
};
