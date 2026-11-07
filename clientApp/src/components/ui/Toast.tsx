"use client";

/**
 * 画面の下にちょこっと出るお知らせ！✨
 * どこからでも showToast("メッセージ") で出せるよ。表示役の <Toaster /> はレイアウトに1つだけ置く。
 */
import { useEffect, useState } from "react";

type ToastType = "error" | "success";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const EVENT_NAME = "utakata:toast";
const DURATION_MS = 3500;
let nextId = 0;

export function showToast(message: string, type: ToastType = "error") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENT_NAME, { detail: { id: nextId++, message, type } }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const toast = (event as CustomEvent<ToastItem>).detail;
      setToasts((prev) => [...prev.slice(-2), toast]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), DURATION_MS);
    };
    window.addEventListener(EVENT_NAME, onToast);
    return () => window.removeEventListener(EVENT_NAME, onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          className={`pointer-events-auto max-w-sm rounded-full px-4 py-2 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === "error"
              ? "bg-pink-600 text-white dark:bg-pink-500"
              : "bg-purple-600 text-white dark:bg-purple-500"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
