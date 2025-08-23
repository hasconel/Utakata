/** @type {import('next').NextConfig} */
const nextConfig = {
  // 環境に関係なく同じ設定
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // 画像設定（next/image用）
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_DOMAIN?.replace(/^https?:\/\//, '') ,
      process.env.APPWRITE_ENDPOINT?.replace(/^https?:\/\//, '').replace(/\/v1/,"") ,
    ].filter(Boolean), // undefinedやnullを除外
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // セキュリティヘッダー
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
    ];
  },


}

module.exports = nextConfig;
