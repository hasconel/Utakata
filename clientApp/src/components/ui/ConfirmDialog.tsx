"use client";

import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

/**
 * 「本当にする？」の確認。取り消せない操作（削除・ミュートなど）の前だけに使う。
 * 文は title の一言だけにして、説明は必要なときだけ description に書く。
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  isLoading = false,
  destructive = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  isLoading?: boolean;
  destructive?: boolean;
}) {
  return (
    <Dialog isOpen={isOpen} onClose={() => !isLoading && onClose()} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          やめる
        </Button>
        <Button variant={destructive ? "destructive" : "primary"} size="sm" onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
