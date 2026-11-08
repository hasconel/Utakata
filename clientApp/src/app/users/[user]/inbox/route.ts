import { wantsActivityJson } from "@/lib/activitypub/contentNegotiation";
import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/serverConfig";
import { verifySignature } from "@/lib/activitypub/crypto";
import { Permission, Role } from "node-appwrite";
import { buildAttachments, buildContent, buildEmojis, buildLegacyContent, buildSummary, isPublicNote, toArray } from "@/lib/activitypub/remoteNote";
import { fetchActivityDocument, sendAccept } from "@/lib/activitypub/remoteActor";
import { postWindowStart } from "@/lib/postWindow";
import { removePostFromIndex } from "@/lib/search/meili";

/** 受け取ったが処理しないアクティビティへの応答。4xxを返すと相手が再送や失敗扱いをする。 */
const ignored = () => new NextResponse(null, { status: 202 });

function isSameOrigin(a: unknown, b: string): boolean {
  try {
    return typeof a === "string" && new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

function idOf(value: any): string | undefined {
  return typeof value === "string" ? value : typeof value?.id === "string" ? value.id : undefined;
}

/** 受信者宛ての通知を作る。同じアクティビティの再送では作らない。 */
async function notify(
  databases: any,
  username: string,
  notification: { id: string; type: "Like" | "Reply" | "Announce"; from: string; target: string }
): Promise<void> {
  const to = process.env.NEXT_PUBLIC_DOMAIN + "/users/" + username;
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    [Query.equal("id", notification.id), Query.equal("to", to)]
  );
  if (documents.length > 0) return;
  await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    ID.unique(),
    { ...notification, to, read: false },
    [Permission.read(Role.user(username)), Permission.update(Role.user(username))]
  );
}

/** 指定した投稿がこのサーバーに保存されていて、受信者の投稿なら返す */
async function findRecipientPost(databases: any, activityId: string | undefined, recipientActorId: string) {
  if (!activityId) return null;
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_POSTS_COLLECTION_ID!,
    [Query.equal("activityId", activityId), Query.limit(1)]
  );
  return documents[0]?.attributedTo === recipientActorId ? documents[0] : null;
}

/**
 * 外部の投稿を posts に保存する（Create と、フォロー中の人のブーストで共通）。
 * 呼ぶ側で、投稿者・公開範囲・重複を確かめておくこと。
 * @param authorId 投稿者（確かめ済みのもの）
 */
async function storeRemoteNote(databases: any, object: any, authorId: string) {
  const postId = ID.unique();
  const base = {
    "activityId": object.id,
    "username": authorId,
    "published": object.published || new Date().toISOString(),
    "cc": toArray(object.cc),
    "to": toArray(object.to),
    "inReplyTo": typeof object.inReplyTo === "string" ? object.inReplyTo : null,
    "attributedTo": authorId,
    "attachment": buildAttachments(object.attachment, object.sensitive === true),
  };
  const createPost = (data: Record<string, unknown>) =>
    databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      postId,
      data,
      [Permission.read(Role.any())]
    );
  let document;
  try {
    document = await createPost({ ...base, "content": buildContent(object), "summary": buildSummary(object), "emojis": buildEmojis(object.tag) });
  } catch (error: any) {
    // posts に summary / emojis の項目がまだ無いとき（scripts/add-post-attributes.mjs の実行前）は、以前の形で保存する
    if (error?.type !== "document_invalid_structure") throw error;
    // ここに来ると絵文字とCWが分かれずに保存されるので、ログで気づけるようにする
    console.warn("投稿を以前の形で保存しました（summary / emojis を保存できませんでした）:", error?.message);
    document = await createPost({ ...base, "content": buildLegacyContent(object) });
  }
  await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
    postId,
    {
      "activityId": object.id,
      "LikedActors": [],
      "replyCount": 0,
    },
    [Permission.read(Role.users()), Permission.update(Role.users())]
  );
  return document;
}

/** 受信者がその人をフォローしているか */
async function isFollowing(databases: any, followerId: string, followeeId: string): Promise<boolean> {
  const { total } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
    [Query.equal("actor", followerId), Query.equal("object", followeeId), Query.limit(1)]
  );
  return total > 0;
}

/**
 * ブーストされた外部の投稿を、相手のサーバーから読んで保存する。
 * Announce に入っている投稿の中身は信用しない（ブーストした人が書き換えられるので、投稿者のサーバーから読み直す）。
 * 表示期間（84時間）より前の投稿は保存しない（古い投稿を掘り返さない。保存するとタイムラインに新しい投稿として出てしまう）。
 */
async function fetchAndStoreBoostedNote(databases: any, noteId: string, signerUserId: string) {
  if (isSameOrigin(noteId, process.env.NEXT_PUBLIC_DOMAIN!)) return null;
  const response = await fetchActivityDocument(noteId, { signer: signerUserId, timeoutMs: 5_000 }).catch(() => null);
  if (!response?.ok) return null;
  let note: any;
  try {
    note = JSON.parse(response.body.toString("utf-8"));
  } catch {
    return null;
  }
  const authorId = idOf(note?.attributedTo);
  if (note?.id !== noteId || note?.type !== "Note" || !authorId || !isSameOrigin(authorId, noteId)) return null;
  if (!isPublicNote(toArray(note.to), toArray(note.cc))) return null;
  const published = Date.parse(note.published);
  if (!Number.isFinite(published) || published < Date.parse(postWindowStart())) return null;
  return storeRemoteNote(databases, note, authorId);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const { user: username } = await params;
  const header = request.headers;
  if(!wantsActivityJson(header.get("Accept"))){
    return NextResponse.json({ error: "Accept header is required" }, { status: 400 });
  }
  if (!username) {
    
    return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
  }

  // 外のサーバー（ログインなし）から呼ばれるので管理者で読む
  const { databases } = await createAdminClient();
  const { documents } = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    [Query.equal("preferredUsername", username)]
  );

  if (documents.length === 0) {
    return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  }

  const actor = documents[0];
  const actorId = `${actor.actorId}`;

  // TODO: 受信したアクティビティ一覧を取得する実装を追加するよ！✨
  return NextResponse.json({
    "@context": "https://www.w3.org/ns/activitystreams",
    "id": `${actorId}/inbox`,
    "type": "OrderedCollection",
    "totalItems": 0,
    "first": {
      "type": "OrderedCollectionPage",
      "id": `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/inbox?page=1`,
      "partOf": `${process.env.NEXT_PUBLIC_DOMAIN}/users/${username}/inbox`,
      "orderedItems": [],
      "next": null
    }
  }, {
    headers: {
      'Content-Type': 'application/activity+json'
    }
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const { user: username } = await params;
  const header = request.headers;
  const rawBody = await request.text();
  let activity: any;
  try {
    activity = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  //console.log("activity",activity)
  const contentType = header.get("Content-Type") ?? "";
  if(!contentType.startsWith("application/activity+json") && !contentType.startsWith("application/ld+json")){
    return NextResponse.json({ error: "Content-Type header is required" }, { status: 400 });
  }
  if (!username) {
    return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
  }
  // actorがオブジェクト化されている場合はidを取得、そうでない場合はIdだろうということでそのまま
  const ActorId = activity.actor?.id ? activity.actor.id : activity.actor;
  if(typeof ActorId !== "string"){
    return NextResponse.json({ error: "Invalid actor" }, { status: 400 });
  }
  //console.log(ActorId);
  // HTTPシグネチャの検証

  const verified = await verifySignature(request, rawBody, ActorId, username);

  if(!verified){
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }
  const { databases : adminDatabases } = await createAdminClient();
  // 宛先のユーザー（inboxのURLはユーザーIDを含み、actorsのドキュメントIDと同じ）
  const recipient = await adminDatabases.getDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_ACTORS_COLLECTION_ID!,
    username
  ).catch(() => null);
  if(!recipient){
    return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  }
  
  // TODO: アクティビティを保存する実装を追加するよ！✨
  // アクティビティの種類によって分岐するよ
  const ObjectId = activity.object?.id ? activity.object.id : activity.object;
  // フォローの場合
  if(activity.type === "Follow"){
    if(ObjectId !== recipient.actorId){
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const isRemoteFollower = !isSameOrigin(ActorId, process.env.NEXT_PUBLIC_DOMAIN!);
    // 再送されたフォローは二重に作らず、Acceptだけ送り直す
    const { documents : existingFollows } = await adminDatabases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      [Query.equal("actor", ActorId), Query.equal("object", ObjectId)]
    );
    if(existingFollows.length > 0){
      if(isRemoteFollower) await sendAccept({ $id: recipient.$id, actorId: recipient.actorId }, ActorId, activity);
      return ignored();
    }
    // 先に通知を作ってしまう
    const notification = await adminDatabases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
      ID.unique(),
      {
        "id": activity.id,
        "type": "Follow",
        "from": ActorId,
        "to": process.env.NEXT_PUBLIC_DOMAIN+"/users/"+username,
        "target": ObjectId,
        "read": false
      },[
        Permission.read(Role.user(username)),
        Permission.update(Role.user(username)),
      ]);
    if(!notification){
      return NextResponse.json({ error: "Failed to create notification" }, { status: 400 });
    }
    const follow = await adminDatabases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
      ID.unique(),
      {
        "id": activity.id,
        "actor": ActorId,
        "object": ObjectId
      }
    )
    if(follow){
      const { documents : actorSub } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        [Query.equal("id", ObjectId)]
      );
      if(actorSub.length === 1){
        await adminDatabases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
          actorSub[0].$id,
          {
            "followersCount": actorSub[0].followersCount + 1
          }
        );
      }
      if(isRemoteFollower) await sendAccept({ $id: recipient.$id, actorId: recipient.actorId }, ActorId, activity);
      return ignored();
    }
    return NextResponse.json({ error: "Failed to create follow" }, { status: 400 });
  }
  // 投稿の場合
  if(activity.type === "Create"){
    const object = activity.object;
    // Note以外は今は処理しない
    if(object?.type !== "Note"){
      return ignored();
    }
    const NoteId = object.id;
    // 投稿者は送信者本人で、投稿のIDも送信者のドメインのものに限る
    const attributedTo = object.attributedTo?.id ?? object.attributedTo;
    if(attributedTo !== ActorId || !isSameOrigin(NoteId, ActorId)){
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const to = toArray(object.to);
    const cc = toArray(object.cc);
    const isLocalNote = isSameOrigin(NoteId, process.env.NEXT_PUBLIC_DOMAIN!);
    // 非公開の投稿は保存しない（保存すると他のログインユーザーからも読めてしまう）
    if(!isLocalNote && !isPublicNote(to, cc)){
      return ignored();
    }
    const isAddressed = [...to, ...cc].includes(recipient.actorId);
    // 受信者の投稿へのリプライか（自分へのリプライは通知しない）
    const repliedPost = await findRecipientPost(adminDatabases, idOf(object.inReplyTo), recipient.actorId);
    const isReplyToRecipient = repliedPost !== null && ActorId !== recipient.actorId;
    // 関係のない投稿を保存しない（宛先に含まれるか、受信者へのリプライか、受信者がフォローしている相手だけ）
    if(!isLocalNote && !isAddressed && !isReplyToRecipient){
      const { documents : following } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        [Query.equal("actor", recipient.actorId), Query.equal("object", ActorId)]
      );
      if(following.length === 0){
        return ignored();
      }
    }
    // 通知するのは受信者の投稿へのリプライだけ（同じアクティビティの再送では増やさない）
    if(isReplyToRecipient){
      await notify(adminDatabases, username, { id: activity.id, type: "Reply", from: ActorId, target: NoteId });
    }
    // 自サーバーの投稿はすでに保存済み
    if(isLocalNote){
      return ignored();
    }
    // 同じ投稿は受信者ごとに届くので、2回目以降は保存しない
    const { documents : noteDocuments } = await adminDatabases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      [Query.equal("activityId", NoteId)]
    );
    if(noteDocuments.length > 0){
      return ignored();
    }
    await storeRemoteNote(adminDatabases, object, ActorId);
    // 外部の投稿は検索の対象外（検索はローカルの投稿だけ）
    return ignored();
  }
  // いいねの場合
  if(activity.type === "Like"){
    // 他人の投稿へのいいねも届くことがあるので、受信者の投稿へのいいねだけ扱う
    const likedPost = await findRecipientPost(adminDatabases, ObjectId, recipient.actorId);
    if(!likedPost || typeof activity.id !== "string"){
      return ignored();
    }
    // ローカルのいいねは送信側ですでに保存しているので、同じIDなら作らない
    const { documents : likeDocuments } = await adminDatabases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_LIKES_COLLECTION_ID!,
      [Query.equal("id", activity.id)]
    );
    if(likeDocuments.length === 0){
      await adminDatabases.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        ID.unique(),
        {
          "id": activity.id,
          "actor": ActorId,
          "object": ObjectId,
        }
      );
    }
    // 自分の投稿への自分のいいねは通知しない
    if(ActorId !== recipient.actorId){
      await notify(adminDatabases, username, { id: activity.id, type: "Like", from: ActorId, target: ObjectId });
    }
    return ignored();
  }
  // ブースト（リノート）の場合
  if(activity.type === "Announce"){
    // AnnounceのIDは送信者のドメインのものに限る（他人のブーストを名乗れないように）
    if(typeof ObjectId !== "string" || typeof activity.id !== "string" || !isSameOrigin(activity.id, ActorId)){
      return ignored();
    }
    // 扱うのは、受信者の投稿へのブーストと、受信者がフォローしている人のブースト（タイムラインに出す）
    const sharedPost = await findRecipientPost(adminDatabases, ObjectId, recipient.actorId);
    const fromFollowee = !sharedPost && await isFollowing(adminDatabases, recipient.actorId, ActorId);
    if(!sharedPost && !fromFollowee){
      return ignored();
    }
    if(!sharedPost){
      const { documents : [storedPost] } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_COLLECTION_ID!,
        [Query.equal("activityId", ObjectId), Query.limit(1)]
      );
      const boostedPost = storedPost ?? await fetchAndStoreBoostedNote(adminDatabases, ObjectId, recipient.$id);
      // 非公開の投稿のブーストは記録しない（タイムラインで広めない）
      if(!boostedPost || !isPublicNote(toArray(boostedPost.to), toArray(boostedPost.cc))){
        return ignored();
      }
    }
    // shares コレクションが無いあいだ（scripts/create-shares-collection.mjs の実行前）は、件数は数えず通知だけ出す
    const sharesCollection = process.env.APPWRITE_SHARES_COLLECTION_ID;
    if(sharesCollection){
      // 1人1投稿につき1回だけ数える（再送や二重のブーストで増やさない）
      const { total : alreadyShared } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        sharesCollection,
        [Query.equal("actor", ActorId), Query.equal("object", ObjectId), Query.limit(1)]
      );
      if(alreadyShared === 0){
        await adminDatabases.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          sharesCollection,
          ID.unique(),
          {
            "id": activity.id,
            "actor": ActorId,
            "object": ObjectId,
          }
        );
      }
    }
    // 通知するのは受信者の投稿へのブーストだけ（自分で自分の投稿をブーストしたときは通知しない）
    if(sharedPost && ActorId !== recipient.actorId){
      await notify(adminDatabases, username, { id: activity.id, type: "Announce", from: ActorId, target: ObjectId });
    }
    return ignored();
  }
  // Undoの場合
  if(activity.type === "Undo"){
    // ブースト取り消しの場合（objectがIDだけのこともある）
    const undoneId = idOf(activity.object);
    if(undoneId && (typeof activity.object === "string" || activity.object?.type === "Announce")){
      const sharesCollection = process.env.APPWRITE_SHARES_COLLECTION_ID;
      if(sharesCollection){
        const { documents : shareDocuments } = await adminDatabases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          sharesCollection,
          [Query.equal("id", undoneId)]
        );
        // 取り消せるのは送信者本人のものだけ
        for(const share of shareDocuments.filter((s: any) => s.actor === ActorId)){
          await adminDatabases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, sharesCollection, share.$id);
        }
      }
      const { documents : notificationDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
        [Query.equal("id", undoneId), Query.equal("type", "Announce")]
      );
      for(const notification of notificationDocuments.filter((n: any) => n.from === ActorId)){
        await adminDatabases.deleteDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
          notification.$id
        );
      }
      // IDだけのUndoはフォローやいいねの取り消しかもしれないので、ブーストとして扱うのはtypeがあるときだけ
      if(activity.object?.type === "Announce") return ignored();
    }
    if(typeof activity.object !== "object" || activity.object === null){
      return ignored();
    }
    // フォロー解除の場合
    if(activity.object.type === "Follow"){
      const { documents : notificationDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
        [Query.equal("id", activity.object.id)]
      );
      // 取り消せるのは送信者本人のものだけ
      if(notificationDocuments.length > 0 && notificationDocuments[0].from === ActorId){
        await adminDatabases.deleteDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
          notificationDocuments[0].$id
        );
      }
      const { documents : followDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        [Query.equal("id", activity.object.id)]
      );
      if(followDocuments.length === 0){
        return NextResponse.json({ error: "Follow not found" }, { status: 404 });
      }
      if(followDocuments.length > 1){
        return NextResponse.json({ error: "Multiple follows found" }, { status: 400 });
      }
      const follow = followDocuments[0];
      if(follow.actor !== ActorId){
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const deleted = await adminDatabases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
        follow.$id
      );
      if(deleted){
        const { documents : actorSub } = await adminDatabases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
          [Query.equal("id", follow.object)]
        );
        if(actorSub.length === 1){
          await adminDatabases.updateDocument(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
            actorSub[0].$id,
            {
              "followersCount": actorSub[0].followersCount - 1
            }
          );
        }
        //
        const Accept = {
          "type": "Accept",
          "actor": ActorId,
          "object": activity,
        }
        return NextResponse.json(Accept, { status: 200 });
      }
      return NextResponse.json({ error: "Failed to delete follow" }, { status: 400 });
    }
    // Like解除の場合
    if(activity.object.type === "Like"){
      const { documents : likeDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        [Query.equal("id", activity.object.id)]
      );
      const { documents : notificationDocuments } = await adminDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
        [Query.equal("id", activity.object.id)]
      );
      if(notificationDocuments.length > 0 && notificationDocuments[0].from === ActorId){
        await adminDatabases.deleteDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
          notificationDocuments[0].$id
        );
      }
      if(likeDocuments.length === 0){
        return NextResponse.json({ error: "Like not found" }, { status: 404 });
      }
      if(likeDocuments.length > 1){
        return NextResponse.json({ error: "Multiple likes found" }, { status: 400 });
      }
      const like = likeDocuments[0];
      if(like.actor !== ActorId){
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const deleted = await adminDatabases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_LIKES_COLLECTION_ID!,
        like.$id,
      )
      if(deleted){
        const Accept = {
          "type": "Accept",
          "actor": ActorId,
          "object": activity,
        }
        return NextResponse.json(Accept, { status: 200 });
      }
      return NextResponse.json({ error: "Failed to delete like" }, { status: 400 });
    }
    return ignored();
  }
  if(activity.type === "Delete"){
    const { documents : noteDocuments } = await adminDatabases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      [Query.equal("activityId", ObjectId)]
    );
    // 持っていない投稿やアカウント自体の削除は処理することがない
    if(noteDocuments.length === 0){
      return ignored();
    }
    if(noteDocuments.length > 1){
      return NextResponse.json({ error: "Multiple notes found" }, { status: 400 });
    }
    const note = noteDocuments[0];
    // 削除できるのは投稿者本人だけ
    if(note.attributedTo !== ActorId){
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const deleted = await adminDatabases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_POSTS_COLLECTION_ID!,
      note.$id,
    )
    if(deleted){
      await adminDatabases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_POSTS_SUB_COLLECTION_ID!,
        note.$id,
      ).catch(() => null);
      await removePostFromIndex(note.$id);
      const Accept = {
        "type": "Accept",
        "actor": ActorId,
        "object": activity,
      }
      return NextResponse.json(Accept, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to delete note" }, { status: 400 });
  }
  // Accept / Reject / Update などは今は処理しない
  return ignored();
}
  