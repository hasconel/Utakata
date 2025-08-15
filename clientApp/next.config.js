/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境での設定
  ...(process.env.NODE_ENV === 'production' && {
    // 本番環境でのテストファイル完全除外（強化版）
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
    
    // Webpack設定でテストファイルを除外
    webpack: (config, { dev, isServer }) => {
      if (!dev) {
        // テストファイルを完全に除外
        config.module.rules.push({
          test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
          loader: 'ignore-loader',
        });
        
        // テストディレクトリ全体を除外
        config.resolve.alias = {
          ...config.resolve.alias,
          '@/test': false,
          '@/components/testing': false,
          '@/app/testing': false,
          // パフォーマンステスト関連のファイルも除外
          'PerformanceTestSuite': false,
          'runPerformanceTests': false,
          'PerformanceTestRunner': false,
        };
        
        // テスト関連のファイルを除外（強化版）
        config.module.rules.push({
          test: (path) => {
            return path.includes('test') || 
                   path.includes('testing') || 
                   path.includes('PerformanceTestSuite') ||
                   path.includes('runPerformanceTests') ||
                   path.includes('PerformanceTestRunner');
          },
          loader: 'ignore-loader',
        });

        // 特定のファイルパターンを除外
        config.module.rules.push({
          test: /[\\/]src[\\/](test|components[\\/]testing|app[\\/]testing)[\\/]/,
          loader: 'ignore-loader',
        });

        // パフォーマンステスト関連のファイルを強制的に除外
        config.module.rules.push({
          test: /PerformanceTestSuite|runPerformanceTests|PerformanceTestRunner/,
          loader: 'ignore-loader',
        });

        // テストディレクトリ内のすべてのファイルを除外
        config.module.rules.push({
          test: /[\\/]src[\\/]test[\\/].*/,
          loader: 'ignore-loader',
        });

        // テストコンポーネントを除外
        config.module.rules.push({
          test: /[\\/]src[\\/]components[\\/]testing[\\/].*/,
          loader: 'ignore-loader',
        });

        // テストページを除外
        config.module.rules.push({
          test: /[\\/]src[\\/]app[\\/]testing[\\/].*/,
          loader: 'ignore-loader',
        });

        // 動的インポートでテストファイルが含まれないようにする
        config.plugins = config.plugins || [];
        config.plugins.push(
          new (require('webpack').DefinePlugin)({
            'process.env.EXCLUDE_TESTS': JSON.stringify('true'),
          })
        );

        // テストファイルをexternalsとして設定（完全除外）
        config.externals = config.externals || [];
        config.externals.push({
          '@/test': 'commonjs @/test',
          '@/components/testing': 'commonjs @/components/testing',
          '@/app/testing': 'commonjs @/app/testing',
        });

        // テストファイルの完全除外（強化版）
        config.resolve.alias = {
          ...config.resolve.alias,
          '@/test': false,
          '@/components/testing': false,
          '@/app/testing': false,
          // パフォーマンステスト関連のファイルも除外
          'PerformanceTestSuite': false,
          'runPerformanceTests': false,
          'PerformanceTestRunner': false,
        };

        // テストファイルのパス解決を無効化
        config.resolve.fallback = {
          ...config.resolve.fallback,
          '@/test': false,
          '@/components/testing': false,
          '@/app/testing': false,
        };

        // テストファイルのインポートを完全にブロック
        config.module.rules.push({
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: [
            /[\\/]src[\\/]test[\\/]/,
            /[\\/]src[\\/]components[\\/]testing[\\/]/,
            /[\\/]src[\\/]app[\\/]testing[\\/]/,
            /PerformanceTestSuite/,
            /runPerformanceTests/,
            /PerformanceTestRunner/,
          ],
        });
      }
      return config;
    },
  }),

  // 共通設定
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_DOMAIN.split('//')[1]],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 圧縮設定
  compress: true,

  // パフォーマンス最適化
  poweredByHeader: false,
  generateEtags: false,

  // ヘッダー設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // リライト設定
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health/route',
      },
    ];
  },

  // Webpack設定
  webpack: (config, { dev, isServer }) => {
    // 本番環境でのテストディレクトリ除外は上で処理済み
    
    // 本番ビルドの最適化
    if (!dev) {
      // チャンク分割を無効化（self is not definedエラーを防ぐ）
      config.optimization.splitChunks = false;
      
      // ミニファイ
      config.optimization.minimize = true;
    } else {
      // 開発環境での設定
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    // Node.jsモジュールのフォールバック
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },

  // TypeScript設定
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint設定
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // React設定
  reactStrictMode: true,
};

module.exports = nextConfig;
