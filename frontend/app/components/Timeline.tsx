"use client";

import { useInfiniteFeed, type FeedItem } from "@/lib/hook";
import ArticleCard from "./ArticleCard";
import AdCard from "./AdCard";
import { Loader2, AlertTriangle } from "lucide-react";

// Helper to check item type
function isAd(item: FeedItem): item is { type: "ad"; id: string } {
  return "type" in item && item.type === "ad";
}

export default function Timeline() {
  const { items, isLoading, hasMore, error, ref } = useInfiniteFeed();

  // エラーが発生した場合の表示
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-b-2 border-black">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-red-600">エラーが発生しました</h3>
        <p className="text-sm text-gray-600 mt-2">
          データの読み込みに失敗しました。時間をおいて再度お試しください。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((item) => {
        if (isAd(item)) {
          return <AdCard key={item.id} />;
        }
        return <ArticleCard key={item.id} article={item} />;
      })}

      {hasMore ? (
        <div
          ref={ref}
          className="flex justify-center items-center py-8 border-b-2 border-black"
        >
          {isLoading && (
            <Loader2 className="animate-spin text-gray-400" size={24} />
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-400 text-sm border-b-2 border-black">
          {items.length > 0 && "すべての記事を読み込みました"}
        </div>
      )}
    </div>
  );
}
