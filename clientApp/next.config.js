/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
      allowedOrigins: ['http://localhost:3000','https://utakata.hasconel.com'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'pbs.hasconel.com',
      },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
