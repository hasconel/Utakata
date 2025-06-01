/**
 * 通知の型定義！✨
 * 通知のデータ構造をキラキラに定義するよ！💖
 */

// 通知の種類！✨
export type NotificationType = 'like' | 'follow' | 'reply' | 'mention';

// 基本的な通知の型！✨
export interface BaseNotification {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  read: boolean;
}

// 通知の詳細な型！✨
export interface Notification extends BaseNotification {
  type: NotificationType;
  from: string; // アクターID
  to: string; // アクターID
  target: string; // 投稿ID
  message?: string; // メッセージ
} 