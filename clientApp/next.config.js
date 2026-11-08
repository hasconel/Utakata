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
      // /files/* のキャッシュは route.ts で決める（フォロワー限定のファイルを public にしないため）
    ];
  },


}

module.exports = nextConfig;
