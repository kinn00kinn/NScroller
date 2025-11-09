// frontend/src/app/components/FeedSorter.tsx
"use client";

import React from "react";
import { useLanguage } from "@/app/components/LanguageProvider";
// ...
type Props = {
  sortMode: "recent" | "recommended"; // ★ "recommended" (mを2つ) に修正
  setSortMode: (mode: "recent" | "recommended") => void; // ★ "recommended" (mを2つ) に修正
};
// ...

// 選択中のスタイル
const activeTabStyle = "border-b-4 border-blue-500 font-bold text-black";
// 非選択中のスタイル
const inactiveTabStyle =
  "border-b-4 border-transparent text-gray-500 hover:bg-gray-100";

export default function FeedSorter({ sortMode, setSortMode }: Props) {
  const { t } = useLanguage();
  return (
    <nav className="sticky top-[73px] z-10 flex bg-white/90 backdrop-blur-sm border-b-2 border-black">
      {/* ↑ sticky top-[73px] は、ヘッダーのGIFバナーの高さ(Pando_banner_1000.gif)に
         依存します。実際のバナーの高さに合わせて調整してください。
         もしヘッダー(page.tsx)の 'sticky' をやめるなら、ここは top-0 で構いません。
         ここでは、ヘッダーの高さを 73px と仮定します。
       */}
      <button
        onClick={() => setSortMode("recent")}
        className={`flex-1 py-3 text-center transition-colors ${
          sortMode === "recent" ? activeTabStyle : inactiveTabStyle
        }`}
      >
        {t("recent")}
      </button>
      <div className="w-px bg-black h-auto"></div> {/* 縦の区切り線 */}
      <button
        onClick={() => setSortMode("recommended")}
        className={`flex-1 py-3 text-center transition-colors ${
          sortMode === "recommended" ? activeTabStyle : inactiveTabStyle
        }`}
      >
        {t("likes")}
      </button>
    </nav>
  );
}
