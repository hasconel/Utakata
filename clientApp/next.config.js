/** @type {import('next').NextConfig} */
const nextConfig = {
  // 環境に関係なく同じ設定
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // 画像設定（next/image用）
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_DOMAIN?.replace(/^https?:\/\//, '') ,
      process.env.APPWRITE_ENDPOINT?.replace(/^https?:\/\/[^\/]+/, '') ,
      process.env.APPWRITE_ENDPOINT?.replace(/^https?:\/\/[^\/]+/, '') ,
    ].filter(Boolean), // undefinedやnullを除外
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // セキュリティヘッダー（環境に関係なく）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
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
        source: '/files/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: `/users/(.*)`,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31000, stale-while-revalidate=1600',
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


  webpack: (config, { dev, isServer }) => {
    // チャンク分割を無効化（self is not definedエラーを防ぐ）
    config.optimization.splitChunks = false;
    
    // ミニファイ（環境に関係なく）
    config.optimization.minimize = true;
    
    // 環境に関係なく同じ設定
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    
    // Node.jsモジュールのフォールバック
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
