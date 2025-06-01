"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { signOut } from "@/lib/appwrite/auth";

/**
 * ログアウトボタンコンポーネント！✨
 * ログアウト確認モーダルを表示するよ！💖
 */
export default function LogoutButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("ログアウトに失敗したよ！💦", error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className=" rounded-lg hover:bg-gray-200 transition-colors w-full dark:text-gray-300 dark:hover:text-gray-100 dark:bg-gray-800 bg-gray-100 p-2 hover:scale-105 transition-all duration-200"
      >
        ログアウト
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="text-center my-8 mx-4 p-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            ログアウトする？💫
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            また会えるのを楽しみにしてるね！✨
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}