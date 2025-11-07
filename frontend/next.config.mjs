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
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ddkzwseifqzfifwigjvs.supabase.co", // エラーに出たホスト名
        port: "",
        pathname: "/storage/v1/object/public/avatars/**", // avatarsバケットのパス
      },
    ],
  },
};

export default nextConfig;
