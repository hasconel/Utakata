/**
 * アプリケーション固有の型定義！✨
 */

/**
 * テーマ型！アプリケーションのテーマ設定を表現！🎨
 */
export type Theme = "light" | "dark" | "system";

/**
 * アラートメッセージ型！ユーザーへの通知を表現！🔔
 */
export interface AlertMessage {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

/**
 * モーダルプロパティ型！モーダルの設定を表現！💫
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeOnOutsideClick?: boolean;
}

/**
 * フォームの状態型！フォームの状態を表現！📋
 */
export interface FormState {
  isLoading: boolean;
  error?: string;
  success?: string;
} 