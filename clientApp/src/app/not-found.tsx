import Link from "next/link";
import { Home } from "lucide-react";

/** 見つからないページ。泡がはじけたあとの絵と、ホームへのボタンだけ */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-muted-foreground">
      <div aria-hidden className="relative h-20 w-20">
        <span className="absolute inset-3 rounded-full border-2 border-dashed border-current opacity-40" />
        <span className="absolute right-0 top-1 h-3 w-3 rounded-full border-2 border-current opacity-30" />
        <span className="absolute bottom-1 left-0 h-2 w-2 rounded-full border-2 border-current opacity-25" />
      </div>
      <p className="text-4xl font-semibold tabular-nums text-foreground/70">404</p>
      <Link
        href="/"
        aria-label="ホームへ"
        title="ホームへ"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        <Home className="h-5 w-5" />
      </Link>
    </div>
  );
}
