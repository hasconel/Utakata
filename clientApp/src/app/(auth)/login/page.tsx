import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
import { redirect } from "next/navigation";
import LoginForm from "@/components/features/auth/LoginForm";

export default async function LoginPage() {
  try {
    await getLoggedInUser();
    redirect("/timeline");
  } catch (error) {
    // エラーの型を適切に判定
    if (error instanceof Error) {
      if (error.message === "セッションが見つからないよ！💦") {
        // 未ログイン、ページを表示
        //console.log("No session found:", error.message);
      } else {
        //console.error("Unexpected error:", error.message);
        throw error;
      }
    } else {
      //console.error("Unknown error:", error);
      throw new Error("An unexpected error occurred");
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            ログイン
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            キラキラな世界へようこそ！✨
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
} 