"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePerformanceMonitor } from '@/hooks/performance/usePerformanceMonitor';

// パフォーマンススコアの計算
function calculateScore(value: number | null, thresholds: { good: number; needsImprovement: number }): {
  score: number;
  status: 'good' | 'needs-improvement' | 'poor';
  color: string;
} {
  if (value === null) {
    return { score: 0, status: 'poor', color: 'text-red-500' };
  }

  if (value <= thresholds.good) {
    return { score: 100, status: 'good', color: 'text-green-500' };
  } else if (value <= thresholds.needsImprovement) {
    return { score: 50, status: 'needs-improvement', color: 'text-yellow-500' };
  } else {
    return { score: 0, status: 'poor', color: 'text-red-500' };
  }
}

// メトリクスカードコンポーネント
function MetricCard({ 
  title, 
  value, 
  unit, 
  thresholds, 
  description 
}: {
  title: string;
  value: number | null;
  unit: string;
  thresholds: { good: number; needsImprovement: number };
  description: string;
}) {
  const { score, status, color } = calculateScore(value, thresholds);
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className={`text-xs font-bold ${color}`}>
          {score}/100
        </span>
      </div>
      <div className="mb-2">
        <span className="text-2xl font-bold">
          {value !== null ? `${value.toFixed(1)}` : 'N/A'}
        </span>
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </div>
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              status === 'good' ? 'bg-green-500' : 
              status === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-gray-600">{description}</p>
      <div className="mt-2 text-xs text-gray-500">
        <span>Good: ≤{thresholds.good}{unit}</span>
        <span className="mx-2">•</span>
        <span>Needs Improvement: ≤{thresholds.needsImprovement}{unit}</span>
      </div>
    </Card>
  );
}

// 統計情報コンポーネント
function StatsCard({ title, data, unit }: { title: string; data: number[]; unit: string }) {
  if (data.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-2">{title}</h3>
        <p className="text-gray-500 text-sm">データなし</p>
      </Card>
    );
  }

  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>平均:</span>
          <span className="font-mono">{avg.toFixed(1)}{unit}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>最小:</span>
          <span className="font-mono">{min.toFixed(1)}{unit}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>最大:</span>
          <span className="font-mono">{max.toFixed(1)}{unit}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>件数:</span>
          <span className="font-mono">{data.length}</span>
        </div>
      </div>
    </Card>
  );
}

// エラーリストコンポーネント
function ErrorList({ errors }: { errors: Array<{ message: string; timestamp: number; type: string }> }) {
  if (errors.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-2">エラー</h3>
        <p className="text-green-500 text-sm">エラーなし 🎉</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">エラー ({errors.length})</h3>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {errors.slice(-10).map((error, index) => (
          <div key={index} className="text-xs border-l-2 border-red-500 pl-2">
            <div className="flex justify-between">
              <span className="font-medium text-red-600">{error.type.toUpperCase()}</span>
              <span className="text-gray-500">
                {new Date(error.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-gray-700 truncate">{error.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// メインのパフォーマンスダッシュボード
export default function PerformanceDashboard() {
  const { getMetrics, resetMetrics, exportMetrics } = usePerformanceMonitor();
  const [metrics, setMetrics] = useState(getMetrics());
  const [isVisible, setIsVisible] = useState(false);

  // 定期的にメトリクスを更新
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [getMetrics]);

  // ダッシュボードの表示/非表示を切り替え
  const toggleDashboard = () => {
    setIsVisible(!isVisible);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleDashboard}
          variant="outline"
          size="sm"
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur"
        >
          📊 パフォーマンス
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-lg shadow-2xl overflow-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            📊 パフォーマンスダッシュボード
          </h1>
          <div className="flex gap-2">
            <Button onClick={exportMetrics} variant="outline" size="sm">
              📥 エクスポート
            </Button>
            <Button onClick={resetMetrics} variant="outline" size="sm">
              🔄 リセット
            </Button>
            <Button onClick={toggleDashboard} variant="outline" size="sm">
              ✕ 閉じる
            </Button>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            🎯 Core Web Vitals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="LCP (Largest Contentful Paint)"
              value={metrics.lcp}
              unit="ms"
              thresholds={{ good: 2500, needsImprovement: 4000 }}
              description="ページの主要コンテンツが表示されるまでの時間"
            />
            <MetricCard
              title="FID (First Input Delay)"
              value={metrics.fid}
              unit="ms"
              thresholds={{ good: 100, needsImprovement: 300 }}
              description="ユーザーの最初の操作に対する応答時間"
            />
            <MetricCard
              title="CLS (Cumulative Layout Shift)"
              value={metrics.cls}
              unit=""
              thresholds={{ good: 0.1, needsImprovement: 0.25 }}
              description="ページのレイアウトの安定性"
            />
            <MetricCard
              title="FCP (First Contentful Paint)"
              value={metrics.fcp}
              unit="ms"
              thresholds={{ good: 1800, needsImprovement: 3000 }}
              description="最初のコンテンツが表示されるまでの時間"
            />
          </div>
        </div>

        {/* その他のメトリクス */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            📈 その他のメトリクス
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="TTFB (Time to First Byte)"
              value={metrics.ttfb}
              unit="ms"
              thresholds={{ good: 800, needsImprovement: 1800 }}
              description="サーバーからの最初のバイトを受信するまでの時間"
            />
            <StatsCard
              title="API応答時間"
              data={metrics.apiResponseTime}
              unit="ms"
            />
            <StatsCard
              title="画像読み込み時間"
              data={metrics.imageLoadTime}
              unit="ms"
            />
          </div>
        </div>

        {/* エラー情報 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            ⚠️ エラー監視
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ErrorList errors={metrics.errors} />
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">リアルタイム更新</h3>
              <p className="text-sm text-gray-600">
                このダッシュボードは1秒ごとに更新されます。
                パフォーマンスの問題を早期発見し、ユーザー体験を向上させましょう！
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
