import { redirect } from "next/navigation";
import LoginForm from "@/components/features/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";

export default async function LoginPage() {
  try {
    const { user, isLoading: isAuthLoading } = useAuth();
    if (user && !isAuthLoading) {
      redirect("/timeline");
    }
  } catch (error) {
    // エラーの型を適切に判定
    if (error instanceof Error) {
      if (error.message === "セッションが見つからないよ！💦") {
        // 未ログイン、ページを表示
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
    } else {
      throw error;
    }
  }

  // ログインページの表示
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