"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // 通知APIのサポート確認
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      //console.log('Notifications not supported');
      return;
    }

    try {
      // ユーザーアクション（ボタンクリック）に基づいて許可要求
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        //console.log('Notification permission granted!');
        // ここでプッシュ通知の購読処理を実装可能
      } else if (result === 'denied') {
        //console.log('Notification permission denied');
      }
    } catch (error) {
      //console.error('Failed to request notification permission:', error);
    }
  };

  // 通知がサポートされていない場合
  if (!isSupported) {
    return null;
  }

  // 既に許可されている場合
  if (permission === 'granted') {
    return (
      <div className="text-sm text-green-600 dark:text-green-400">
        ✅ 通知が有効になっています
      </div>
    );
  }

  // 拒否されている場合
  if (permission === 'denied') {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        ❌ 通知が拒否されています。ブラウザ設定で許可してください。
      </div>
    );
  }

  // 未設定の場合（デフォルト）
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={requestPermission}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        🔔 通知を有効にする
      </Button>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        新しい投稿や通知を受け取れます
      </span>
    </div>
  );
}
