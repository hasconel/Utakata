import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const rowClass = "flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] transition-colors hover:bg-accent/40";

/** 設定の1行（アイコン + 短い名前 + ＞） */
export function SettingsRow({
  href,
  onClick,
  icon: Icon,
  label,
  destructive = false,
  trailing,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  destructive?: boolean;
  /** 名前の右に添える小さなマーク */
  trailing?: React.ReactNode;
}) {
  const content = (
    <>
      <Icon className={cn("h-5 w-5 shrink-0", destructive ? "text-destructive" : "text-muted-foreground")} />
      <span className={cn("flex-1", destructive ? "text-destructive" : "text-foreground")}>{label}</span>
      {trailing}
      {href && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />}
    </>
  );
  return href ? (
    <Link href={href} className={rowClass}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={rowClass}>
      {content}
    </button>
  );
}
