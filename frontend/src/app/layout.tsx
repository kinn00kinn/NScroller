// ★ 1. クライアントコンポーネントに変更
"use client";

import type { Metadata } from "next"; // (型定義は残してもOK)
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import { LanguageProvider } from "./components/LanguageProvider";
// ★ 2. AnimatePresence をインポート
import { AnimatePresence } from "framer-motion";
import GoogleAnalytics from "./components/GoogleAnalytics";

// ★ 3. "use client" にすると `export const metadata` は使えなくなるため、
//    <head> タグを直接記述します。
/*
export const metadata: Metadata = { ... };
*/

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* ★ 4. <head> タグをここに追加 */}
      <head>
        <title>PanDo (パンドゥ)</title>
        <meta name="description" content="Latest Panda SNS" />
        <link rel="icon" href="/favicon.ico" />
        {/* 元の metadata オブジェクトからOGP情報などを移設 */}
        <meta property="og:title" content="PanDo (パンドゥ)" />
        <meta property="og:description" content="Latest Panda SNS" />
        <meta property="og:url" content="https://n-scroller.vercel.app" />
        <meta
          property="og:image"
          content="https://n-scroller.vercel.app/Pando_banner_1000.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </head>

      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-white text-black`}
      >
        <GoogleAnalytics />
        <AuthProvider>
          <LanguageProvider>
            {/* ★ 5. children を AnimatePresence でラップ */}
            <AnimatePresence
              mode="wait" // 遷移アニメーションが完了するまで待機
              // onExitComplete={() => window.scrollTo(0, 0)} // 遷移完了時にトップへスクロール
            >
              {children}
            </AnimatePresence>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
