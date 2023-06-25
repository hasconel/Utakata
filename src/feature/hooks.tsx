"use client";
import api from "./api";
import { useQuery } from "react-query";
import { Check, Server } from "./config";
import { Query } from "appwrite";

export const GetLoginUser = () => {
  const { isLoading, isError, data, error } = useQuery("user", async () => {
    try {
      if (
        typeof Server.endpoint === "string" &&
        typeof Server.project === "string" &&
        typeof Server.collectionID === "string" &&
        typeof Server.usercollectionID === "string" &&
        typeof Server.databaseID === "string" &&
        typeof Server.bucketID === "string" &&
        typeof Server.userThumbnailBucketID === "string"
      ) {
        const user = await api.getAccount();
        const data = await api
          .provider()
          .database.getDocument(
            Server.databaseID,
            Server.usercollectionID,
            user.$id
          );
        return { user, data };
      } else {
        throw new Error("未ログイン");
      }
    } catch {}
  });
  return { isLoading, isError, data, error };
};
export const GetProfileScreen = (target: string) => {
  const { isLoading, isError, data, error } = useQuery("target", async () => {
    try {
      const currentuser = await api.getAccount().catch(() => {
        throw new Error("ログインしてください");
      });
      if (
        typeof Server.endpoint === "string" &&
        typeof Server.project === "string" &&
        typeof Server.collectionID === "string" &&
        typeof Server.usercollectionID === "string" &&
        typeof Server.databaseID === "string" &&
        typeof Server.bucketID === "string" &&
        typeof Server.userThumbnailBucketID === "string"
      ) {
        const Targetuser = await api.listDocuments(
          Server.databaseID,
          Server.usercollectionID,
          [Query.equal("DisplayUID", [target])]
        );
        const TargetArray = Targetuser.documents.filter(
          (TargetArg) => TargetArg.DisplayUID === target
        );
        if (Boolean(TargetArray[1])) {
          throw new Error("ユーザーネーム衝突！");
        } else {
          if (!Boolean(TargetArray[0])) {
            throw new Error("存在しないユーザー！");
          } else {
            if (TargetArray[0].$id === currentuser.$id) {
              return {
                isCurrentUser: true,
                username: currentuser.$id,
                current: currentuser,
              };
            } else {
              return {
                isCurrentUser: false,
                username: TargetArray[0].$id,
                current: currentuser,
              };
            }
          }
        }
      }
    } catch (e: any) {
      throw new Error(e.message);
    }
  });
  return { isLoading, isError, data, error };
};
