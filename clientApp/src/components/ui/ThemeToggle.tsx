"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * テーマ切り替えボタン！🫧
 * 明るいテーマ、暗いテーマ、システムテーマを切り替えられるよ！
 * テーマは layout.tsx の next-themes が管理していて、<html> に dark クラスを付け外しする。
 */
const THEMES = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
  { value: "system", label: "システム", icon: Monitor },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  // 保存されたテーマはブラウザでしか分からないので、表示はマウント後に合わせる
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = (mounted && THEMES.find((t) => t.value === theme)) || THEMES[2];
  const CurrentIcon = current.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="テーマを切り替える"
        aria-expanded={isOpen}
        title={`いまのテーマ: ${current.label}`}
      >
        <CurrentIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* 外側を押したら閉じる */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-float">
            {THEMES.map(({ value, label, icon: Icon }) => {
              const selected = mounted && theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTheme(value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    selected ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {selected && <span className="ml-auto text-xs text-primary">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
