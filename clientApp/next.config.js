/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "127.0.0.1", "192.168.1.121"],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
