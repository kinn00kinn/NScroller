// frontend/src/app/components/ArticleCard.tsx
"use client";

// ★ 型定義を修正
import type { Article, Comment } from "@/app/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Share2,
  X,
  User,
  Twitter,
  Facebook,
  MessageSquare,
  Send,
  Heart,
  Bookmark,
  MessageCircle, // ★ 返信アイコン
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link"; // ★ Link をインポート
import Image from "next/image"; // ★ Image をインポート
import { KeyedMutator } from "swr"; // ★ SWRのmutate型

type ArticleCardProps = {
  article: Article;
  // ★ SWRのmutate関数を受け取る (タイムライン全体を再検証するため)
  onLikeSuccess: () => void;
};

export default function ArticleCard({
  article,
  onLikeSuccess,
}: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: ja,
  });

  const hasSummary = article.summary && article.summary.length > 0;
  const titleLineClamp = hasSummary ? "line-clamp-1" : "line-clamp-3";

  // --- 状態管理 ---
  const [copiedMD, setCopiedMD] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // ★ いいねのローカル状態 (APIからの 'article.is_liked' と 'article.like_num' を初期値とする)
  const [isLiked, setIsLiked] = useState(article.is_liked);
  const [likeCount, setLikeCount] = useState(article.like_num || 0);
  const [isBookmarked, setIsBookmarked] = useState(article.is_bookmarked);
  const { data: session, status } = useSession();

  // ★ APIからのpropsが変更されたら、ローカルのいいね状態も同期する
  useEffect(() => {
    setIsLiked(article.is_liked);
    setLikeCount(article.like_num || 0);
    setIsBookmarked(article.is_bookmarked); // ★★★ 追加 ★★★
  }, [article.is_liked, article.like_num, article.is_bookmarked]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanNativeShare(true);
    }
  }, []);

  // --- イベントハンドラ ---
  // (1. handleShareMDClick, 2. handleNativeShareOrModal, 3. handleCloseModal, 4. handleCopyUrl, 5. handleImageError, 6. SNS共有リンク ... 変更なし)
  // ... (省略) ...
  const handleShareMDClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); /* ... */
  };
  const handleNativeShareOrModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); /* ... */
  };
  const handleCloseModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsModalOpen(false);
    setUrlCopied(false);
  };
  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation(); /* ... */
  };
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    (e.currentTarget as HTMLImageElement).src =
      "https://placehold.co/700x400/eeeeee/aaaaaa?text=Image+Not+Found";
  };
  const getTwitterShareUrl = (title: string, url: string) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      title
    )}&url=${encodeURIComponent(url)}`;
  const getFacebookShareUrl = (url: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const getLineShareUrl = (title: string, url: string) =>
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(title)}`;

  // ★ 7. いいねクリック処理 (修正)
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "loading") return;

    if (!session) {
      alert("いいね機能を利用するにはログインが必要です。");
      signIn("google");
      return;
    }

    // 楽観的UI
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prevCount) => prevCount + (newIsLiked ? 1 : -1));
    const action = newIsLiked ? "like" : "unlike";

    try {
      const response = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: article.id,
          action: action,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const result = await response.json();

      // ★ サーバーからの最新のいいね数でローカルを同期 (念のため)
      setLikeCount(result.new_like_num);

      // ★ SWRキャッシュを再検証 (タイムライン全体)
      // これにより、他のSWRフック(例: my-likesページ)も自動で更新される
      onLikeSuccess();
    } catch (error) {
      console.error("いいねの更新に失敗しました:", error);
      // エラー時はUIを元に戻す
      setIsLiked(!newIsLiked);
      setLikeCount((prevCount) => prevCount - (newIsLiked ? 1 : -1));
    }
  };

  // ★ 8. 返信アイコンクリック (何もしないが、親のリンクを無効化)
  const handleCommentClick = (e: React.MouseEvent) => {
    // このボタンは記事詳細ページへのリンクを起動するだけ
    // (ただし、e.stopPropagation() はしないでおく)
    // e.preventDefault();
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "loading") return;

    if (!session) {
      alert("ブックマーク機能を利用するにはログインが必要です。");
      signIn("google");
      return;
    }

    // 楽観的UI
    const newIsBookmarked = !isBookmarked;
    setIsBookmarked(newIsBookmarked);
    const action = newIsBookmarked ? "bookmark" : "unbookmark";

    try {
      const response = await fetch("/api/bookmark", {
        // ★ APIパス
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: article.id,
          action: action,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      // ★ SWRキャッシュを再検証 (タイムライン全体)
      // (onLikeSuccess は 'onActionSuccess' にリネームした方が良いが、
      //  ここではいいねの関数をそのまま流用)
      onLikeSuccess();
    } catch (error) {
      console.error("ブックマークの更新に失敗しました:", error);
      // エラー時はUIを元に戻す
      setIsBookmarked(!newIsBookmarked);
    }
  };

  return (
    <>
      {/* --- 1. 記事カード本体 --- */}
      {/* ★ リンク先を記事詳細ページに変更 */}
      <Link
        href={`/article/${article.id}`}
        className="block w-full p-4 border-b-2 border-black bg-white transition-colors duration-150 hover:bg-gray-50"
      >
        <div className="flex space-x-3">
          {/* 左側: アイコン (変更なし) */}
          <div className="flex-shrink-0 w-12 h-12 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 overflow-hidden">
            <img src="/favicon.ico" alt="icon" />{" "}
            {/* public/favicon.ico を参照 */}
          </div>

          <div className="flex-1 min-w-0">
            {/* 上部: ユーザー名 (★ 外部サイトへのリンクに変更) */}
            <a
              href={article.article_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // ★ 親(Link)の遷移を止める
              className="inline-flex items-center space-x-2 text-sm text-gray-500 mb-2 hover:underline"
            >
              <span className="font-bold text-lg text-black truncate">
                {article.source_name}
              </span>
            </a>

            {/* 画像 (変更なし) */}
            {article.image_url && (
              <div className="mb-2 w-full border-2 border-black flex items-center justify-center overflow-hidden rounded-lg">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-auto object-cover max-h-96"
                  onError={handleImageError}
                />
              </div>
            )}

            {/* テキスト (タイトルと要約) (変更なし) */}
            <div className="space-y-1">
              <h2 className={`text-xl font-bold ${titleLineClamp}`}>
                {article.title}
              </h2>
              {hasSummary && (
                <p className="text-gray-700 line-clamp-2">{article.summary}</p>
              )}
            </div>

            {/* ★ 9. コメントプレビュー (新設) */}
            {article.comments && article.comments.length > 0 && (
              <div className="mt-3 space-y-2 pr-4">
                {article.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    {comment.user?.image ? (
                      <Image
                        src={comment.user.image}
                        alt={comment.user.name || "avatar"}
                        width={20}
                        height={20}
                        className="rounded-full mt-1"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                        <User size={12} />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-black">
                        {comment.user?.name || "User"}
                      </span>
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 下部 (ボタンと時間) */}
            <div className="mt-4 flex items-center justify-between text-black">
              {/* 左側: ボタン */}
              <div className="flex items-center space-x-4">
                {/* 1. 返信ボタン (★ 新設) */}
                <button
                  // onClick={handleCommentClick}
                  className="flex items-center space-x-1 text-black hover:text-gray-600"
                  aria-label="返信"
                >
                  <MessageCircle size={18} />
                  <span className="text-sm">
                    {article.comments?.length || 0}
                  </span>
                </button>

                {/* 2. 共有 (MD) */}
                {/* <button
                  onClick={handleShareMDClick}
                  disabled={copiedMD}
                  className={`flex items-center space-x-1 transition-colors duration-150 ${
                    copiedMD
                      ? "text-green-600"
                      : "text-black hover:text-gray-600"
                  }`}
                >
                  <Share2 size={18} />
                  <span className="text-sm hidden sm:inline">
                    {" "}
                    {/* ★ SPでは非表示 */}
                    {/* {copiedMD ? "コピー!" : "共有 (MD)"} */}
                  {/* </span> */}
                {/* </button> */} 

                {/* 3. 共有 (モーダル) */}
                <button
                  onClick={handleNativeShareOrModal}
                  className="p-2 rounded-full transition-colors duration-150 text-black hover:bg-gray-200"
                  aria-label="共有"
                >
                  <Send size={18} />
                </button>

                {/* 4. いいねボタン (★ 状態管理を修正) */}
                <button
                  onClick={handleLikeClick}
                  className={`flex items-center space-x-1 transition-colors duration-150 ${
                    isLiked
                      ? "text-red-500 hover:text-red-700"
                      : "text-black hover:text-gray-600"
                  }`}
                  aria-label="いいね"
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                  <span className="text-sm">{likeCount}</span>
                </button>
                {/* ★★★ 5. ブックマークボタン (新規追加) ★★★ */}
                <button
                  onClick={handleBookmarkClick}
                  className={`flex items-center space-x-1 transition-colors duration-150 ${
                    isBookmarked
                      ? "text-blue-500 hover:text-blue-700"
                      : "text-black hover:text-gray-600"
                  }`}
                  aria-label="ブックマーク"
                >
                  <Bookmark
                    size={18}
                    fill={isBookmarked ? "currentColor" : "none"}
                  />
                </button>
              </div>

              {/* 右側: 時間 (変更なし) */}
              <span className="text-sm text-gray-500 flex-shrink-0">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* --- 2. 共有モーダル (変更なし) --- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => handleCloseModal()}
        >
          {/* ... モーダルの中身 (省略) ... */}
        </div>
      )}
    </>
  );
}
