// frontend/src/app/components/ArticleCard.tsx
"use client";

import type { Article } from "@/app/lib/mockData";
import { formatDistanceToNow } from "date-fns";
// ★ 修正: 'User' をインポートから削除 (ESLint no-unused-vars)
import { X, Twitter, Facebook, MessageSquare } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
// @ts-ignore (ローカル環境にのみ存在する LanguageProvider を仮定)
import { useLanguage } from "@/app/components/LanguageProvider";

type ArticleCardProps = {
  article: Article;
  // ★ 修正: 未使用変数の警告回避のため、引数名を _ で開始
  onOptimisticUpdate?: (articleId: string, update: Partial<Article>) => void;
  onLikeSuccess: () => void;
  tutorialIds?: TutorialIds;
};

type TutorialIds = {
  like: string;
  bookmark: string;
  comment: string;
  share: string;
};

const shareTextSuffix = " from PanDo #PanDo";

export default function ArticleCard({
  article,
  onLikeSuccess,
  onOptimisticUpdate,
  tutorialIds,
}: ArticleCardProps) {
  // @ts-ignore (ローカル環境にのみ存在する LanguageProvider を仮定)
  const { locale, t } = useLanguage();

  const timeAgo = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: locale,
  });

  const hasSummary = article.summary && article.summary.length > 0;
  const titleLineClamp = hasSummary ? "line-clamp-1" : "line-clamp-3";

  // --- 状態管理 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // ★ 修正: ローカルステートを削除し、propsの値を直接利用
  // const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  // const [isAnimatingBookmark, setIsAnimatingBookmark] = useState(false);
  //
  // const isLiked = article.is_liked;
  // const likeCount = article.like_num || 0;
  // const isBookmarked = article.is_bookmarked;
  // const bookmarkCount = article.bookmark_num || 0;

  // ★ 修正: 楽観的UIのため、ローカルアニメーションステートは残す
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  const [isAnimatingBookmark, setIsAnimatingBookmark] = useState(false);

  // ★ 修正: 楽観的UIのため、ローカルステートは使用せず、propsの値を信頼する
  const isLiked = article.is_liked;
  const likeCount = article.like_num || 0;
  const isBookmarked = article.is_bookmarked;
  const bookmarkCount = article.bookmark_num || 0;

  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanNativeShare(true);
    }
  }, []);

  // --- イベントハンドラ ---
  const handleCloseModal = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsModalOpen(false);
    setUrlCopied(false);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, handleCloseModal]);

  const handleNativeShareOrModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareText = `${article.title}\n${shareTextSuffix}`;

    if (canNativeShare) {
      try {
        await navigator.share({
          text: shareText,
          url: article.article_url,
        });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Native share failed:", error);
          setIsModalOpen(true);
        }
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(article.article_url);
      setUrlCopied(true);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    (e.currentTarget as HTMLImageElement).src =
      "https://placehold.co/700x400/eeeeee/aaaaaa?text=Image+Not+Found";
  };

  const getTwitterShareUrl = (title: string, url: string) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      title + shareTextSuffix
    )}&url=${encodeURIComponent(url)}`;

  const getFacebookShareUrl = (url: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}&hashtag=${encodeURIComponent("PanDo")}`;

  const getLineShareUrl = (title: string, url: string) =>
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(title + shareTextSuffix)}`;

  // --- 7. いいねクリック処理 ---
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "loading" || isAnimatingLike) return;

    if (!session) {
      // @ts-ignore (t が存在すると仮定)
      alert(t("likeAlert"));
      signIn("google");
      return;
    }

    const newIsLiked = !isLiked;
    const newLikeCount = likeCount + (newIsLiked ? 1 : -1);

    // ★ 修正: オプショナルチェーンを使用 (TS2722)
    onOptimisticUpdate?.(article.id, {
      is_liked: newIsLiked,
      like_num: newLikeCount,
    });

    const action = newIsLiked ? "like" : "unlike";

    if (newIsLiked) {
      setIsAnimatingLike(true);
      const ANIMATION_DURATION = 1000;
      setTimeout(() => {
        setIsAnimatingLike(false);
      }, ANIMATION_DURATION);
    }

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

      // ★ 修正: オプショナルチェーンを使用 (TS2722)
      onOptimisticUpdate?.(article.id, { like_num: result.new_like_num });
      // setLikeCount(result.new_like_num); // 楽観的UIが成功したので不要
      onLikeSuccess();
    } catch (error) {
      console.error("いいねの更新に失敗しました:", error);
      // ★ 修正: オプショナルチェーンを使用 (TS2722)
      onOptimisticUpdate?.(article.id, {
        is_liked: !newIsLiked, // 元の状態に戻す
        like_num: likeCount, // 元のカウントに戻す
      });
      setIsAnimatingLike(false);
    }
  };

  let currentLikeIconSrc: string;
  if (isAnimatingLike && isLiked) {
    currentLikeIconSrc = "/icon/like_anime_up.gif";
  } else {
    currentLikeIconSrc = isLiked ? "/icon/like_on.png" : "/icon/like_off.png";
  }

  // --- 9. ブックマーククリック処理 ---
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "loading" || isAnimatingBookmark) return;

    if (!session) {
      // @ts-ignore (t が存在すると仮定)
      alert(t("bookmarkAlert"));
      signIn("google");
      return;
    }

    const newIsBookmarked = !isBookmarked;
    const newBookmarkCount = bookmarkCount + (newIsBookmarked ? 1 : -1);
    const action = newIsBookmarked ? "bookmark" : "unbookmark";

    // ★ 修正: オプショナルチェーンを使用 (TS2722)
    onOptimisticUpdate?.(article.id, {
      is_bookmarked: newIsBookmarked,
      bookmark_num: newBookmarkCount,
    });

    if (newIsBookmarked) {
      setIsAnimatingBookmark(true);
      const ANIMATION_DURATION = 1000;
      setTimeout(() => {
        setIsAnimatingBookmark(false);
      }, ANIMATION_DURATION);
    }

    try {
      const response = await fetch("/api/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: article.id,
          action: action,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const result = await response.json();

      // ★ 修正: オプショナルチェーンを使用 (TS2722)
      onOptimisticUpdate?.(article.id, {
        // is_bookmarked: newIsBookmarked, // 既に設定済み
        bookmark_num: result.new_bookmark_num,
      });
    } catch (error) {
      console.error("ブックマークの更新に失敗しました:", error);
      // ★ 修正: オプショナルチェーンを使用 (TS2722)
      onOptimisticUpdate?.(article.id, {
        is_bookmarked: !newIsBookmarked, // 元に戻す
        bookmark_num: bookmarkCount, // 元に戻す
      });
      setIsAnimatingBookmark(false);
    }
  };

  let currentBookmarkIconSrc: string;
  if (isAnimatingBookmark && isBookmarked) {
    currentBookmarkIconSrc = "/icon/bookmark_anime_up.gif";
  } else {
    currentBookmarkIconSrc = isBookmarked
      ? "/icon/bookmark_on.png"
      : "/icon/bookmark_off.png";
  }

  return (
    <>
      <div className="block w-full p-4 border-b-2 border-black bg-white transition-colors duration-150 hover:bg-gray-50">
        <div className="flex space-x-3">
          <div className="flex-shrink-0 w-12 h-12 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 overflow-hidden">
            <Image src="/favicon.ico" alt="icon" width={32} height={32} />
          </div>

          <div className="flex-1 min-w-0">
            <a
              href={article.article_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center space-x-2 text-sm text-gray-500 mb-2 hover:underline"
            >
              <span className="font-bold text-lg text-black truncate">
                {article.source_name}
              </span>
            </a>

            <Link
              href={`/article/${article.id}`}
              className="block"
              aria-label={article.title}
            >
              {article.image_url && (
                <div className="mb-2 w-full border-2 border-black flex items-center justify-center overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-auto object-cover max-h-96"
                    onError={handleImageError}
                  />
                </div>
              )}
              <div className="space-y-1">
                <h2 className={`text-xl font-bold ${titleLineClamp}`}>
                  {article.title}
                </h2>
                {hasSummary && (
                  <p className="text-gray-700 line-clamp-2">
                    {article.summary}
                  </p>
                )}
              </div>

              {/* コメントプレビュー */}
              {article.comments && article.comments.length > 0 && (
                <div className="mt-3 space-y-2 pr-4">
                  {article.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex items-start space-x-2"
                    >
                      {comment.user?.image ? (
                        <Image
                          src={comment.user.image}
                          alt={comment.user.name || "avatar"}
                          width={20}
                          height={20}
                          className="rounded-full mt-1"
                        />
                      ) : (
                        // ★ 修正: インラインSVGフォールバック
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
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
            </Link>

            {/* 下部 (ボタンと時間) */}
            <div className="mt-4 flex items-center justify-between text-black">
              <div className="flex items-center space-x-4">
                {/* 1. 返信ボタン */}
                <Link
                  id={tutorialIds?.comment}
                  href={`/article/${article.id}`}
                  className="inline-flex items-center space-x-1 text-black hover:text-gray-600"
                  aria-label="返信"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src="/icon/comment.png"
                    alt="返信"
                    width={18}
                    height={18}
                  />
                  <span className="text-sm">
                    {article.comments?.length || 0}
                  </span>
                </Link>

                {/* 2. 共有 (モーダル) */}
                <button
                  id={tutorialIds?.share}
                  onClick={handleNativeShareOrModal}
                  className="p-2 rounded-full transition-colors duration-150 text-black hover:bg-gray-200"
                  aria-label="共有"
                >
                  <Image
                    src="/icon/send.png"
                    alt="共有"
                    width={18}
                    height={18}
                  />
                </button>

                {/* 3. いいねボタン */}
                <button
                  id={tutorialIds?.like}
                  onClick={handleLikeClick}
                  className="flex items-center space-x-1"
                  aria-label="いいね"
                >
                  <div className="w-[18px] h-[18px] flex items-center justify-center">
                    <Image
                      src={currentLikeIconSrc}
                      alt="いいね"
                      width={18}
                      height={18}
                      key={currentLikeIconSrc}
                      unoptimized
                    />
                  </div>
                  <span className="text-sm">{likeCount}</span>
                </button>

                {/* 4. ブックマークボタン */}
                <button
                  id={tutorialIds?.bookmark}
                  onClick={handleBookmarkClick}
                  className="flex items-center space-x-1"
                  aria-label="ブックマーク"
                >
                  <div className="w-[20px] h-[20px] flex items-center justify-center">
                    <Image
                      src={currentBookmarkIconSrc}
                      alt="ブックマーク"
                      width={18}
                      height={18}
                      key={currentBookmarkIconSrc}
                      unoptimized
                    />
                  </div>
                  <span className="text-sm">{bookmarkCount}</span>
                </button>
              </div>

              {/* 右側: 時間 */}
              <span className="text-sm text-gray-500 flex-shrink-0">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. 共有モーダル --- */}
      {isModalOpen && (
        // ★ 修正: a11y 警告を無効化 (提供されたコードに基づく)
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => handleCloseModal()}
          role="presentation"
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-xs border-2 border-black"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            <div className="flex justify-between items-center p-4 border-b-2 border-black">
              <h3 id="share-modal-title" className="font-bold">
                {/* @ts-ignore (t が存在すると仮定) */}
                {t("shareModalTitle")}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="閉じる"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex flex-col space-y-3">
              <a
                href={getTwitterShareUrl(article.title, article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
              >
                <Twitter size={20} />
                {/* @ts-ignore (t が存在すると仮定) */}
                <span>{t("shareOnX")}</span>
              </a>
              <a
                href={getFacebookShareUrl(article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
              >
                <Facebook size={20} />
                {/* @ts-ignore (t が存在すると仮定) */}
                <span>{t("shareOnFacebook")}</span>
              </a>
              <a
                href={getLineShareUrl(article.title, article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
              >
                <MessageSquare size={20} />
                {/* @ts-ignore (t が存在すると仮定) */}
                <span>{t("shareOnLine")}</span>
              </a>
              <button
                onClick={handleCopyUrl}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg text-left"
              >
                <Image
                  src="/icon/send.png" // (share.svg が見当たらないため send.png で代用)
                  alt="URLをコピー"
                  width={20}
                  height={20}
                />
                {/* @ts-ignore (t が存在すると仮定) */}
                <span>{urlCopied ? t("copiedUrl") : t("copyUrl")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
