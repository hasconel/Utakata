"use client";

import { useState } from "react";
import Link from "next/link";
import { RegisterUser } from "@/lib/appwrite/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";
const hintClass = "mt-1 text-xs text-muted-foreground";

export default function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await RegisterUser(username, displayName, email, password);
      // 以前は redirect() を呼んでいたけど、クリック処理の中では例外になって移動できなかった
      window.location.href = result?.loggedIn === false ? "/login" : "/timeline";
      return;
    } catch (err: any) {
      setError(err?.message || "登録に失敗したわ！💦 もう一度試してみてね");
    }
    setIsLoading(false);
  };

  const describedBy = error ? "register-error" : undefined;
  const filled = displayName && username && email && password;

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label="新規登録フォーム">
        <div>
          <label htmlFor="displayName" className={labelClass}>表示名</label>
          <Input
            id="displayName"
            type="text"
            autoComplete="nickname"
            maxLength={100}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="うたかた ちゃん"
            required
            aria-describedby={describedBy}
          />
          <p className={hintClass}>日本語や絵文字もOK。あとから変えられるよ</p>
        </div>
        <div>
          <label htmlFor="name" className={labelClass}>ユーザー名</label>
          <Input
            id="name"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z]{3,20}"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="utakata"
            required
            aria-describedby={describedBy}
          />
          <p className={hintClass}>アルファベット3〜20文字。小文字にそろえて登録するよ（あとから変えられないの）</p>
        </div>
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
            aria-describedby={describedBy}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>パスワード</label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-describedby={describedBy}
          />
          <p className={hintClass}>8文字以上</p>
        </div>
        {error && (
          <p id="register-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" isLoading={isLoading} disabled={!filled}>
          登録する
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          アカウントを持ってる？{" "}
          <Link href="/login" className="link font-medium">
            ログイン
          </Link>
        </p>
      </form>
    </Card>
  );
}
