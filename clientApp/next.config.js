/** @type {import('next').NextConfig} */
const nextConfig = {
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
      {
        protocol: 'http',
        hostname: '192.168.1.121',
      },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
