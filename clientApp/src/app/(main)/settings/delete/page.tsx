"use client"
import { useState } from "react";
import { deleteAccount } from "@/lib/appwrite/auth";
import Modal from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

export default function DeletePage() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const handleOpen = () => {
        setIsOpen(!isOpen);
    }
    const handleDeleteAccount = async () => {
        setIsLoading(true);
        const result = await deleteAccount().catch(() => ({ ok: false as const, error: "通信に失敗したわ！💦" }));
        if (result.ok) {
            // 以前は削除後もこの画面に残っていた
            window.location.href = "/";
            return;
        }
        setIsLoading(false);
        showToast(result.error);
    }
    return (
        <div className="m-5 justify-center items-center">
            <h1 className="text-2xl font-bold">アカウントの削除</h1>
            <div className="flex flex-col items-center gap-4">
                <Button onClick={handleOpen}>アカウントを削除</Button>
            </div>
            {isOpen && (
                <Modal isOpen={isOpen} onClose={handleOpen}>
                    <div className="my-8 mx-4 p-4">
                        <h2>アカウントを削除しますか？</h2>
                        <Button variant="destructive" onClick={handleDeleteAccount} isLoading={isLoading}>削除</Button>
                    </div>
                    {isLoading && <><Loader2 className="animate-spin" />今までの投稿をすべて削除してアカウントを削除しています</>}
                </Modal>
            )}
        </div>
    )
}