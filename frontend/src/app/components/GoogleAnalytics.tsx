"use client"; // ★ クライアントコンポーネントとしてマーク

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

// .env.local から測定IDを読み込む
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  const pathname = usePathname();

  // ★ ページ遷移（pathname）を検知して page_view イベントを送信
  useEffect(() => {
    // IDがない、または gtag 関数がロードされていない場合は何もしない
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== "function") {
      return;
    }

    // page_view イベントを送信
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: pathname,
    });
  }, [pathname]); // pathname が変わるたびに実行

  // 測定IDが設定されていない場合は、スクリプトを描画しない
  if (!GA_MEASUREMENT_ID) {
    console.warn("Google Analytics 測定IDが設定されていません。");
    return null;
  }

  return (
    <>
      {/* 1. gtag.js ライブラリ本体を非同期で読み込む */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive" // ページ描画後に読み込む
      />
      {/* 2. gtag の初期化と初回 page_view の設定 */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          // 初回ロード時の設定
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
