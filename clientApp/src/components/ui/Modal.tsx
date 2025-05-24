"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

/**
 * モーダルウィンドウコンポーネント！✨
 * キラキラなモーダルを表示するよ！💖
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
}: ModalProps) {
  // ESCキーでモーダルを閉じるよ！✨
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // スクロールを無効にするよ！✨
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "var(--scrollbar-width)";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // スクロールを有効にするよ！✨
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* オーバーレイ！✨ */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル本体！✨ */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center">
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl hover:text-pink-500 transition-all duration-200 hover:scale-110 hover:rotate-90"
              aria-label="閉じる"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}