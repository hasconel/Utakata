// パフォーマンス監視の設定

// Core Web Vitalsの閾値
export const CORE_WEB_VITALS_THRESHOLDS = {
  // LCP (Largest Contentful Paint)
  LCP: {
    GOOD: 2500,        // 2.5秒以下
    NEEDS_IMPROVEMENT: 4000,  // 4秒以下
    POOR: 4000         // 4秒超
  },
  
  // FID (First Input Delay)
  FID: {
    GOOD: 100,         // 100ms以下
    NEEDS_IMPROVEMENT: 300,   // 300ms以下
    POOR: 300          // 300ms超
  },
  
  // CLS (Cumulative Layout Shift)
  CLS: {
    GOOD: 0.1,         // 0.1以下
    NEEDS_IMPROVEMENT: 0.25,  // 0.25以下
    POOR: 0.25         // 0.25超
  },
  
  // FCP (First Contentful Paint)
  FCP: {
    GOOD: 1800,        // 1.8秒以下
    NEEDS_IMPROVEMENT: 3000,  // 3秒以下
    POOR: 3000         // 3秒超
  }
};

// TTFB (Time to First Byte)の閾値
export const TTFB_THRESHOLDS = {
  GOOD: 800,           // 800ms以下
  NEEDS_IMPROVEMENT: 1800,    // 1.8秒以下
  POOR: 1800           // 1.8秒超
};

// API応答時間の閾値
export const API_RESPONSE_THRESHOLDS = {
  GOOD: 200,           // 200ms以下
  NEEDS_IMPROVEMENT: 1000,    // 1秒以下
  POOR: 1000           // 1秒超
};

// 画像読み込み時間の閾値
export const IMAGE_LOAD_THRESHOLDS = {
  GOOD: 500,           // 500ms以下
  NEEDS_IMPROVEMENT: 2000,    // 2秒以下
  POOR: 2000           // 2秒超
};

// パフォーマンス監視の設定
export const PERFORMANCE_CONFIG = {
  // メトリクス更新間隔（ミリ秒）
  UPDATE_INTERVAL: 1000,
  
  // 履歴保持件数
  MAX_HISTORY_COUNT: 100,
  
  // エラー保持件数
  MAX_ERROR_COUNT: 50,
  
  // 自動エクスポート間隔（分）
  AUTO_EXPORT_INTERVAL: 5,
  
  // 開発環境でのみ有効にするフラグ
  ENABLE_IN_DEVELOPMENT: true,
  
  // 本番環境でのみ有効にするフラグ
  ENABLE_IN_PRODUCTION: false
};

// パフォーマンススコアの重み付け
export const PERFORMANCE_WEIGHTS = {
  LCP: 0.25,           // 25%
  FID: 0.25,           // 25%
  CLS: 0.25,           // 25%
  FCP: 0.15,           // 15%
  TTFB: 0.10           // 10%
};

// パフォーマンススコアの計算
export function calculateOverallScore(metrics: {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}): number {
  let totalScore = 0;
  let totalWeight = 0;

  // LCPスコア
  if (metrics.lcp !== null) {
    const lcpScore = metrics.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.GOOD ? 100 :
                    metrics.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.NEEDS_IMPROVEMENT ? 50 : 0;
    totalScore += lcpScore * PERFORMANCE_WEIGHTS.LCP;
    totalWeight += PERFORMANCE_WEIGHTS.LCP;
  }

  // FIDスコア
  if (metrics.fid !== null) {
    const fidScore = metrics.fid <= CORE_WEB_VITALS_THRESHOLDS.FID.GOOD ? 100 :
                    metrics.fid <= CORE_WEB_VITALS_THRESHOLDS.FID.NEEDS_IMPROVEMENT ? 50 : 0;
    totalScore += fidScore * PERFORMANCE_WEIGHTS.FID;
    totalWeight += PERFORMANCE_WEIGHTS.FID;
  }

  // CLSスコア
  if (metrics.cls !== null) {
    const clsScore = metrics.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.GOOD ? 100 :
                    metrics.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.NEEDS_IMPROVEMENT ? 50 : 0;
    totalScore += clsScore * PERFORMANCE_WEIGHTS.CLS;
    totalWeight += PERFORMANCE_WEIGHTS.CLS;
  }

  // FCPスコア
  if (metrics.fcp !== null) {
    const fcpScore = metrics.fcp <= CORE_WEB_VITALS_THRESHOLDS.FCP.GOOD ? 100 :
                    metrics.fcp <= CORE_WEB_VITALS_THRESHOLDS.FCP.NEEDS_IMPROVEMENT ? 50 : 0;
    totalScore += fcpScore * PERFORMANCE_WEIGHTS.FCP;
    totalWeight += PERFORMANCE_WEIGHTS.FCP;
  }

  // TTFBスコア
  if (metrics.ttfb !== null) {
    const ttfbScore = metrics.ttfb <= TTFB_THRESHOLDS.GOOD ? 100 :
                     metrics.ttfb <= TTFB_THRESHOLDS.NEEDS_IMPROVEMENT ? 50 : 0;
    totalScore += ttfbScore * PERFORMANCE_WEIGHTS.TTFB;
    totalWeight += PERFORMANCE_WEIGHTS.TTFB;
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

// パフォーマンスレベルの判定
export function getPerformanceLevel(score: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

// パフォーマンスレベルの色
export function getPerformanceLevelColor(level: string): string {
  switch (level) {
    case 'excellent': return 'text-green-600';
    case 'good': return 'text-blue-600';
    case 'needs-improvement': return 'text-yellow-600';
    case 'poor': return 'text-red-600';
    default: return 'text-gray-600';
  }
}
