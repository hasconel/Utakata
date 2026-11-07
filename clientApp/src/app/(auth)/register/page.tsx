import { redirect } from "next/navigation";
import RegisterForm from "@/components/features/auth/RegisterForm";
import { getCurrentUser } from "@/lib/appwrite/auth";

// ログイン済みならサーバー側でタイムラインへ移動する（フォームが一瞬見えてから移動するのを防ぐ）
export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/timeline");

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">はじめまして！</h1>
          <p className="mt-2 text-muted-foreground">アカウントを作って、うたかたに参加しよ🫧</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
