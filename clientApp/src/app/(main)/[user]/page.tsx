import UserProfileClient from "./UserProfileClient";

export default async function UserProfile({ params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  
  return <UserProfileClient userParam={user} />;
} 