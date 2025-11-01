/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ['via.placeholder.com'], // 古い書き方
    // 新しい書き方 (Next.js 14+ 推奨):
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;

