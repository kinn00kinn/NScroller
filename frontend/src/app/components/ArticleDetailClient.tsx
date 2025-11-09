// frontend/src/app/article/[id]/ArticleDetailClient.tsx

"use client"; // ★ これはクライアントコンポーネント

import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/app/lib/api";
import type { Article, Comment } from "@/app/lib/mockData";
import ArticleCard from "@/app/components/ArticleCard";
import { Loader2, User } from "lucide-react";
import { useSession } from "next-auth/react";
// ★ useState をインポート
import React, { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/app/components/LanguageProvider";
// ★ ApiResponse 型をインポート (グローバルキャッシュ更新のため)
import type { ApiResponse } from "@/app/lib/hook";

// --- アバターフォールバックコンポーネント (変更なし) ---
function AvatarWithFallback({
  src,
  alt,
  sizePx = 40,
}: {
  src: string | null | undefined;
  alt: string;
  sizePx?: number;
}) {
  const [imgError, setImgError] = useState(false);

  const fallback = (
    <div
      className="flex-shrink-0 rounded-full border-2 border-black flex items-center justify-center bg-gray-200"
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
    >
      <User size={sizePx * 0.6} className="text-black" />
    </div>
  );

  if (!src || imgError) {
    return fallback;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={sizePx}
      height={sizePx}
      className="flex-shrink-0 rounded-full border-2 border-black object-cover"
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
      onError={() => setImgError(true)}
      unoptimized
    />
  );
}

// --- コメント投稿フォーム (変更なし) ---
function CommentForm({
  articleId,
  onCommentPosted,
}: {
  articleId: string;
  onCommentPosted: (newComment: Comment) => void;
}) {
  const { data: session, status } = useSession();
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isPosting || status !== "authenticated") return;

    setIsPosting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: articleId, text: text.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const newComment = await response.json();
      onCommentPosted(newComment);
      setText("");
    } catch (error) {
      console.error(error);
      alert("コメントの投稿に失敗しました。");
    } finally {
      setIsPosting(false);
    }
  };

  if (status === "loading")
    return (
      <div className="p-4 border-y-2 border-black">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (status === "unauthenticated")
    return (
      <div className="p-4 border-y-2 border-black text-sm text-gray-600">
        {t("loginToComment")}
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-y-2 border-black flex space-x-3"
    >
      <AvatarWithFallback
        src={session?.user?.image}
        alt={session?.user?.name || "avatar"}
        sizePx={40}
      />

      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("commentPlaceholder")}
          className="w-full p-2 border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isPosting}
        />
        <button
          type="submit"
          disabled={isPosting || !text.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-full disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
        >
          {isPosting ? t("postingComment") : t("postComment")}
        </button>
      </div>
    </form>
  );
}

// --- コメント一覧 (変更なし) ---
function CommentList({ articleId }: { articleId: string }) {
  const { locale, t } = useLanguage();
  const { data, error, mutate } = useSWR(
    `/api/comments?article_id=${articleId}`,
    fetcher
  );

  const handleCommentPosted = (newComment: Comment) => {
    mutate((currentData: { comments: Comment[] } | undefined) => {
      const optimisticData = currentData
        ? [...currentData.comments, newComment]
        : [newComment];
      return { comments: optimisticData };
    }, false);
  };

  if (error)
    return (
      <div className="p-4 border-b-2 border-black text-red-500">
        {t("loadCommentsError")}
      </div>
    );
  if (!data)
    return (
      <div className="p-4 border-b-2 border-black">
        <Loader2 className="animate-spin" />
      </div>
    );

  const { comments: rawComments } = data as { comments: Comment[] };
  const comments = rawComments.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="flex flex-col">
      {comments.length === 0 ? (
        <div className="p-4 border-b-2 border-black text-center text-gray-500">
          {t("noComments")}
        </div>
      ) : (
        comments.map((comment) => (
          <div
            key={comment.id}
            className="p-4 border-b-2 border-black flex space-x-3"
          >
            <AvatarWithFallback
              src={comment.user?.image}
              alt={comment.user?.name || "avatar"}
              sizePx={40}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold">
                  {comment.user?.name || "User"}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: locale,
                  })}
                </span>
              </div>
              <p className="text-black whitespace-pre-wrap">{comment.text}</p>
            </div>
          </div>
        ))
      )}
      <CommentForm
        articleId={articleId}
        onCommentPosted={handleCommentPosted}
      />
    </div>
  );
}

/**
 * クライアントコンポーネント (メイン)
 */
export default function ArticleDetailClient({
  initialArticle,
}: {
  initialArticle: Article;
}) {
  const { mutate: globalMutate } = useSWRConfig();

  // サーバーから渡された初期データを、クライアント側で状態として持つ
  const [liveArticle, setLiveArticle] = useState(initialArticle);

  /**
   * ArticleCard内で楽観的UIが実行されたときに呼ばれるハンドラ
   * @param articleId 更新された記事のID
   * @param update 更新するデータ (例: { is_liked: true, like_num: 10 })
   */
  const handleOptimisticUpdate = (
    articleId: string,
    update: Partial<Article>
  ) => {
    // 1. このページのローカルstateを更新 (詳細ページの表示を即時反映)
    setLiveArticle((prev) => ({
      ...prev,
      ...update,
    }));

    // 2. タイムライン(/api/posts)のSWRグローバルキャッシュも更新
    globalMutate(
      (key: string) => typeof key === "string" && key.startsWith("/api/posts"),
      (currentData: ApiResponse[] | undefined) => {
        if (!currentData) return [];
        // SWRのキャッシュ(data)をイミュータブルに更新
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

  return (
    <>
      {/* - initialArticle の代わりに liveArticle を渡す
        - onOptimisticUpdate ハンドラを渡す
      */}
      <ArticleCard
        article={liveArticle}
        onOptimisticUpdate={handleOptimisticUpdate}
        onLikeSuccess={handleLikeSuccess} // ★★★ この行を追加 ★★★
      />

      {/* コメントリスト（SWRでクライアントで取得） */}
      <CommentList articleId={initialArticle.id} />
    </>
  );
}
