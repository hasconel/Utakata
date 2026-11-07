"use client"
import { useState } from "react";
import { changeEmail } from "@/lib/appwrite/auth";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

export default function EmailPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const handleChangeEmail = async () => {
        setIsLoading(true);
        const result = await changeEmail(email, password).catch(() => ({ ok: false as const, error: "通信に失敗したわ！💦" }));
        setIsLoading(false);
        if (result.ok) {
            showToast("メールアドレスを変更したわ！🫧", "success");
            setPassword("");
        } else {
            showToast(result.error);
        }
    }
    return (
        <div className="m-5 justify-center  items-center flex flex-col max-w-md mx-auto">
            <h1 className="text-2xl font-bold">メールアドレスの変更</h1>
            <input type="email" autoComplete="email" placeholder="新しいメールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} className="m-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
            <input type="password" autoComplete="current-password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} className="m-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
            <Button onClick={handleChangeEmail} isLoading={isLoading} disabled={!email || !password} className="m-4">メールアドレスを変更</Button>
        </div>
    )
}