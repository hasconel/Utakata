/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {},
  images: {
    domains: [process.env.NEXT_PUBLIC_REACT_APP_ENDPOINT],
  },
};

module.exports = nextConfig;
