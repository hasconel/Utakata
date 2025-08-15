"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useState } from "react";
import { Theme } from "@/types/app";

/**
 * テーマ切り替えボタン！✨
 * 明るいテーマ、暗いテーマ、システムテーマを切り替えられるよ！💖
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: "light", label: "ライト", icon: Sun },
    { value: "dark", label: "ダーク", icon: Moon },
    { value: "system", label: "システム", icon: Monitor },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  const handleThemeChange = (newTheme: Theme) => {
    //console.log("テーマを変更します:", { from: theme, to: newTheme });
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 hover:bg-purple-100 dark:hover:bg-pink-900/50 transition-colors duration-200"
        aria-label="テーマを切り替える"
        title={`現在のテーマ: ${currentTheme.label}`}
      >
        <CurrentIcon className="h-5 w-5 text-purple-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            return (
              <button
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-purple-50 dark:hover:bg-pink-900/50 transition-colors duration-200 ${
                  theme === themeOption.value
                    ? "bg-purple-100 dark:bg-pink-900/50 text-purple-600"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{themeOption.label}</span>
                {theme === themeOption.value && (
                  <span className="ml-auto text-xs text-purple-600">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* オーバーレイでドロップダウンを閉じる */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 