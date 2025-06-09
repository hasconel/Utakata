"use client";
import RegisterForm from "@/components/features/auth/RegisterForm";
import { useAuth } from "@/hooks/auth/useAuth";
export default function RegisterPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  if (user && !isAuthLoading) {
    window.location.href = "/timeline";
  }
  // ユーザー登録ページの表示

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