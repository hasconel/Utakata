// followを確認して存在しなければ作成する関数 UserとAdminで別々に作成してAdminはInboxから叩く。UserはOutboxから叩く。
import { createSessionClient,createAdminClient } from "../appwrite/serverConfig";
import { Query ,ID} from "node-appwrite";


export async function createFollowOutbox(id: string, actor: string, object: string) {
    const { databases } = await createSessionClient();
    // databaseから重複がないか確認
    const follow = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_FOLLOWS_COLLECTION_ID!, [
        Query.or([Query.equal("id", id),Query.and([Query.equal("actor", actor),Query.equal("object", object)])]),
    ]);
    if (follow.documents.length > 0) {
        return ;
    }
    const newFollow = await databases.createDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_FOLLOWS_COLLECTION_ID!, ID.unique(), {
        id,
        actor,
        object,
    });
    const { documents: actorSubList } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        [Query.equal("id", actor)]
    );
    if(actorSubList.length === 0){
        return ;
    }
    await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        actorSubList[0].$id,
        {followingCount: actorSubList[0].followingCount+1}
    );
    return newFollow.id;
}

export async function createFollowInbox(id: string, actor: string, object: string) {
    const { databases } = await createAdminClient();
    const { documents: actorSubList } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        [Query.equal("id", object)]
    );
    if(actorSubList.length === 0){
        return id;
    }
    await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        actorSubList[0].$id,
        {followersCount: actorSubList[0].followersCount+1}
    );
    const follow = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_FOLLOWS_COLLECTION_ID!, [
        Query.or([Query.equal("id", id),Query.and([Query.equal("actor", actor),Query.equal("object", object)])]),
    ]);
    if (follow.documents.length > 0) {
        return follow.documents[0].id;
    }
    const newFollow = await databases.createDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_FOLLOWS_COLLECTION_ID!, ID.unique(), {
        id: id,
        actor,
        object,
    });
    return newFollow.id;
}

export async function deleteFollowOutbox(id: string ) {
    const { databases } = await createSessionClient();
    const follow = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_FOLLOWS_COLLECTION_ID!, [
        Query.equal("id", id),
    ]);
    if (follow.documents.length === 0) {
        return id;
    }
    await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_FOLLOWS_COLLECTION_ID!, follow.documents[0].$id);
    const { documents: actorSubList } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        [Query.equal("id", follow.documents[0].actor)]
    );
    if(actorSubList.length === 0){
        return id;
    }
    await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        actorSubList[0].$id,
        {followingCount: actorSubList[0].followingCount-1}
    );
    return follow.documents[0].id;
}

export async function deleteFollowInbox(id: string, objectId: string) {
    const { databases } = await createAdminClient();
    const { documents: actorSubList } = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        [Query.equal("id", objectId)]
    );
    if(actorSubList.length === 0){
        return id;
    }
    await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_ACTORS_SUB_COLLECTION_ID!,
        actorSubList[0].$id,
        {followersCount: actorSubList[0].followersCount-1}
    );
    const follow = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_FOLLOWS_COLLECTION_ID!, [
        Query.equal("id", id),
    ]);
    if (follow.documents.length === 0) {
        return id;
    }
    await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_FOLLOWS_COLLECTION_ID!, follow.documents[0].$id);
    return follow.documents[0].id;
}