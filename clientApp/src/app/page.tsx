import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/appwrite/auth";

// ログイン済みならサーバー側でタイムラインへ移動する
export default async function HomePage() {
  if (await getCurrentUser()) redirect("/timeline");

  return (
    <main className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <h1 className="max-w-xl text-2xl font-bold leading-snug text-foreground sm:text-3xl">
        投稿は3日半で<wbr />タイムラインから<wbr />見えなくなります。
      </h1>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className="rounded-full bg-primary px-8 py-3.5 text-lg font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-hover"
        >
          はじめる
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-border bg-card px-8 py-3.5 text-lg font-semibold text-foreground transition-colors hover:bg-accent"
        >
          ログイン
        </Link>
      </div>
    </main>
  );
}
