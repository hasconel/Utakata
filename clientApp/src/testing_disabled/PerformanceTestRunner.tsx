"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { runPerformanceTests } from '@/test/runPerformanceTests';

// テスト結果の型定義
interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  score: number;
  details: string;
  recommendations: string[];
}

interface TestSuiteResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  overallScore: number;
  results: TestResult[];
  summary: string;
}

// パフォーマンステスト実行コンポーネント
export default function PerformanceTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestSuiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProduction, setIsProduction] = useState(false);

  // 環境チェック
  useEffect(() => {
    setIsProduction(process.env.NODE_ENV === 'production');
  }, []);

  // 本番環境では何も表示しない
  if (isProduction) {
    return null;
  }

  // テスト実行
  const handleRunTests = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      // テスト実行
      const testResults = await runPerformanceTests();
      if (testResults) {
        setResults(testResults);
      } else {
        setError('テスト結果が取得できませんでした');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'テスト実行中にエラーが発生しました');
    } finally {
      setIsRunning(false);
    }
  };

  // テスト結果の表示
  const renderTestResult = (result: TestResult, index: number) => {
    const statusEmoji = {
      passed: '✅',
      failed: '❌',
      warning: '⚠️',
    };

    const statusColor = {
      passed: 'text-green-600',
      failed: 'text-red-600',
      warning: 'text-yellow-600',
    };

    return (
      <Card key={index} className="p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">
            {statusEmoji[result.status]} {result.name}
          </h3>
          <span className={`font-bold text-xl ${statusColor[result.status]}`}>
            {result.score}/100
          </span>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>状態: {result.status}</span>
            <span>実行時間: {result.duration.toFixed(2)}ms</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                result.status === 'passed' ? 'bg-green-500' : 
                result.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>
        </div>
        
        <p className="text-sm text-gray-700 mb-3">{result.details}</p>
        
        {result.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">推奨事項:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {result.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
          🧪 パフォーマンステストランナー
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Utakataアプリケーションの包括的なパフォーマンステストを実行します
        </p>
      </div>

      {/* テスト実行ボタン */}
      <Card className="p-6 mb-8 text-center">
        <Button
          onClick={handleRunTests}
          disabled={isRunning}
          size="lg"
          className="px-8 py-3"
        >
          {isRunning ? (
            <>
              <span className="animate-spin mr-2">⚡</span>
              テスト実行中...
            </>
          ) : (
            <>
              🚀 パフォーマンステストを実行
            </>
          )}
        </Button>
        
        {isRunning && (
          <p className="text-sm text-gray-600 mt-3">
            テストの実行には数分かかる場合があります...
          </p>
        )}
      </Card>

      {/* エラー表示 */}
      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-2">❌</span>
            <span className="text-red-700">{error}</span>
          </div>
        </Card>
      )}

      {/* テスト結果表示 */}
      {results && (
        <div>
          {/* サマリー */}
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-center">📊 テスト結果サマリー</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{results.overallScore}</div>
                <div className="text-sm text-gray-600">総合スコア</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{results.passedTests}</div>
                <div className="text-sm text-gray-600">成功</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{results.warningTests}</div>
                <div className="text-sm text-gray-600">警告</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{results.failedTests}</div>
                <div className="text-sm text-gray-600">失敗</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{results.totalTests}</div>
                <div className="text-sm text-gray-600">総テスト数</div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">{results.summary}</p>
            </div>
          </Card>

          {/* パフォーマンス評価 */}
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">🎯 パフォーマンス評価</h2>
            
            {results.overallScore >= 90 && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <span className="text-4xl mr-2">🎉</span>
                <p className="text-lg font-medium text-green-800">
                  優秀なパフォーマンスです！
                </p>
                <p className="text-green-600">ユーザー体験は最高レベルです。</p>
              </div>
            )}
            
            {results.overallScore >= 70 && results.overallScore < 90 && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <span className="text-4xl mr-2">👍</span>
                <p className="text-lg font-medium text-blue-800">
                  良好なパフォーマンスです。
                </p>
                <p className="text-blue-600">いくつかの改善点がありますが、十分に使用できます。</p>
              </div>
            )}
            
            {results.overallScore >= 50 && results.overallScore < 70 && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <span className="text-4xl mr-2">⚠️</span>
                <p className="text-lg font-medium text-yellow-800">
                  パフォーマンスに改善の余地があります。
                </p>
                <p className="text-yellow-600">推奨事項を実装して改善してください。</p>
              </div>
            )}
            
            {results.overallScore < 50 && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <span className="text-4xl mr-2">❌</span>
                <p className="text-lg font-medium text-red-800">
                  パフォーマンスの大幅な改善が必要です。
                </p>
                <p className="text-red-600">優先度の高い項目から改善を始めてください。</p>
              </div>
            )}
          </Card>

          {/* 詳細結果 */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">🔍 詳細結果</h2>
            
            {results.results.map((result, index) => 
              renderTestResult(result, index)
            )}
          </Card>
        </div>
      )}

      {/* 使用方法 */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">📖 使用方法</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. 「パフォーマンステストを実行」ボタンをクリックします</p>
          <p>2. テストの実行には数分かかる場合があります</p>
          <p>3. 結果が表示されたら、各テストの詳細を確認してください</p>
          <p>4. 推奨事項に従って改善を行ってください</p>
        </div>
      </Card>
    </div>
  );
}
