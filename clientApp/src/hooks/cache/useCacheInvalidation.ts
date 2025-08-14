"use client";

import { useCallback, useRef, useEffect } from 'react';

// キャッシュ無効化ルールの型定義
interface InvalidationRule {
  pattern: string; // URLパターン（正規表現またはワイルドカード）
  strategy: 'immediate' | 'delayed' | 'conditional';
  delay?: number; // 遅延時間（ミリ秒）
  condition?: (url: string, data: any) => boolean; // 条件関数
  priority: 'high' | 'medium' | 'low';
}

// 無効化イベントの型定義
interface InvalidationEvent {
  id: string;
  url: string;
  rule: InvalidationRule;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// デフォルトルール
const DEFAULT_RULES: InvalidationRule[] = [
  {
    pattern: '/api/posts/*',
    strategy: 'delayed',
    delay: 5000, // 5秒後に無効化
    priority: 'high',
  },
  {
    pattern: '/api/users/*',
    strategy: 'conditional',
    condition: (url, data) => data?.updatedAt > Date.now() - 300000, // 5分以内の更新
    priority: 'medium',
  },
  {
    pattern: '/api/search/*',
    strategy: 'immediate',
    priority: 'low',
  },
];

// キャッシュ無効化フック
export function useCacheInvalidation(
  cache: { remove: (key: string) => void; clear: () => void },
  rules: InvalidationRule[] = DEFAULT_RULES
) {
  const eventsRef = useRef<Map<string, InvalidationEvent>>(new Map());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // URLパターンマッチング
  const matchesPattern = useCallback((url: string, pattern: string): boolean => {
    if (pattern.includes('*')) {
      // ワイルドカードパターン
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      return new RegExp(`^${regexPattern}$`).test(url);
    }
    
    // 正規表現パターン
    try {
      return new RegExp(pattern).test(url);
    } catch {
      return url === pattern;
    }
  }, []);

  // 適用可能なルールを検索
  const findMatchingRules = useCallback((url: string): InvalidationRule[] => {
    return rules.filter(rule => matchesPattern(url, rule.pattern));
  }, [rules, matchesPattern]);

  // 即座にキャッシュを無効化
  const invalidateImmediate = useCallback((url: string) => {
    const matchingRules = findMatchingRules(url);
    
    for (const rule of matchingRules) {
      if (rule.strategy === 'immediate') {
        cache.remove(url);
        console.log(`Cache invalidated immediately: ${url}`);
        
        // イベントを記録
        const eventId = `invalidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const event: InvalidationEvent = {
          id: eventId,
          url,
          rule,
          timestamp: Date.now(),
          status: 'completed',
        };
        eventsRef.current.set(eventId, event);
      }
    }
  }, [findMatchingRules, cache]);

  // 遅延してキャッシュを無効化
  const invalidateDelayed = useCallback((url: string, delay: number) => {
    const eventId = `invalidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const matchingRules = findMatchingRules(url);
    
    for (const rule of matchingRules) {
      if (rule.strategy === 'delayed') {
        const event: InvalidationEvent = {
          id: eventId,
          url,
          rule,
          timestamp: Date.now(),
          status: 'pending',
        };
        eventsRef.current.set(eventId, event);

        // 遅延タイマーを設定
        const timer = setTimeout(() => {
          cache.remove(url);
          event.status = 'completed';
          console.log(`Cache invalidated after delay: ${url}`);
          
          // 完了したイベントを一定時間後に削除
          setTimeout(() => {
            eventsRef.current.delete(eventId);
          }, 60000); // 1分後に削除
        }, delay);

        timersRef.current.set(eventId, timer);
      }
    }
  }, [findMatchingRules, cache]);

  // 条件付きでキャッシュを無効化
  const invalidateConditional = useCallback((url: string, data: any) => {
    const matchingRules = findMatchingRules(url);
    
    for (const rule of matchingRules) {
      if (rule.strategy === 'conditional' && rule.condition) {
        if (rule.condition(url, data)) {
          cache.remove(url);
          console.log(`Cache invalidated conditionally: ${url}`);
          
          // イベントを記録
          const eventId = `invalidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const event: InvalidationEvent = {
            id: eventId,
            url,
            rule,
            timestamp: Date.now(),
            status: 'completed',
          };
          eventsRef.current.set(eventId, event);
        }
      }
    }
  }, [findMatchingRules, cache]);

  // パターンベースでキャッシュを無効化
  const invalidateByPattern = useCallback((pattern: string) => {
    // パターンにマッチするすべてのURLを無効化
    // 注意: この実装では全キャッシュをクリアする必要がある場合がある
    console.log(`Invalidating cache by pattern: ${pattern}`);
    
    // より高度な実装では、キャッシュキーのパターンマッチングが必要
    // 現在は全クリアで対応
    cache.clear();
  }, [cache]);

  // 特定のURLのキャッシュを無効化
  const invalidateURL = useCallback((url: string, data?: any) => {
    const matchingRules = findMatchingRules(url);
    
    for (const rule of matchingRules) {
      switch (rule.strategy) {
        case 'immediate':
          invalidateImmediate(url);
          break;
        case 'delayed':
          invalidateDelayed(url, rule.delay || 5000);
          break;
        case 'conditional':
          if (data) {
            invalidateConditional(url, data);
          }
          break;
      }
    }
  }, [findMatchingRules, invalidateImmediate, invalidateDelayed, invalidateConditional]);

  // 複数のURLを一括で無効化
  const invalidateMultiple = useCallback((urls: string[], data?: any) => {
    urls.forEach(url => invalidateURL(url, data));
  }, [invalidateURL]);

  // 無効化をキャンセル
  const cancelInvalidation = useCallback((url: string) => {
    // 該当するタイマーを検索してキャンセル
    for (const [eventId, event] of eventsRef.current.entries()) {
      if (event.url === url && event.status === 'pending') {
        const timer = timersRef.current.get(eventId);
        if (timer) {
          clearTimeout(timer);
          timersRef.current.delete(eventId);
        }
        eventsRef.current.delete(eventId);
        console.log(`Invalidation cancelled: ${url}`);
        break;
      }
    }
  }, []);

  // 無効化の状態を取得
  const getInvalidationStatus = useCallback((url: string) => {
    for (const event of eventsRef.current.values()) {
      if (event.url === url) {
        return event.status;
      }
    }
    return 'none';
  }, []);

  // 無効化統計を取得
  const getInvalidationStats = useCallback(() => {
    const stats = {
      totalEvents: eventsRef.current.size,
      pendingEvents: 0,
      processingEvents: 0,
      completedEvents: 0,
      failedEvents: 0,
      activeTimers: timersRef.current.size,
    };

    for (const event of eventsRef.current.values()) {
      switch (event.status) {
        case 'pending':
          stats.pendingEvents++;
          break;
        case 'processing':
          stats.processingEvents++;
          break;
        case 'completed':
          stats.completedEvents++;
          break;
        case 'failed':
          stats.failedEvents++;
          break;
      }
    }

    return stats;
  }, []);

  // 無効化をクリア
  const clearInvalidation = useCallback(() => {
    // タイマーをクリア
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();

    // イベントをクリア
    eventsRef.current.clear();
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      clearInvalidation();
    };
  }, [clearInvalidation]);

  return {
    // 無効化実行
    invalidateURL,
    invalidateMultiple,
    invalidateByPattern,
    
    // キャンセル
    cancelInvalidation,
    
    // 状態確認
    getStatus: getInvalidationStatus,
    getStats: getInvalidationStats,
    
    // 管理
    clear: clearInvalidation,
    
    // 設定
    rules,
  };
}
