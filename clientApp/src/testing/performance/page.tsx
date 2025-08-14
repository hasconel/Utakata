import PerformanceTestRunner from '@/components/testing/PerformanceTestRunner';

export default function PerformanceTestingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PerformanceTestRunner />
    </div>
  );
}

export const metadata = {
  title: 'パフォーマンステスト - Utakata',
  description: 'Utakataアプリケーションの包括的なパフォーマンステストを実行します',
};
