"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * テーマプロバイダー！✨
 * ダークモードとかをキラキラに管理するよ！💖
 */
export function ThemeProvider({ children, ...props }: any) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
} 