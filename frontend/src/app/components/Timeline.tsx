// frontend/src/app/components/Timeline.tsx
"use client";

import { useInfiniteFeed, type FeedItem } from "@/app/lib/hook";
import ArticleCard from "./ArticleCard";
import AdCard from "./AdCard";
import { Loader2, AlertTriangle } from "lucide-react";

// Helper (変更なし)
function isAd(item: FeedItem): item is { type: "ad"; id: string } {
  return "type" in item && item.type === "ad";
}

// ★ sortMode を props で受け取る
export default function Timeline({
  sortMode,
  myLikesOnly = false,
}: {
  sortMode: string;
  myLikesOnly?: boolean;
}) {
  // ★ useInfiniteFeed に sortMode を渡す
  // ★ mutate も受け取る

  const { items, isLoading, hasMore, error, ref, mutate } =
    useInfiniteFeed(sortMode, myLikesOnly);

  // エラー表示 (変更なし)
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
        // ★ ArticleCard に mutate 関数を渡す (いいねの即時反映のため)
        return (
          <ArticleCard key={item.id} article={item} onLikeSuccess={() => mutate()} />
        );
      })}

      {/* ... ローディング表示 ... (変更なし) */}
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
