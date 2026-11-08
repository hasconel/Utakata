"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { mediaUrl } from "@/lib/utils";

/**
 * 画面の背景🫧（昔のTwitterみたいに、プロフィールの画像を画面いっぱいに敷く）
 *   ・ふだんは自分の画像
 *   ・ユーザーページではその人の画像（useBackdrop で差し替える）
 * 背景があるときは <html data-backdrop> を付け、カードをすりガラスにする（globals.css）。
 */
type Override = string | null | undefined; // undefined: 自分の画像 / null: 背景なし / string: その画像

const BackdropContext = createContext<{
  setOwn: (url: string) => void;
  setOverride: (url: Override) => void;
}>({ setOwn: () => {}, setOverride: () => {} });

export function BackdropProvider({ children }: { children: React.ReactNode }) {
  // 自分の背景画像は /api/me（AuthProvider）でもらっている
  const { user, backgroundUrl: own, setBackgroundUrl } = useAuth();
  const [override, setOverride] = useState<Override>(undefined);
  const [shown, setShown] = useState(""); // 読み込み終わった画像だけ出す

  const raw = override === undefined ? (user ? own : "") : override || "";
  // 背景は画面の幅までに縮めた画像（元の写真は大きいことが多い）
  const url = mediaUrl(raw, 1920);

  useEffect(() => {
    if (!url) {
      setShown("");
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => !cancelled && setShown(url);
    img.onerror = () => !cancelled && setShown("");
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const root = document.documentElement;
    if (shown) root.setAttribute("data-backdrop", "");
    else root.removeAttribute("data-backdrop");
  }, [shown]);

  const setOwn = useCallback((next: string) => setBackgroundUrl(next), [setBackgroundUrl]);

  return (
    <BackdropContext.Provider value={{ setOwn, setOverride }}>
      {shown && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${shown}")` }} />
          {/* 文字が読めるように、うすく画面の色を重ねる */}
          <div className="absolute inset-0 bg-background/35" />
        </div>
      )}
      {children}
    </BackdropContext.Provider>
  );
}

/** このページのあいだだけ背景を差し替える（null で背景なし）。離れると自分の画像に戻る */
export function useBackdrop(url: Override) {
  const { setOverride } = useContext(BackdropContext);
  useEffect(() => {
    setOverride(url);
  }, [url, setOverride]);
  useEffect(() => () => setOverride(undefined), [setOverride]);
}

/** 自分の背景が変わったとき（プロフィールを保存したあと） */
export const useSetOwnBackdrop = () => useContext(BackdropContext).setOwn;
