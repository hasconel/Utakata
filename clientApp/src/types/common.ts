/**
 * 共通の型定義！✨
 * 共通のデータ構造をキラキラに定義するよ！💖
 */

// 基本的なエンティティの型！✨
export interface BaseEntity {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
}

// ページネーションの型！✨
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// ページネーションの結果の型！✨
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
} 