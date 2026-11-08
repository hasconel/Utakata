"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, Headphones, KeyRound, LogOut, Mail, Palette, Radio, Trash2, UserRound, VolumeX } from "lucide-react";
import { SettingsRow } from "@/components/features/settings/SettingsRow";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { useAuth } from "@/hooks/auth/useAuth";

/** 設定🫧 項目はアイコンと短い名前だけ */
const experimental = (
  <span role="img" aria-label="実験中" title="実験中">
    <FlaskConical className="h-4 w-4 text-muted-foreground" />
  </span>
);

export default function SettingsPage() {
  const { logout } = useAuth();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <section className={`${FEED_SURFACE} divide-y divide-border`}>
        <SettingsRow href="/settings/profile" icon={UserRound} label="プロフィール" />
        <SettingsRow href="/settings/mutes" icon={VolumeX} label="ミュート" />
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Palette className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-[15px] text-foreground">テーマ</span>
          <ThemeSwitch />
        </div>
      </section>

      {/* 実験中の機能 */}
      <section className={`${FEED_SURFACE} divide-y divide-border`}>
        <SettingsRow href="/radio/broadcaster" icon={Radio} label="ラジオを流す" trailing={experimental} />
        <SettingsRow href="/radio/listener" icon={Headphones} label="ラジオを聞く" trailing={experimental} />
      </section>

      <section className={`${FEED_SURFACE} divide-y divide-border`}>
        <SettingsRow href="/settings/email" icon={Mail} label="メールアドレス" />
        <SettingsRow href="/settings/password" icon={KeyRound} label="パスワード" />
        <SettingsRow onClick={() => setIsLogoutOpen(true)} icon={LogOut} label="ログアウト" />
      </section>

      <section className={FEED_SURFACE}>
        <SettingsRow href="/settings/delete" icon={Trash2} label="アカウントの削除" destructive />
      </section>

      {/* ログイン中はフッターを出さないので、規約へのリンクはここに置く */}
      <nav aria-label="規約" className="glass-chip mx-auto flex justify-center gap-4 rounded-full px-4 py-2 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground">利用規約</Link>
        <Link href="/privacy" className="hover:text-foreground">プライバシーポリシー</Link>
      </nav>

      <ConfirmDialog
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={async () => {
          setIsLoggingOut(true);
          await logout();
        }}
        isLoading={isLoggingOut}
        title="ログアウトする？"
        confirmLabel="ログアウト"
        destructive={false}
      />
    </div>
  );
}
