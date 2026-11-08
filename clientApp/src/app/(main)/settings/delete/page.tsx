"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/lib/appwrite/auth";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { showToast } from "@/components/ui/Toast";

/** アカウントの削除。取り消せないので、ここだけは何が消えるかを文で書く */
export default function DeletePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deleteAccount().catch(() => ({ ok: false as const, error: "通信に失敗したわ！💦" }));
    if (result.ok) {
      window.location.href = "/";
      return;
    }
    setIsLoading(false);
    showToast(result.error);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <PageHeader backHref="/settings" title="アカウントの削除" />
      <section className={`${FEED_SURFACE} flex flex-col items-center gap-4 p-6 text-center`}>
        <Trash2 aria-hidden className="h-10 w-10 text-destructive opacity-70" strokeWidth={1.5} />
        <p className="text-sm leading-relaxed text-muted-foreground">
          投稿・プロフィール・フォローがすべて消えて、元に戻せないわ。
        </p>
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          削除する
        </Button>
      </section>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        title="本当に削除する？"
        description={isLoading ? "投稿をひとつずつ消しているから、少し待ってね🫧" : undefined}
        confirmLabel="削除"
      />
    </div>
  );
}
