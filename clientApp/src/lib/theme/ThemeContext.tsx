"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Theme } from "@/types/app";
import { Models } from "appwrite";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  user: Models.User<Models.Preferences> | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// デバッグ用: 開発者ツールのコンソールで実行可能
if (typeof window !== 'undefined') {
  (window as any).clearThemeStorage = () => {
    localStorage.removeItem("theme");
    console.log("テーマストレージをクリアしました");
    window.location.reload();
  };
  
  (window as any).getThemeStorage = () => {
    const theme = localStorage.getItem("theme");
    console.log("現在のテーマストレージ:", theme);
    return theme;
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 初期値を"light"に設定し、クライアントサイドでlocalStorageから読み込む
  const [theme, setTheme] = useState<Theme>("light");
  const [user, setUser] = useState<Models.User<Models.Preferences> | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでの初期化
  useEffect(() => {
    setMounted(true);
    
    try {
      // localStorageからテーマを読み込み
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      //console.log("保存されたテーマ:", savedTheme);
      
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        //console.log("保存されたテーマを設定:", savedTheme);
        setTheme(savedTheme);
      } else {
        // 初回アクセス時はシステムテーマをデフォルトに設定
        //console.log("初回アクセス: システムテーマを設定");
        setTheme("system");
      }
    } catch (error) {
      console.error("テーマの初期化に失敗しました:", error);
      setTheme("light");
    }
  }, []);

  // システムテーマの変更を監視
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        //console.log("システムテーマが変更されました:", e.matches ? "dark" : "light");
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.toggle("dark", e.matches);
        root.classList.toggle("light", !e.matches);
      };

      // 初期設定
      const prefersDark = mediaQuery.matches;
      //console.log("システムテーマの初期設定:", prefersDark ? "dark" : "light");
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.toggle("dark", prefersDark);
      root.classList.toggle("light", !prefersDark);

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } catch (error) {
      console.error("システムテーマの監視に失敗しました:", error);
    }
    return () => {};
  }, [theme, mounted]);

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
    if (!mounted) return;

    try {
      const root = document.documentElement;
      
      // 既存のクラスをクリア
      root.classList.remove("light", "dark");
      
      if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        //console.log("システムテーマを適用:", prefersDark ? "dark" : "light");
        root.classList.toggle("dark", prefersDark);
        root.classList.toggle("light", !prefersDark);
      } else {
        //console.log("テーマを適用:", theme);
        root.classList.toggle("dark", theme === "dark");
        root.classList.toggle("light", theme === "light");
      }
      
      localStorage.setItem("theme", theme);
      //console.log("テーマをlocalStorageに保存:", theme);
    } catch (error) {
      console.error("テーマの設定に失敗したよ！😭", error);
    }
  }, [theme, mounted]);

  // マウント前はデフォルトのコンテンツを表示（hydrationエラーを防ぐ）
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ user: undefined, theme: "light", setTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

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