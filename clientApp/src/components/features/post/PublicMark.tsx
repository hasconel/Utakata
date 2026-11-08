import { Globe } from "lucide-react";

const PUBLIC = "https://www.w3.org/ns/activitystreams#Public";

/** 公開投稿（連合の誰でも見られる）かどうか */
export const isPublicPost = (to?: string[] | null) => !!to?.includes(PUBLIC);

/**
 * アイコンの右下に付ける、公開投稿のしるし🌐
 * 投稿フォームの公開ボタンと同じ地球のマーク。フォロワー限定には何も付けない。
 */
export function PublicMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-5 w-5" : "h-[18px] w-[18px]";
  return (
    <span
      role="img"
      aria-label="公開"
      title="公開"
      className={`pointer-events-none absolute -bottom-0.5 -right-0.5 flex ${box} items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card`}
    >
      <Globe className={size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5"} strokeWidth={2.5} />
    </span>
  );
}
