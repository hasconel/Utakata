import UserProfileClient from "./UserProfileClient";
import { profileMetadata } from "@/lib/pageMetadata";

type Props = { params: Promise<{ user: string }> };

export async function generateMetadata({ params }: Props) {
  return profileMetadata((await params).user);
}

export default async function UserProfile({ params }: Props) {
  const { user } = await params;
  return <UserProfileClient userParam={user} />;
}
