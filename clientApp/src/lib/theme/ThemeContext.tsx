"use client";

import { createContext, useContext, useState, useEffect,  } from "react";
import { Theme } from "@/types/app";
import { Models } from "appwrite";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  user: Models.User<Models.Preferences> | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);


export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 初期値をlocalStorageから取得（クライアントサイドのみ）
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme && savedTheme !== "system") {
        return savedTheme;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light"; // サーバーサイドのデフォルト値
  });
  const [user, setUser] = useState<Models.User<Models.Preferences> | undefined>(undefined);

  // システムテーマの変更を監視
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        const root = document.documentElement;
        root.classList.toggle("dark", e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // ユーザー情報の取得
  useEffect(() => {
    getLoggedInUser()
      .then((user) => {
        setUser(user);
      })
      .catch((err) => {
        console.error("ユーザー情報の取得に失敗したよ！😢", err);
        setUser(undefined);
      });
  }, []);

  // テーマ変更時の処理
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", theme === "dark");
      }
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("テーマの設定に失敗したよ！😭", error);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ user, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}