"use client";
import api from "./api";
import { useQuery } from "react-query";
import { Server } from "./config";
import { Models, Query } from "appwrite";
import { Temporal } from "temporal-polyfill";

export const GetRankingList = () => {
  const { isLoading, isError, data, error } = useQuery("rank", async () => {
    if (Server.databaseID && Server.subCollectionID) {
      const date = Temporal.Now.instant().add({ hours: -12 }).toString();
      const Doc = await api.listDocuments(
        Server.databaseID,
        Server.subCollectionID,
        [Query.limit(99), Query.greaterThan("$createdAt", date)]
      );
      const Result = Doc.documents.sort((a, b) => {
        return b.GoodedUsers.length - a.GoodedUsers.length;
      });
      return Result.slice(0, 15);
    } else {
      throw new Error("サーバーとの接続に失敗");
    }
  });
  return { isLoading, isError, data, error };
};
export const SearchGetGenques = (searchWord: string) => {
  const { isLoading, isError, data, error } = useQuery(searchWord, async () => {
    try {
      if (
        Server.databaseID != undefined &&
        Server.collectionID != undefined &&
        Server.usercollectionID != undefined
      ) {
        const PostQueries = [Query.search("data", searchWord), Query.limit(99)];
        const initstream = await api.listDocuments(
          Server.databaseID,
          Server.collectionID,
          PostQueries
        );
        //   console.log(initstream);
        if (initstream != undefined) {
          const date = Temporal.Now.instant().add({ hours: -12 }).toString();

          const TrueDocList = initstream.documents.filter((d) => {
            d.$createdAt > date && d.deleted === false;
          });
          const UserList0: string[] = Array.from(
            new Set(
              TrueDocList.map((d) => {
                return d.createUserId;
              })
            )
          ).filter((ag) => ag != null);
          //   console.log(UserList0);
          const UserList = await api.listDocuments(
            Server.databaseID,
            Server.usercollectionID,
            [Query.equal("$id", UserList0)]
          );
          //   console.log(UserList);
          return { docs: TrueDocList, userList: UserList.documents };
        } else {
          const NullList: Models.Document[] = [];
          return { docs: NullList, userList: NullList };
        }
      }
    } catch (e) {
      console.log(e);
    }
  });
  return { isLoading, isError, data, error };
};
export const GetGenqueStream = (queries?: string[]) => {
  const request: XMLHttpRequest = new XMLHttpRequest();
  let key = "genque";
  if (queries) {
    key = queries.toString();
  }
  const { isLoading, isError, data, error } = useQuery(key, async () => {
    try {
      if (
        Server.databaseID != undefined &&
        Server.collectionID != undefined &&
        Server.usercollectionID != undefined
      ) {
        const date: string = await new Promise((resolve, reject) => {
          request.open("HEAD", window.location.href, true);
          request.send(null);
          request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status !== 0) {
              const ServerDate = request.getResponseHeader("Date");
              const ServerDate2 = new Date();
              const ServerDate3 = ServerDate2.toISOString();
              if (ServerDate != null) {
                const serverTime0 = Temporal.Instant.from(ServerDate3);
                const serverTime = Temporal.Instant.from(
                  serverTime0.add({ hours: -12 })
                ).toString();
                return resolve(serverTime);
              } else throw new Error("通信に失敗しました");
            } else if (request.readyState === 4 && request.status === 0) {
              return reject("通信に失敗しました");
            }
          };
        });
        let PostQueries = [
          Query.notEqual("deleted", [true]),
          Query.greaterThan("$createdAt", date),
          Query.orderDesc("$createdAt"),
        ];
        if (queries != undefined) PostQueries = PostQueries.concat(queries);
        // console.log(PostQueries);
        const initstream = await api.listDocuments(
          Server.databaseID,
          Server.collectionID,
          PostQueries
        );
        //   console.log(initstream);
        if (initstream != undefined) {
          const UserList0: string[] = Array.from(
            new Set(
              initstream.documents.map((d) => {
                return d.createUserId;
              })
            )
          ).filter((ag) => ag != null);
          //   console.log(UserList0);
          const UserList = await api.listDocuments(
            Server.databaseID,
            Server.usercollectionID,
            [Query.equal("$id", UserList0)]
          );
          //   console.log(UserList);
          return {
            docs: initstream.documents,
            userList: UserList.documents,
            lastTime:
              initstream.documents[initstream.documents.length - 1].$createdAt,
          };
        } else {
          const NullList: Models.Document[] = [];
          return { docs: NullList, userList: NullList, lastTime: "" };
        }
      }
    } catch (e) {
      //   console.log(e);
    }
  });
  return { isLoading, isError, data, error };
};
export const GetSingleGenque = (arg: string) => {
  const request: XMLHttpRequest = new XMLHttpRequest();
  const { isLoading, isError, data, error } = useQuery(arg, async () => {
    if (Server.databaseID && Server.collectionID && Server.usercollectionID) {
      const date: string = await new Promise((resolve, reject) => {
        request.open("HEAD", window.location.href, true);
        request.send(null);
        request.onreadystatechange = () => {
          if (request.readyState === 4 && request.status !== 0) {
            const ServerDate = request.getResponseHeader("Date");
            const ServerDate2 = new Date();
            const ServerDate3 = ServerDate2.toISOString();
            if (ServerDate != null) {
              const serverTime0 = Temporal.Instant.from(ServerDate3);
              const serverTime = Temporal.Instant.from(
                serverTime0.add({ hours: -12 })
              ).toString();
              return resolve(serverTime);
            } else throw new Error("通信に失敗しました");
          } else if (request.readyState === 4 && request.status === 0) {
            return reject("通信に失敗しました");
          }
        };
      });
      const Doc = await api.getDocument(
        Server.databaseID,
        Server.collectionID,
        arg,
        [
          Query.notEqual("deleted", [true]),
          Query.greaterThan("$createdAt", date),
        ]
      );
      const User = await api.getDocument(
        Server.databaseID,
        Server.usercollectionID,
        Doc.createUserId
      );
      if (Doc.$createdAt > date && Doc.deleted != true) {
        return { User, Doc };
      }
    } else {
      throw new Error("サーバーとの接続に失敗");
    }
  });
  return { isLoading, isError, data, error };
};
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
