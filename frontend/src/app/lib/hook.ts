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
// ★★★ 修正: 'export' を追加 ★★★
export type ApiResponse = {
  articles: Article[];
  hasMore: boolean;
};

const PAGE_SIZE = 20;

// 2. 無限スクロールフック (SWRバージョン)
// ★ sortMode と myLikesOnly を引数に追加
export function useInfiniteFeed(
  sortMode: string = "recent",
  myLikesOnly: boolean = false,
  myBookmarksOnly: boolean = false // ★★★ パラメータ追加 ★★★
) {
  const { ref, inView } = useInView({ threshold: 0.5 });

  const { data, error, size, setSize, isValidating, mutate } =
    useSWRInfinite<ApiResponse>((pageIndex, previousPageData) => {
      const apiSortMode = sortMode === "recommended" ? "likes" : "recent";
      // 前のページが最後のページだったら、nullを返して停止
      if (previousPageData && !previousPageData.hasMore) {
        return null;
      }

      // ★ URLに sort と liked_by_user を追加
      let url = `/api/posts?page=${
        pageIndex + 1
      }&limit=${PAGE_SIZE}&sort=${apiSortMode}`;
      if (myLikesOnly) {
        url += "&liked_by_user=true";
      }
      if (myBookmarksOnly) {
        url += "&bookmarked_by_user=true";
      }
      return url;
    }, fetcher);

  const items: FeedItem[] = useMemo(() => {
    /**
     * ★ 決定論的な広告挿入間隔を計算する関数
     * ページ番号と記事番号に基づいて、3〜7件の間隔を「常に同じ結果」で返します。
     * (例: 0ページ目の0番目の次は5件後、0ページ目の5番目の次は3件後... というのが固定される)
     */
    const getDeterministicAdInterval = (
      pageIndex: number,
      articleIndex: number
    ) => {
      // ページ番号と記事番号を使った単純な計算
      const hash = (pageIndex + 1) * 17 + (articleIndex + 1) * 31;
      // 3〜7の5パターン (3, 4, 5, 6, 7) を循環させる
      const interval = (hash % 5) + 3;
      return interval;
    };

    let adCounter = 0;
    // ★ 最初の間隔を決定論的に設定 (0, 0 に基づく)
    let nextAdInterval = getDeterministicAdInterval(0, 0);

    return data
      ? data.flatMap((page, pageIndex) => {
          // ★ page.articles が undefined でないことを確認
          if (!page || !page.articles) return [];

          const feedItems: FeedItem[] = [];

          page.articles.forEach((article, articleIndex) => {
            feedItems.push(article);

            adCounter++;

            // 広告を挿入するタイミングかチェック
            if (adCounter >= nextAdInterval) {
              const globalIndex = pageIndex * PAGE_SIZE + articleIndex + 1;
              feedItems.push({ type: "ad", id: `ad-${globalIndex}` });

              // ★ 次の広告挿入間隔も、次の記事の位置に基づいて決定論的に設定
              adCounter = 0;
              nextAdInterval = getDeterministicAdInterval(
                pageIndex,
                articleIndex + 1
              );
            }
          });
          return feedItems;
        })
      : [];
  }, [data]); // ★ 依存配列は [data] のままでOKです

  const isLoading = isValidating;
  const hasMore = data ? data[data.length - 1]?.hasMore : true;

  useEffect(() => {
    if (inView && !isLoading && hasMore) {
      setSize(size + 1);
    }
  }, [inView, isLoading, hasMore, size, setSize]);

  return { items, isLoading, hasMore, error, ref, mutate }; // ★ mutate を返す
}
