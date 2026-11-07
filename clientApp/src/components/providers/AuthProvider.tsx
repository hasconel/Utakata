"use client";

/**
 * ログイン状態を画面全体で共有するよ！🫧
 * 以前はヘッダー・画面本体・部品がそれぞれログイン状態を問い合わせていて、
 * サーバーアクションは1つずつ順番に処理されるので、そのぶん表示が遅くなっていた。
 * いまは layout.tsx でページを開いたときに1回だけ問い合わせて、useAuth() で配る。
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Models } from "appwrite";
import { getCurrentUser } from "@/lib/appwrite/auth";

type User = Models.User<Models.Preferences>;

interface AuthContextValue {
  user: User | null;
  /** 最初の確認が終わるまで true */
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  /** ログイン状態を問い合わせ直す */
  refresh: () => Promise<void>;
  /** ログアウトしてログイン画面へ移動する */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setUser((await getCurrentUser()) as User | null);
    } catch {
      setError("ログイン状態を確認できなかったわ！💦");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    // 画面に残っているデータごと捨てたいので、再読み込みで移動する
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, error, isAuthenticated: !!user, refresh, logout }),
    [user, isLoading, error, refresh, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth は AuthProvider の中で使ってね");
  return context;
}
