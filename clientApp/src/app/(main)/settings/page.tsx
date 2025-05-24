import Link from "next/link";
import  LogoutButton  from "@/components/features/auth/LogoutButton";

export default function SettingsPage() {
    return (
        <div className="m-5 justify-center items-center mx-auto max-w-md">
            <h1 className="text-2xl font-bold">設定</h1>
            <div className="flex flex-col items-center gap-4">
                <div className="w-full text-center hover:cursor-pointer hover:bg-gray-200 hover:bg-gray-200 dark:text-gray-300 dark:hover:text-gray-100 dark:bg-gray-800 bg-gray-100 rounded-md p-2 hover:scale-105 transition-all duration-200"><Link href="/settings/profile"><h2>プロフィール</h2></Link></div>
                <div className="w-full text-center hover:cursor-pointer hover:bg-gray-200 dark:text-gray-300 dark:hover:text-gray-100 dark:bg-gray-800 bg-gray-100 rounded-md p-2 hover:scale-105 transition-all duration-200"><Link href="/settings/mutes"><h2>ミュートユーザーの設定</h2></Link></div>
                <div className="w-full text-center hover:cursor-pointer hover:bg-gray-200 dark:text-gray-300 dark:hover:text-gray-100 dark:bg-gray-800 bg-gray-100 rounded-md p-2 hover:scale-105 transition-all duration-200"><Link href="/settings/email"><h2>メールアドレスの変更</h2></Link></div>
                <div className="w-full text-center hover:cursor-pointer hover:bg-gray-200 dark:text-gray-300 dark:hover:text-gray-100 dark:bg-gray-800 bg-gray-100 rounded-md p-2 hover:scale-105 transition-all duration-200"><Link href="/settings/password"><h2>パスワードの変更</h2></Link></div>
                <LogoutButton />
                <div className="w-full text-center hover:cursor-pointer hover:bg-gray-200 dark:text-gray-300 dark:hover:text-gray-100 dark:bg-gray-800 bg-gray-100 rounded-md p-2 hover:scale-105 transition-all duration-200"><Link href="/settings/delete"><h2>☠アカウントの削除☠</h2></Link></div>
            </div>
        </div>
    )
}
