"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";

/**
 * テーマ切り替えボタン！✨
 * 明るいテーマと暗いテーマを切り替えられるよ！💖
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full p-2 hover:bg-purple-100 dark:hover:bg-pink-900/50 transition-colors duration-200"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-200 text-purple-600 dark:scale-0 dark:-rotate-90 dark:scale-0" />
      <Moon className="h-5 w-5 rotate-90 scale-0 transition-all duration-200 text-purple-600 dark:scale-100 dark:rotate-0 " />
      <span className="sr-only">テーマを切り替える</span>
    </button>
  );
} 