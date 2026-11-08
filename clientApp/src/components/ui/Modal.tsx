"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { lockScroll } from "@/lib/scrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  /** 読み上げ用の名前 */
  label?: string;
  /** 画面いっぱいに中身を置く（画像の拡大表示用）。空いているところを押すと閉じる */
  fullscreen?: boolean;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * モーダル🫧
 * Esc で閉じる・開いているあいだは後ろをスクロールさせない・Tab はモーダルの中だけを回る・
 * 閉じたら開く前の場所にフォーカスを戻す。重なったときは、いちばん上のモーダルだけが Esc に反応する。
 */
const stack: symbol[] = [];

export default function Modal({ isOpen, onClose, children, className = "", showCloseButton = true, label, fullscreen = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // body の直下に出す（すりガラスのカードの中に置くと、カードの枠に閉じ込められてしまうため）
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || !mounted) return;
    const id = Symbol("modal");
    stack.push(id);
    const release = lockScroll();
    const previous = document.activeElement as HTMLElement | null;
    // 最初の操作できる場所（無ければパネル）にフォーカスする
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>("[autofocus]") ?? panel)?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === "Tab" && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (items.length === 0) return e.preventDefault();
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      stack.splice(stack.indexOf(id), 1);
      release();
      previous?.focus?.({ preventScroll: true });
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;
  if (fullscreen) {
    return createPortal(
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={onClose}
        className={cn("fixed inset-0 z-[10000] bg-black/85 outline-none animate-in fade-in duration-150", className)}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="閉じる"
            title="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>,
      document.body
    );
  }
  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="fixed inset-0 bg-black/40 animate-in fade-in duration-150" onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className={cn(
            "pointer-events-auto relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-t-2xl bg-card text-card-foreground shadow-float outline-none animate-in fade-in slide-in-from-bottom-4 duration-200 sm:rounded-2xl",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="閉じる"
              title="閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
