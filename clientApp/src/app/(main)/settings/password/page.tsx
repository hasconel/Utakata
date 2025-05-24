"use client"
import { useState } from "react";
import { changePassword } from "@/lib/appwrite/auth";
import { Button } from "@/components/ui/Button";

export default function PasswordPage() {
    const [password, setPassword] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const handleChangePassword = async () => {
        await changePassword(password, oldPassword);
    }
    return (
        <div className="m-5 justify-center  items-center flex flex-col max-w-md mx-auto">
            <h1 className="text-2xl font-bold">パスワードの変更</h1>
            <input type="password" placeholder="新しいパスワード" value={password} onChange={(e) => setPassword(e.target.value)} className="m-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
            <input type="password" placeholder="古いパスワード" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="m-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
            <Button onClick={handleChangePassword} className="m-4">パスワードを変更</Button>
        </div>
    )
}