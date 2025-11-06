// frontend/src/app/lib/hook.ts
"use client";

// 修正: useMemo をインポート
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import useSWRInfinite from "swr/infinite";

// fetcher と Article 型をインポート
import { fetcher } from "@/app/lib/api";
// ★ 型定義を修正
import type { Article, Comment } from "@/app/lib/mockData";

// 1. フィードのアイテム型を定義 (記事または広告)
type Ad = {
  type: "ad";
  id: string;
};
export type FeedItem = Article | Ad;

// APIレスポンスの型 (APIの戻り値に合わせる)
type ApiResponse = {
  articles: Article[];
  hasMore: boolean;
};

const PAGE_SIZE = 20;

// 2. 無限スクロールフック (SWRバージョン)
// ★ sortMode と myLikesOnly を引数に追加
export function useInfiniteFeed(
  sortMode: string = "recent",
  myLikesOnly: boolean = false
) {
  const { ref, inView } = useInView({ threshold: 0.5 });

  const { data, error, size, setSize, isValidating, mutate } =
    useSWRInfinite<ApiResponse>((pageIndex, previousPageData) => {
      // 前のページが最後のページだったら、nullを返して停止
      if (previousPageData && !previousPageData.hasMore) {
        return null;
      }

      // ★ URLに sort と liked_by_user を追加
      let url = `/api/posts?page=${
        pageIndex + 1
      }&limit=${PAGE_SIZE}&sort=${sortMode}`;
      if (myLikesOnly) {
        url += "&liked_by_user=true";
      }
      return url;
    }, fetcher);

  // --- 修正: 広告挿入ロジックのみに簡略化 ---
  const items: FeedItem[] = useMemo(() => {
    // 広告挿入の間隔をランダムにする (例: 3〜7件ごと)
    const getRandomAdInterval = () => Math.floor(Math.random() * 5) + 3; // 3, 4, 5, 6, 7

    let adCounter = 0;
    let nextAdInterval = getRandomAdInterval();

    return data
      ? data.flatMap((page, pageIndex) => {
          // ★ page.articles が undefined でないことを確認
          if (!page || !page.articles) return [];

          const feedItems: FeedItem[] = [];

          // ★ shuffleArray は削除 ★
          page.articles.forEach((article, articleIndex) => {
            feedItems.push(article);

            adCounter++;
            if (adCounter >= nextAdInterval) {
              const globalIndex = pageIndex * PAGE_SIZE + articleIndex + 1;
              feedItems.push({ type: "ad", id: `ad-${globalIndex}` });
              adCounter = 0;
              nextAdInterval = getRandomAdInterval();
            }
          });
          return feedItems;
        })
      : [];
  }, [data]);
  // --- 修正ここまで ---

  const isLoading = isValidating;
  const hasMore = data ? data[data.length - 1]?.hasMore : true;

  useEffect(() => {
    if (inView && !isLoading && hasMore) {
      setSize(size + 1);
    }
  }, [inView, isLoading, hasMore, size, setSize]);

  return { items, isLoading, hasMore, error, ref, mutate }; // ★ mutate を返す
}
