import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Megaphone, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/appwrite/auth";

const FEATURES = [
  { icon: Megaphone, title: "瞬間を投稿", text: "500文字以内で、思ったことをパッとシェア！" },
  { icon: Globe, title: "世界とリンク", text: "ActivityPubで他のSNSと繋がる！" },
  { icon: Sparkles, title: "キミの色", text: "プロフィールをカスタマイズして輝こう！" },
];

// ログイン済みならサーバー側でタイムラインへ移動する
export default async function HomePage() {
  if (await getCurrentUser()) redirect("/timeline");

  return (
    <main className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-12 px-4 py-16 text-center">
      <div className="flex max-w-2xl flex-col items-center gap-5">
        <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-6xl">
          utakataで<wbr />キミのキラキラを<wbr />世界に！🌟
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
          短文でサクッと投稿！ActivityPubで世界中のSNSと繋がって、キミの瞬間を自由にシェア！
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className="rounded-full bg-primary px-8 py-3.5 text-lg font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-hover"
        >
          今すぐ始める！
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-border bg-card px-8 py-3.5 text-lg font-semibold text-foreground transition-colors hover:bg-accent"
        >
          ログイン
        </Link>
      </div>

      <ul className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col items-center gap-3 rounded-3xl bg-card p-6 shadow-soft">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Icon aria-hidden className="h-6 w-6" />
            </span>
            <h2 className="font-bold text-foreground">{title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
