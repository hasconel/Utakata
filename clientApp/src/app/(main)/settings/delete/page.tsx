"use client"
import { useState } from "react";
import { deleteAccount } from "@/lib/appwrite/auth";
import Modal from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DeletePage() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const handleOpen = () => {
        setIsOpen(!isOpen);
    }
    const handleDeleteAccount = async () => {
        setIsLoading(true);
        await deleteAccount();
        setIsLoading(false);
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
                        <Button onClick={handleDeleteAccount}>削除</Button>
                    </div>
                    {isLoading && <><Loader2 className="animate-spin" />今までの投稿をすべて削除してアカウントを削除しています</>}
                </Modal>
            )}
        </div>
    )
}