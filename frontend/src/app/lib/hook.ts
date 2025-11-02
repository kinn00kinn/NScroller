"use client";

// 修正: useMemo をインポート
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import useSWRInfinite from "swr/infinite";

// fetcher と Article 型をインポート
import { fetcher } from "@/app/lib/api";
import type { Article } from "@/app/lib/mockData";

// 1. フィードのアイテム型を定義 (記事または広告)
type Ad = {
  type: "ad";
  id: string;
};
export type FeedItem = Article | Ad;

// APIレスポンスの型 (バックエンドの仕様に合わせる)
// API (/api/articles) は { articles: Article[], hasMore: boolean } を返すと想定
type ApiResponse = {
  articles: Article[];
  hasMore: boolean;
};

// 1ページあたりの記事数 (APIのデフォルトと合わせるか、指定する)
const PAGE_SIZE = 20;

// 2. 無限スクロールフック (SWRバージョン)
export function useInfiniteFeed() {
  const { ref, inView } = useInView({ threshold: 0.5 }); // SWR Infinite を使ったデータ取得

  const { data, error, size, setSize, isValidating } =
    useSWRInfinite<ApiResponse>((pageIndex, previousPageData) => {
      // 前のページが最後のページだったら、nullを返して停止
      if (previousPageData && !previousPageData.hasMore) {
        return null;
      } // 次のページのURLを返す

      return `/api/posts?page=${pageIndex + 1}&limit=${PAGE_SIZE}`;
    }, fetcher); // 取得したデータを単一の配列に加工

  // --- 修正: データ加工ロジックを useMemo で囲み、内容を強化 ---
  const items: FeedItem[] = useMemo(() => {
    // ★ 1. ページ内シャッフル用の関数 (Fisher-Yates)
    const shuffleArray = (array: Article[]): Article[] => {
      // APIレスポンスが空の場合 (page.articles が undefined の可能性)
      if (!array) return [];

      const newArr = [...array]; // 元の配列を壊さないようコピー
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };

    // ★ 2. 広告挿入の間隔をランダムにする (例: 3〜7件ごと)
    const getRandomAdInterval = () => Math.floor(Math.random() * 5) + 3; // 3, 4, 5, 6, 7

    let adCounter = 0; // 広告挿入までのカウンター
    let nextAdInterval = getRandomAdInterval(); // 最初の間隔

    return data
      ? data.flatMap((page, pageIndex) => {
          const feedItems: FeedItem[] = [];

          // ★ 1. ページ単位でシャッフルを実行
          const shuffledArticles = shuffleArray(page.articles);

          shuffledArticles.forEach((article, articleIndex) => {
            feedItems.push(article);

            // ★ 2. 修正: 広告挿入ロジック (ランダム間隔)
            adCounter++;
            if (adCounter >= nextAdInterval) {
              const globalIndex = pageIndex * PAGE_SIZE + articleIndex + 1;
              feedItems.push({ type: "ad", id: `ad-${globalIndex}` });

              // カウンターをリセットし、次の間隔をランダムに再設定
              adCounter = 0;
              nextAdInterval = getRandomAdInterval();
            }
          });
          return feedItems;
        })
      : [];
  }, [data]); // ★ data が変更されたときのみ再計算 // ローディング状態
  // --- 修正ここまで ---

  const isLoading = isValidating; // さらに読み込むデータがあるか

  const hasMore = data ? data[data.length - 1]?.hasMore : true; // 画面下部に到達したら次のページを読み込む

  useEffect(() => {
    if (inView && !isLoading && hasMore) {
      setSize(size + 1);
    }
  }, [inView, isLoading, hasMore, size, setSize]);

  return { items, isLoading, hasMore, error, ref };
}
