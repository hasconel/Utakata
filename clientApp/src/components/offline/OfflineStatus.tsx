"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useOfflineManager } from '@/hooks/offline/useOfflineManager';

// 接続品質のアイコン
function ConnectionQualityIcon({ quality }: { quality: string }) {
  switch (quality) {
    case 'excellent':
      return <span className="text-green-500">📶</span>;
    case 'good':
      return <span className="text-yellow-500">📶</span>;
    case 'poor':
      return <span className="text-red-500">📶</span>;
    default:
      return <span className="text-gray-500">📶</span>;
  }
}

// 接続タイプのアイコン
function ConnectionTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'wifi':
      return <span className="text-blue-500">📶</span>;
    case 'cellular':
      return <span className="text-purple-500">📱</span>;
    case 'none':
      return <span className="text-red-500">❌</span>;
    default:
      return <span className="text-gray-500">❓</span>;
  }
}

// オフライン状態表示コンポーネント
export default function OfflineStatus() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [stats, setStats] = useState<any>(null);
  
  const {
    offlineState,
    isSyncing,
    syncProgress,
    lastSyncTime,
    manualSync,
    getOfflineStats,
    clearOfflineData,
  } = useOfflineManager();

  // 統計情報を定期的に更新
  useEffect(() => {
    const updateStats = async () => {
      const newStats = await getOfflineStats();
      setStats(newStats);
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000); // 5秒ごとに更新
    
    return () => clearInterval(interval);
  }, [getOfflineStats]);

  // 現在時刻の更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // オフライン時間のフォーマット
  const formatOfflineDuration = (duration: number) => {
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 最終同期時刻のフォーマット
  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return '未同期';
    
    const diff = currentTime - timestamp;
    if (diff < 60000) return '1分前';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    return `${Math.floor(diff / 86400000)}日前`;
  };

  // 統計情報はuseStateで管理

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* メイン状態表示 */}
      <Card className={`p-3 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-auto'
      } bg-white/95 dark:bg-gray-800/95 backdrop-blur`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 接続状態アイコン */}
            {offlineState.isOnline ? (
              <span className="text-green-500 text-lg">🟢</span>
            ) : (
              <span className="text-red-500 text-lg">🔴</span>
            )}
            
            {/* 接続情報 */}
            <div className="flex items-center gap-1">
              <ConnectionTypeIcon type={offlineState.connectionType} />
              <ConnectionQualityIcon quality={offlineState.connectionQuality} />
            </div>
            
            {/* 状態テキスト */}
            <span className="text-sm font-medium">
              {offlineState.isOnline ? 'オンライン' : 'オフライン'}
            </span>
          </div>
          
          {/* 展開/折りたたみボタン */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="ml-2"
          >
            {isExpanded ? '▼' : '▶'}
          </Button>
        </div>

        {/* 展開時の詳細情報 */}
        {isExpanded && (
          <div className="mt-3 space-y-3">
            {/* 接続詳細 */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>接続タイプ:</span>
                <span className="font-mono">
                  {offlineState.connectionType === 'unknown' ? '不明' : offlineState.connectionType}
                </span>
              </div>
              <div className="flex justify-between">
                <span>接続品質:</span>
                <span className="font-mono">
                  {offlineState.connectionQuality === 'unknown' ? '不明' : offlineState.connectionQuality}
                </span>
              </div>
              {offlineState.isOffline && (
                <div className="flex justify-between">
                  <span>オフライン時間:</span>
                  <span className="font-mono">
                    {formatOfflineDuration(offlineState.offlineDuration)}
                  </span>
                </div>
              )}
            </div>

            {/* 同期状況 */}
            <div className="border-t pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">同期状況</span>
                <Button
                  onClick={manualSync}
                  disabled={!offlineState.isOnline || isSyncing}
                  size="sm"
                  variant="outline"
                >
                  {isSyncing ? '同期中...' : '手動同期'}
                </Button>
              </div>
              
              {isSyncing && (
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    同期中... {syncProgress}%
                  </div>
                </div>
              )}
              
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>最終同期:</span>
                  <span className="font-mono">
                    {formatLastSyncTime(lastSyncTime)}
                  </span>
                </div>
                {stats && (
                  <>
                    <div className="flex justify-between">
                      <span>キュー数:</span>
                      <span className="font-mono">{stats.queue.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ストレージ使用:</span>
                      <span className="font-mono">
                        {stats.storage ? `${stats.storage.usagePercentage.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* アクション */}
            <div className="border-t pt-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (confirm('オフラインデータをクリアしますか？')) {
                      clearOfflineData();
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  データクリア
                </Button>
                <Button
                  onClick={() => {
                    // オフライン設定画面を開く
                    console.log('Open offline settings');
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  設定
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
