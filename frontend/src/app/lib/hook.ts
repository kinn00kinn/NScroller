"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "./api";
import type { Article } from "./mockData"; // Article 型は再利用

// 1. フィードのアイテム型を定義 (記事または広告)
type Ad = {
  type: "ad";
  id: string; // "ad-1", "ad-2" のような一意のID
};
export type FeedItem = Article | Ad;

// APIレスポンスの型 (バックエンドの仕様に合わせる)
// 例: { articles: Article[], hasMore: boolean }
type ApiResponse = {
  articles: Article[];
  hasMore: boolean;
};

const PAGE_SIZE = 10; // 1ページあたりの記事数

// 2. 無限スクロールフック (SWRバージョン)
export function useInfiniteFeed() {
  const { ref, inView } = useInView({ threshold: 0.5 });

  // SWR Infinite を使ったデータ取得
  const { data, error, size, setSize, isValidating } = useSWRInfinite<ApiResponse>(
    // pageIndex: 0から始まるページ番号
    // previousPageData: 前のページのデータ
    (pageIndex, previousPageData) => {
      // 次のページがない場合は null を返してリクエストを停止
      if (previousPageData && !previousPageData.hasMore) {
        return null;
      }
      // APIエンドポイントのURLを生成
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      return `${apiUrl}/articles?page=${pageIndex + 1}&limit=${PAGE_SIZE}`;
    },
    fetcher
  );

  // 取得したデータを単一の配列に加工
  const items: FeedItem[] = data
    ? data.flatMap((page, pageIndex) => {
        const feedItems: FeedItem[] = [];
        page.articles.forEach((article, articleIndex) => {
          feedItems.push(article);
          // 記事3件ごとに広告を挿入
          const globalIndex = pageIndex * PAGE_SIZE + articleIndex + 1;
          if (globalIndex % 3 === 0) {
            feedItems.push({ type: "ad", id: `ad-${globalIndex}` });
          }
        });
        return feedItems;
      })
    : [];

  // ローディング状態
  const isLoading = isValidating;

  // さらに読み込むデータがあるか
  const hasMore = data ? data[data.length - 1]?.hasMore : true;

  // 画面下部に到達したら次のページを読み込む
  useEffect(() => {
    if (inView && !isLoading && hasMore) {
      setSize(size + 1);
    }
  }, [inView, isLoading, hasMore, size, setSize]);

  return { items, isLoading, hasMore, error, ref };
}
