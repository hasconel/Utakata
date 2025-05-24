"use client";

import { useState } from "react";
import { RegisterUser } from "@/lib/appwrite/client";
import { redirect } from "next/navigation";
export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await RegisterUser(username, displayName, email, password);
      redirect("/timeline");
    } catch (err: any) {
      setError(err.message);
      console.error("登録エラー:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl"
        aria-label="utakata登録フォーム"
      >
        <h2 className="text-2xl font-bold text-purple dark:text-pink mb-4 text-center">
          utakata 登録 💫
        </h2>
        <div className="mb-4">
          <label
            htmlFor="displayName"
            className="block text-gray-700 dark:text-gray-200 font-medium mb-1"
          >
            表示名
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="キラキラな表示名を！"
            required
            className="w-full p-3 border-2 border-purple dark:border-pink rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink dark:focus:ring-purple transition-all duration-200"
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : undefined}
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-gray-700 dark:text-gray-200 font-medium mb-1"
          >
            ユーザー名
          </label>
          <input
            id="name"
            type="text"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="キラキラなユーザー名を！"
            required
            className="w-full p-3 border-2 border-purple dark:border-pink rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink dark:focus:ring-purple transition-all duration-200"
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : undefined}
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-gray-700 dark:text-gray-200 font-medium mb-1"
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレスを入力してね！"
            required
            className="w-full p-3 border-2 border-purple dark:border-pink rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink dark:focus:ring-purple transition-all duration-200"
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : undefined}
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-gray-700 dark:text-gray-200 font-medium mb-1"
          >
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力してね！"
            required
            className="w-full p-3 border-2 border-purple dark:border-pink rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink dark:focus:ring-purple transition-all duration-200"
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : undefined}
          />
        </div>
        {error && (
          <div
            id="register-error"
            className="text-red-500 dark:text-red-400 text-sm mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            aria-live="polite"
          >
            <p className="font-medium">エラーが発生したよ！💦</p>
            <p className="mt-1">{error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading || !email || !password || !username || !displayName}
          className={`w-full p-3 rounded-lg text-white font-semibold transition-all duration-200 ${
            isLoading || !email || !password || !username || !displayName
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-pink dark:bg-purple hover:bg-purple dark:hover:bg-pink hover:scale-105 active:scale-95"
          }`}
        >
          {isLoading ? "登録中..." : "登録！💫"}
        </button>
      </form>
    </div>
  );
}