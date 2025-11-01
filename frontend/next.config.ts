// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     // domains: ['via.placeholder.com'], // 古い書き方
//     // 新しい書き方 (Next.js 14+ 推奨):
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "via.placeholder.com",
//         port: "",
//         pathname: "/**",
//       },
//     ],
//   },
// };

// module.exports = nextConfig;

import type { NextConfig } from "next";

// ★ GitHubリポジトリ名 (例: https://username.github.io/NScroller/)
const repoName = "NScroller";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /**
   * ★ 1. 静的サイトとして 'out' フォルダに出力する
   */
  output: "export",

  /**
   * ★ 2. GitHub Pages のサブディレクトリ設定
   * (リポジトリ名を設定)
   */
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",

  /**
   * ★ 3. 画像最適化を無効にする (静的サイトでは必須)
   */
  images: {
    unoptimized: true,
    // 既存の remotePatterns は 'export' モードでは不要な場合がありますが、
    // unoptimized: true があれば問題ありません。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
};

export default nextConfig;
