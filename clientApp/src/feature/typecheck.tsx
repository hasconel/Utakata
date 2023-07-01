import { Models } from "appwrite";

export const TypeCheck = {
  isDocument: (arg: unknown): arg is Models.Document => {
    return (
      typeof arg === "object" &&
      arg != null &&
      "$id" in arg &&
      arg.$id != null &&
      typeof arg.$id === "string" &&
      "$createdAt" in arg &&
      arg.$createdAt != null &&
      typeof arg.$createdAt === "string" &&
      "$collectionId" in arg &&
      arg.$collectionId != null &&
      typeof arg.$collectionId === "string" &&
      "$databaseId" in arg &&
      arg.$databaseId != null &&
      typeof arg.$databaseId === "string"
    );
  },
};
