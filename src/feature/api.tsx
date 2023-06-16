import { Server } from "./config";
import { v4 as uuidv4 } from "uuid";
import {
  Client as Appwrite,
  Databases,
  Account,
  Storage,
  Models,
  ID,
} from "appwrite";

interface Api {
  sdk: { database: Databases; account: Account; storage: Storage } | null;
  provider: () => { database: Databases; account: Account; storage: Storage };
  createAccount: (
    email: string,
    password: string,
    name: string
  ) => Promise<{
    User: Models.User<Models.Preferences>;
    UserDoc: Models.Document;
  }>;
  getAccount: () => Promise<Models.User<Models.Preferences>>;
  createSession: (email: string, password: string) => Promise<Models.Session>;
  deleteCurrentSession: () => Promise<{}>;
  createDocument: (
    databaseID: string,
    collectionID: string,
    data: Omit<Models.Document, keyof Models.Document>,
    permissions?: string[] | undefined
  ) => Promise<Models.Document>;
  listDocuments: (
    databaseID: string,
    collectionID: string,
    queries?: string[]
  ) => Promise<Models.DocumentList<Models.Document>>;
  deleteDocument: (
    databaseID: string,
    collectionID: string,
    documentID: string
  ) => Promise<{}>;
  createStorage: (
    bucketID: string,
    fileID: string,
    file: File,
    permissions?: string[]
  ) => Promise<Models.File>;
  listFiles: (
    bucketID: string,
    queries?: string[],
    search?: string
  ) => Promise<Models.FileList>;
  getFile: (bucketID: string, fileID: string) => Promise<Models.File>;
  getFilePreview: (
    bucketID: string,
    fileID: string,
    width?: number,
    height?: number,
    gravity?:
      | "center"
      | "top-left"
      | "top"
      | "top-right"
      | "left"
      | "right"
      | "bottom-left"
      | "bottom"
      | "bottom-right",
    quality?: number,
    borderWidth?: number,
    borderColor?: string,
    BorderRadius?: number,
    opacity?: number,
    rotation?: number,
    background?: string,
    output?: "jpg" | "jpeg" | "png" | "gif" | "webp"
  ) => URL;
}

let api: Api = {
  sdk: null,
  provider: () => {
    if (api.sdk) {
      return api.sdk;
    }
    let appwrite = new Appwrite();
    if (
      typeof Server.endpoint === "string" &&
      typeof Server.project === "string"
    ) {
//      console.log("api is exist");
      appwrite.setEndpoint(Server.endpoint).setProject(Server.project);
      const account: Account = new Account(appwrite);
      const database: Databases = new Databases(appwrite);
      const storage: Storage = new Storage(appwrite);
      api.sdk = { database, account, storage };
      return api.sdk;
    } else {
//      console.log("api is not exist");
      throw new Error();
    }
  },
  createAccount: async (email: string, password: string, name: string) => {
    const uid = uuidv4();
    const data = JSON.stringify({ DisplayUID: name });
    if (
      typeof Server.databaseID === "string" &&
      typeof Server.usercollectionID === "string"
    ) {
      const User = await api
        .provider()
        .account.create(uid, email, password, name);
      const UserDoc = await api
        .provider()
        .database.createDocument(
          Server.databaseID,
          Server.usercollectionID,
          uid,
          data
        );
      return { User: User, UserDoc: UserDoc };
    } else {
      throw new Error();
    }
  },
  getAccount: () => {
    let account = api.provider().account;
    return account.get();
  },
  createSession: (email: string, password: string) => {
    return api.provider().account.createEmailSession(email, password);
  },
  deleteCurrentSession: () => {
    return api.provider().account.deleteSession("current");
  },
  createDocument: (
    databaseID: string,
    collectionID: string,
    data: Omit<Models.Document, keyof Models.Document>,
    permissions?: string[]
  ) => {
    return api
      .provider()
      .database.createDocument(
        databaseID,
        collectionID,
        `unique()`,
        data,
        permissions
      );
  },
  listDocuments: (
    databaseID: string,
    collectionID: string,
    queries?: string[]
  ) => {
    return api.provider().database.listDocuments(databaseID, collectionID);
  },
  deleteDocument: (
    databaseID: string,
    collectionID: string,
    documentID: string
  ) => {
    return api
      .provider()
      .database.deleteDocument(databaseID, collectionID, documentID);
  },
  createStorage: (
    bucketID: string,
    fileID: string,
    file: File,
    permissions?: string[] | undefined
  ) => {
    return api
      .provider()
      .storage.createFile(bucketID, fileID, file, permissions);
  },
  listFiles: (bucketID: string, queries?: string[], search?: string) => {
    return api.provider().storage.listFiles(bucketID, queries, search);
  },
  getFile: (bucketID: string, fileID: string) => {
    return api.provider().storage.getFile(bucketID, fileID);
  },
  getFilePreview: (
    bucketID: string,
    fileID: string,
    width?: number,
    height?: number,
    gravity?: string,
    quality?: number,
    borderWidth?: number,
    borderColor?: string,
    BorderRadius?: number,
    opacity?: number,
    rotation?: number,
    background?: string,
    output?: string
  ) => {
    return api
      .provider()
      .storage.getFilePreview(
        bucketID,
        fileID,
        width,
        height,
        gravity,
        quality,
        borderWidth,
        borderColor,
        BorderRadius,
        opacity,
        rotation,
        background,
        output
      );
  },
};
export default api;
