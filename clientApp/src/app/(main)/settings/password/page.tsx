"use client";

import { useState } from "react";
import { changePassword } from "@/lib/appwrite/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { showToast } from "@/components/ui/Toast";

export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await changePassword(password, oldPassword).catch(() => ({ ok: false as const, error: "通信に失敗したわ！💦" }));
    setIsLoading(false);
    if (result.ok) {
      showToast("パスワードを変更したわ！🫧", "success");
      setPassword("");
      setOldPassword("");
    } else {
      showToast(result.error);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <PageHeader backHref="/settings" title="パスワード" />
      <form onSubmit={handleSubmit} className={`${FEED_SURFACE} flex flex-col gap-4 p-4`}>
        <div>
          <label htmlFor="old-password" className="mb-1.5 block text-sm font-medium text-muted-foreground">いまのパスワード</label>
          <Input id="old-password" type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-muted-foreground">新しいパスワード（8文字以上）</label>
          <Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" isLoading={isLoading} disabled={!password || !oldPassword} className="self-end">
          変更
        </Button>
      </form>
    </div>
  );
}
