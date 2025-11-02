import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// --- ★ パンダSNSの基本情報を定義 ---
const siteTitle = "PanDo (パンドゥ)";
const siteDescription =
  "パンダ好きのためのSN";
// ★ サイトのドメイン（デプロイ先のURL）
const siteUrl = "https://n-scroller.vercel.app/"; // ★ 例: ご自身のURLに変更してください
// ★ OGP画像のパス (public/panda_back.png を想定)
const ogImageUrl = `${siteUrl}/Pando_banner_1000.png`;

export const metadata: Metadata = {
  // サイトの基本情報
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`, // ページごとにタイトルを変更できるように
  },
  description: siteDescription,

  // ファビコン (public/panda-icon.png を想定)
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png", // Apple用アイコンも指定（推奨）
  },

  // --- OGP (Facebook, Slack, etc.) ---
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl, // サイトのURL
    siteName: siteTitle,
    images: [
      {
        url: ogImageUrl, // ★ 指定された画像
        width: 1200, // 推奨サイズ
        height: 630, // 推奨サイズ
        alt: `${siteTitle} サイトバナー`,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },

  // --- Twitter (X) カード ---
  twitter: {
    card: "summary_large_image", // 大きな画像付きカード
    title: siteTitle,
    description: siteDescription,
    images: [ogImageUrl], // ★ 指定された画像
    // creator: "@YourPandaHandle", // ★ もしあればTwitter ID
  },
};
// --- メタデータここまで ---

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-white text-black`}
      >
        {children}
      </body>
    </html>
  );
}
