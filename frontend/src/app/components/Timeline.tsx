/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/components/Timeline.tsx の修正
*/
// frontend/src/app/components/Timeline.tsx
"use client";

import {
  useInfiniteFeed,
  type FeedItem,
  type ApiResponse,
} from "@/app/lib/hook";
import ArticleCard from "./ArticleCard";
import AdCard from "./AdCard";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Article } from "@/app/lib/mockData";

// Helper (変更なし)
function isAd(item: FeedItem): item is { type: "ad"; id: string } {
  return "type" in item && item.type === "ad";
}

// ★★★ 修正: handleOptimisticUpdate 関数をコンポーネントの外側から削除 ★★★
// (コンポーネントの内側に移動します)

export default function Timeline({
  sortMode,
  myLikesOnly = false,
  myBookmarksOnly = false,
  isTutorialActive = false, // ★ 1. isTutorialActive を Props に追加
}: {
  sortMode: string;
  myLikesOnly?: boolean;
  myBookmarksOnly?: boolean;
  isTutorialActive?: boolean; // ★ 1. isTutorialActive を Props に追加
}) {
  const { items, isLoading, hasMore, error, ref, mutate } = useInfiniteFeed(
    sortMode,
    myLikesOnly,
    myBookmarksOnly
  );

  // ★★★ 修正: 楽観的UIのためのハンドラを「コンポーネントの内側」に定義 ★★★
  // これにより、上記の `mutate` を正しく参照できます
  const handleOptimisticUpdate = (
    articleId: string,
    update: Partial<Article>
  ) => {
    // SWRInfiniteのキャッシュ(data)をイミュータブルに更新
    mutate(
      (currentData: ApiResponse[] | undefined) => {
        if (!currentData) return [];
        return currentData.map((page) => ({
          ...page,
          articles: page.articles.map((a) =>
            a.id === articleId ? { ...a, ...update } : a
          ),
        }));
      },
      { revalidate: false } // この更新では再取得（revalidate）を行わない
    );
  };
  // ★★★ 修正ここまで ★★★

  // エラー表示 (変更なし)
  if (error) {
    // ... (省略) ...
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
      {/* ★ 2. map に index を追加 */}
      {items.map((item, index) => {
        if (isAd(item)) {
          return <AdCard key={item.id} />;
        }

        // ★ 3. 最初の記事 (index 0) かつ広告でない場合に ID を設定
        const isFirstArticle = index === 0;
        const tutorialIds =
          isTutorialActive && isFirstArticle
            ? {
                like: "tutorial-like-button",
                bookmark: "tutorial-bookmark-button",
                comment: "tutorial-comment-button",
                share: "tutorial-share-button",
              }
            : undefined;

        return (
          <ArticleCard
            key={item.id}
            article={item}
            onLikeSuccess={() => {
              mutate();
            }}
            onOptimisticUpdate={handleOptimisticUpdate} // 正しく定義されたハンドラを渡す
            tutorialIds={tutorialIds} // ★ 4. ArticleCard に ID を渡す
          />
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
