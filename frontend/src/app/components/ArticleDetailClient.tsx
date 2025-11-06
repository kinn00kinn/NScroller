// frontend/src/app/article/[id]/ArticleDetailClient.tsx
// (このファイルを新しく作成してください)

"use client"; // ★ これはクライアントコンポーネント

import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/app/lib/api";
import type { Article, Comment } from "@/app/lib/mockData";
import ArticleCard from "@/app/components/ArticleCard";
import { Loader2, User } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

// --- コメント投稿フォーム (以前の page.tsx から移動) ---
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isPosting || status !== "authenticated") return;

    setIsPosting(true);
    try {
      const response = await fetch("/api/comments", {
        // POST /api/comments はそのまま使用
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
        コメントするにはログインが必要です。
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-y-2 border-black flex space-x-3"
    >
      {session?.user?.image ? (
        <Image
          src={session.user.image}
          alt="avatar"
          width={40}
          height={40}
          className="rounded-full w-10 h-10 border-2 border-black"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-black flex-shrink-0">
          <User size={20} />
        </div>
      )}
      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="返信を投稿..."
          className="w-full p-2 border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isPosting}
        />
        <button
          type="submit"
          disabled={isPosting || !text.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-full disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
        >
          {isPosting ? "投稿中..." : "返信"}
        </button>
      </div>
    </form>
  );
}

// --- コメント一覧 (以前の page.tsx から移動) ---
function CommentList({ articleId }: { articleId: string }) {
  // ★ GET /api/comments はそのまま使用
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
        コメントの読み込みに失敗しました。
      </div>
    );
  if (!data)
    return (
      <div className="p-4 border-b-2 border-black">
        <Loader2 className="animate-spin" />
      </div>
    );

  const { comments } = data as { comments: Comment[] };

  return (
    <div className="flex flex-col">
      <CommentForm
        articleId={articleId}
        onCommentPosted={handleCommentPosted}
      />

      {comments.length === 0 ? (
        <div className="p-4 border-b-2 border-black text-center text-gray-500">
          まだコメントはありません。
        </div>
      ) : (
        comments.map((comment) => (
          <div
            key={comment.id}
            className="p-4 border-b-2 border-black flex space-x-3"
          >
            {comment.user?.image ? (
              <Image
                src={comment.user.image}
                alt={comment.user.name || "avatar"}
                width={40}
                height={40}
                className="rounded-full w-10 h-10 border-2 border-black"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-black flex-shrink-0">
                <User size={20} />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold">
                  {comment.user?.name || "User"}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </span>
              </div>
              <p className="text-black whitespace-pre-wrap">{comment.text}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/**
 * クライアントコンポーネント (メイン)
 * サーバーから受け取った初期データを表示し、
 * クライアントサイドでのみ必要な処理（いいね、コメントSWR）を行う
 */
export default function ArticleDetailClient({
  initialArticle,
}: {
  initialArticle: Article;
}) {
  const { mutate: globalMutate } = useSWRConfig();

  // いいね成功時のコールバック
  const handleLikeSuccess = () => {
    // タイムラインのキャッシュを再検証 (いいねソートやいいね一覧のため)
    globalMutate(
      (key: string) => typeof key === "string" && key.startsWith("/api/posts"),
      undefined,
      { revalidate: true }
    );

    // (この記事自体のデータは、ArticleCardコンポーネント内の楽観的UIで更新される)
  };

  return (
    <>
      {/* サーバーから受け取った初期データを ArticleCard に渡す */}
      <ArticleCard article={initialArticle} onLikeSuccess={handleLikeSuccess} />

      {/* コメントリスト（SWRでクライアントで取得） */}
      <CommentList articleId={initialArticle.id} />
    </>
  );
}
