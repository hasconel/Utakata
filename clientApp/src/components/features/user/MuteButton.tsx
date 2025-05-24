"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

interface MuteButtonProps {
  userId: string;
  username: string;
  isMuted: boolean;
  onMute: (userId: string) => Promise<void>;
  onUnmute: (userId: string) => Promise<void>;
}

/**
 * ミュートボタンコンポーネント！✨
 * ユーザーをミュート/ミュート解除できるよ！💖
 */
export default function MuteButton({ userId, username, isMuted, onMute, onUnmute }: MuteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleMute = async () => {
    setIsLoading(true);
    try {
      await onMute(userId);
      setIsOpen(false);
    } catch (error) {
      console.error("ミュートに失敗したよ！💦", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnmute = async () => {
    setIsLoading(true);
    try {
      await onUnmute(userId);
    } catch (error) {
      console.error("ミュート解除に失敗したよ！💦", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => isMuted ? handleUnmute() : setIsOpen(true)}
        disabled={isLoading}
        className={`${
          isMuted
            ? "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            : "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <span className="animate-spin mr-2">💫</span>
            処理中...
          </span>
        ) : isMuted ? (
          <span className="flex items-center">
            <span className="mr-2">🔊</span>
            ミュート解除
          </span>
        ) : (
          <span className="flex items-center">
            <span className="mr-2">🔇</span>
            ミュートする
          </span>
        )}
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`@${username} をミュートする？`}
        description="ミュートすると、このユーザーの投稿が表示されなくなるよ！💫"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ミュートしたユーザーの投稿は、あなたのタイムラインに表示されなくなるわ。
            ミュートはいつでも解除できるから安心してね！✨
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleMute}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">💫</span>
                  処理中...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="mr-2">🔇</span>
                  ミュートする
                </span>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
} 