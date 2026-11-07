/** @type {import('next').NextConfig} */
const nextConfig = {
  // 環境に関係なく同じ設定
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // 画像は /_next/image で変換しない。外部画像は /api/image を経由する（lib/utils.ts の convertToInternalUrl）
  images: {
    unoptimized: true,
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
