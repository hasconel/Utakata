"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        // ログイン状態を画面全体で読み直したいので、再読み込みで移動する
        window.location.href = "/timeline";
        return;
      }
      const data = await response.json().catch(() => null);
      setError(data?.error || "ログインに失敗したわ！💦 もう一度試してみてね");
    } catch {
      setError("通信に失敗したわ！💦 ネットにつながってるか確認してね");
    }
    setIsLoading(false);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label="ログインフォーム">
        <div>
          <label htmlFor="email" className={labelClass}>メールアドレス</label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            aria-invalid={!!error}
            aria-describedby={error ? "login-error" : undefined}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>パスワード</label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-invalid={!!error}
            aria-describedby={error ? "login-error" : undefined}
          />
        </div>
        {error && (
          <p id="login-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" isLoading={isLoading} disabled={!email || !password}>
          ログイン
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          はじめて？{" "}
          <Link href="/register" className="link font-medium">
            アカウントを作る
          </Link>
        </p>
      </form>
    </Card>
  );
}
