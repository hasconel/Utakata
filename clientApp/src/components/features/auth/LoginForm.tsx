"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail } from "@/lib/appwrite/auth";

interface LoginFormProps {
  error?: string | string[] | null;
}

export default function LoginForm({ error: initialError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialError) {
      setError(Array.isArray(initialError) ? initialError[0] : initialError);
    }
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await signInWithEmail({email,password});
      session.$id;
      router.push("/timeline");
    } catch (err: any) {
      //console.log(err);
      setError(err.message || "ログインに失敗したよ！もう一度試してみてね！💦");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl"
        aria-label="utakataログインフォーム"
      >
        <h2 className="text-2xl font-bold text-purple dark:text-pink mb-4 text-center">
          utakata ログイン ✨
        </h2>
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
            aria-describedby={error ? "login-error" : undefined}
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
            aria-describedby={error ? "login-error" : undefined}
          />
        </div>
        {error && (
          <p
            id="login-error"
            className="text-red-500 dark:text-red-400 text-sm mb-4"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className={`w-full p-3 rounded-lg text-white font-semibold transition-all duration-200 ${
            isLoading || !email || !password
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-pink dark:bg-purple hover:bg-purple dark:hover:bg-pink hover:scale-105 active:scale-95"
          }`}
        >
          {isLoading ? "ログイン中..." : "ログイン！🚀"}
        </button>
      </form>
  );
}