"use client";

/**
 * ログイン状態を画面全体で共有するよ！🫧
 * 以前はヘッダー・画面本体・部品がそれぞれログイン状態を問い合わせていて、
 * サーバーアクションは1つずつ順番に処理されるので、そのぶん表示が遅くなっていた。
 * いまは layout.tsx でページを開いたときに /api/me を1回だけ呼んで、useAuth() で配る。
 * 未読の通知の数と背景画像も、同じ1回でもらう。
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Models } from "appwrite";
import { NOTIFICATIONS_READ_EVENT } from "@/lib/events";

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
  /** 未読の通知の数 */
  unread: number;
  /** 自分の背景画像（無ければ空） */
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const lastFetchedRef = useRef(0);

  const refresh = useCallback(async () => {
    lastFetchedRef.current = Date.now();
    try {
      setError(null);
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const me = await res.json();
      setUser(me.user as User | null);
      setUnread(me.unread ?? 0);
      setBackgroundUrl(me.backgroundUrl ?? "");
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

  // 画面に戻ってきたら未読の数を数え直す（行き来するたびに問い合わせないよう、30秒はあける）
  useEffect(() => {
    if (!user) return;
    const onFocus = () => Date.now() - lastFetchedRef.current >= 30_000 && refresh();
    const onRead = () => setUnread(0);
    window.addEventListener("focus", onFocus);
    window.addEventListener(NOTIFICATIONS_READ_EVENT, onRead);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, onRead);
    };
  }, [user, refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    // 画面に残っているデータごと捨てたいので、再読み込みで移動する
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, error, isAuthenticated: !!user, refresh, logout, unread, backgroundUrl, setBackgroundUrl }),
    [user, isLoading, error, refresh, logout, unread, backgroundUrl]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth は AuthProvider の中で使ってね");
  return context;
}
