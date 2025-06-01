import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
import RegisterForm from "@/components/features/auth/RegisterForm";
import { redirect } from "next/navigation";
export default async function LoginPage() {
  try {
    await getLoggedInUser();
    redirect("/timeline");
  } catch (error) {
    // エラーの型を適切に判定
    if (error instanceof Error) {
      if (error.message === "セッションの取得に失敗したよ！💦") {
        // 未ログイン、ページを表示
      } else {
        throw error;
      }
    } else {
      throw new Error("An unexpected error occurred");
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            キラキラな世界へようこそ！✨
          </p>
        </div>
        <RegisterForm
         />
      </div>
    </div>
  );
} 