/*
frontend/src/app/not-found.tsx (修正後)
*/
"use client"; // ★ クライアントコンポーネントにする

import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
// ★ useLanguage フックをインポート
import { useLanguage } from "@/app/components/LanguageProvider";

export default function NotFound() {
  // ★ 言語フックを使用
  const { t } = useLanguage();

  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ヘッダー */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-2 border-b-2 border-black flex items-center space-x-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            {/* ★ 翻訳を適用 */}
            <h1 className="text-xl font-bold">{t("notFoundTitle")}</h1>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="border-x-2 border-b-2 border-black p-6 md:p-12">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-32 h-32 rounded-full border-4 border-black flex items-center justify-center bg-gray-100">
              <SearchX size={64} className="text-black" />
            </div>

            {/* ★ 翻訳を適用 */}
            <h2 className="text-2xl md:text-3xl font-bold">
              {t("notFoundHeading")}
            </h2>
            <p className="text-lg text-gray-700">{t("notFoundBody")}</p>

            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-black rounded-full shadow-md text-lg font-bold bg-white text-black hover:bg-gray-100 transition-colors duration-200"
            >
              {/* ★ 翻訳を適用 */}
              {t("notFoundButton")}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
