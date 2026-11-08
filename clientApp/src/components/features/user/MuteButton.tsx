"use client";

import { useState } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface MuteButtonProps {
  userId: string;
  username: string;
  isMuted: boolean;
  onMute: (userId: string) => Promise<void>;
  onUnmute: (userId: string) => Promise<void>;
}

/** ミュートボタン🫧 アイコンだけ。ミュートする前だけ確認する */
export default function MuteButton({ userId, username, isMuted, onMute, onUnmute }: MuteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const label = isMuted ? "ミュート中（押すと解除）" : "ミュートする";
  return (
    <>
      <button
        type="button"
        onClick={() => (isMuted ? run(() => onUnmute(userId)) : setIsOpen(true))}
        disabled={isLoading}
        aria-pressed={isMuted}
        aria-label={label}
        title={label}
        className={`flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-colors disabled:opacity-60 ${
          isMuted ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        {isLoading && !isOpen ? <Loader2 className="h-5 w-5 animate-spin" /> : isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => run(() => onMute(userId))}
        isLoading={isLoading}
        title={`@${username} をミュートする？`}
        description="タイムラインと検索に出なくなるわ。いつでも戻せるよ。"
        confirmLabel="ミュート"
      />
    </>
  );
}
