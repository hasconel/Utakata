import Link from "next/link";
import LogoutButton from "@/components/features/auth/LogoutButton";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-8">
          設定 ✨
        </h1>
        <div className="grid gap-4">
          <Link
            href="/settings/profile"
            className="w-full p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-purple-100 dark:border-purple-900"
          >
            <h2 className="text-lg font-semibold text-purple-600 dark:text-pink-500">
              プロフィール
            </h2>
          </Link>
          <Link
            href="/settings/mutes"
            className="w-full p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-purple-100 dark:border-purple-900"
          >
            <h2 className="text-lg font-semibold text-purple-600 dark:text-pink-500">
              ミュートユーザーの設定
            </h2>
          </Link>
          <Link
            href="/settings/email"
            className="w-full p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-purple-100 dark:border-purple-900"
          >
            <h2 className="text-lg font-semibold text-purple-600 dark:text-pink-500">
              メールアドレスの変更
            </h2>
          </Link>
          <Link
            href="/settings/password"
            className="w-full p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-purple-100 dark:border-purple-900"
          >
            <h2 className="text-lg font-semibold text-purple-600 dark:text-pink-500">
              パスワードの変更
            </h2>
          </Link>
          <div className="w-full p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900">
            <LogoutButton />
          </div>
          <Link
            href="/settings/delete"
            className="w-full p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-red-200 dark:border-red-800"
          >
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              ☠ アカウントの削除 ☠
            </h2>
          </Link>
        </div>
    </div>
  );
}
