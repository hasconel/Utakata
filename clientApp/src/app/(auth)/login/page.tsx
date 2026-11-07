import { redirect } from "next/navigation";
import LoginForm from "@/components/features/auth/LoginForm";
import { getCurrentUser } from "@/lib/appwrite/auth";

// ログイン済みならサーバー側でタイムラインへ移動する（フォームが一瞬見えてから移動するのを防ぐ）
export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/timeline");

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">ログイン</h1>
          <p className="mt-2 text-muted-foreground">おかえりなさい🫧</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
