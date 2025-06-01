import { Client, Databases, Account,  } from "node-appwrite";

const client = new Client()

client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const databases = new Databases(client)

export const account = new Account(client)
