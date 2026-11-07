"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

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
        className="fixed inset-0 bg-black/40 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* モーダル本体！✨ */}
      <div className="pointer-events-none fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-4">
        <div
          className={cn("pointer-events-auto relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-t-2xl bg-card text-card-foreground shadow-float animate-in fade-in slide-in-from-bottom-4 duration-200 sm:rounded-2xl", className)}
          onClick={(e) => e.stopPropagation()}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}