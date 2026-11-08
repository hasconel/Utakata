"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "system", label: "端末に合わせる", icon: Monitor },
  { value: "dark", label: "ダーク", icon: Moon },
] as const;

/** テーマの切り替え（アイコン3つを並べたスイッチ） */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? theme : undefined;

  return (
    <div role="radiogroup" aria-label="テーマ" className="inline-flex rounded-full bg-muted p-1">
      {THEMES.map(({ value, label, icon: Icon }) => {
        const selected = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`flex h-8 w-10 items-center justify-center rounded-full transition-colors ${
              selected ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
