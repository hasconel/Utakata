

/**
 * スケルトンローディングコンポーネント！✨
 * 投稿の読み込み中をキラキラに表示するよ！💖
 */
export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100 dark:border-purple-900 animate-pulse">
          {/* ユーザー情報のスケルトン！✨ */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            </div>
          </div>
          {/* 投稿内容のスケルトン！✨ */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          {/* 画像のスケルトン！✨ */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          {/* アクションボタンのスケルトン！✨ */}
          <div className="mt-4 flex space-x-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}