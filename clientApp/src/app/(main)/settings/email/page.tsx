"use client";

import { useState } from "react";
import { changeEmail } from "@/lib/appwrite/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { showToast } from "@/components/ui/Toast";

export default function EmailPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await changeEmail(email, password).catch(() => ({ ok: false as const, error: "通信に失敗したわ！💦" }));
    setIsLoading(false);
    if (result.ok) {
      showToast("メールアドレスを変更したわ！🫧", "success");
      setPassword("");
    } else {
      showToast(result.error);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <PageHeader backHref="/settings" title="メールアドレス" />
      <form onSubmit={handleSubmit} className={`${FEED_SURFACE} flex flex-col gap-4 p-4`}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-muted-foreground">新しいメールアドレス</label>
          <Input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-muted-foreground">いまのパスワード</label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" isLoading={isLoading} disabled={!email || !password} className="self-end">
          変更
        </Button>
      </form>
    </div>
  );
}
