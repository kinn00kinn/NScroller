// frontend/src/app/components/ArticleCard.tsx
"use client";

import type { Article } from "@/app/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { X, User, Twitter, Facebook, MessageSquare } from "lucide-react"; // ★ 不要なインポートを削除
import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
// ★ KeyedMutator は使われていないため削除

type ArticleCardProps = {
  article: Article;
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
  tutorialIds,
}: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: ja,
  });

  const hasSummary = article.summary && article.summary.length > 0;
  const titleLineClamp = hasSummary ? "line-clamp-1" : "line-clamp-3";

  // --- 状態管理 ---
  // ★ copiedMD を削除
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const [isLiked, setIsLiked] = useState(article.is_liked);
  const [likeCount, setLikeCount] = useState(article.like_num || 0);
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);

  // ★ ブックマーク用の state を追加
  const [isBookmarked, setIsBookmarked] = useState(article.is_bookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(article.bookmark_num || 0); // ★ 追加
  const [isAnimatingBookmark, setIsAnimatingBookmark] = useState(false); // ★ 追加

  const { data: session, status } = useSession();

  // ★ APIからのpropsが変更されたら、ローカルの状態も同期する
  useEffect(() => {
    setIsLiked(article.is_liked);
    setLikeCount(article.like_num || 0);
    setIsBookmarked(article.is_bookmarked);
    setBookmarkCount(article.bookmark_num || 0); // ★ 追加
  }, [
    article.is_liked,
    article.like_num,
    article.is_bookmarked,
    article.bookmark_num, // ★ 追加
  ]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanNativeShare(true);
    }
  }, []);

  // --- イベントハンドラ ---
  // ★ 共有ロジックを改善
  const handleCloseModal = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsModalOpen(false);
    setUrlCopied(false);
  }, []); // 依存配列は空

  // ★ (A11y改善) Escapeキーでモーダルを閉じる
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // クリーンアップ
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, handleCloseModal]); // ★ 依存配列に handleCloseModal を追加

  const handleNativeShareOrModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // ★ 共有テキストを作成
    const shareText = `${article.title}\n${shareTextSuffix}`;

    if (canNativeShare) {
      try {
        await navigator.share({
          text: shareText, // ★ title ではなく text に接尾辞を含める
          url: article.article_url,
        });
      } catch (error: any) {
        // ★ ユーザーが共有をキャンセルした場合 (AbortError) はモーダルを出さない
        if (error.name !== "AbortError") {
          console.error("Native share failed:", error);
          setIsModalOpen(true); // その他のエラーの場合のみモーダルを開く
        }
      }
    } else {
      // ネイティブシェア非対応ならモーダルを開く
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

  // ★ Twitter 共有URL (接尾辞を追加)
  const getTwitterShareUrl = (title: string, url: string) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      title + shareTextSuffix
    )}&url=${encodeURIComponent(url)}`;

  // ★ Facebook 共有URL (ハッシュタグを追加)
  const getFacebookShareUrl = (url: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}&hashtag=${encodeURIComponent("PanDo")}`; // ★ #PanDo

  // ★ LINE 共有URL (接尾辞を追加)
  const getLineShareUrl = (title: string, url: string) =>
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(title + shareTextSuffix)}`;

  // ★ 7. いいねクリック処理 (変更なし)
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "loading" || isAnimatingLike) return;

    if (!session) {
      alert("いいね機能を利用するにはログインが必要です。");
      signIn("google");
      return;
    }

    // 楽観的UI
    const newIsLiked = !isLiked;
    if (newIsLiked) {
      setIsAnimatingLike(true);
    }
    setIsLiked(newIsLiked);
    setLikeCount((prevCount) => prevCount + (newIsLiked ? 1 : -1));
    const action = newIsLiked ? "like" : "unlike";

    if (newIsLiked) {
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
      setLikeCount(result.new_like_num); // ★ APIからの値で確定
      onLikeSuccess();
    } catch (error) {
      console.error("いいねの更新に失敗しました:", error);
      // エラー時はUIを元に戻す
      setIsAnimatingLike(false);
      setIsLiked(!newIsLiked);
      setLikeCount((prevCount) => prevCount - (newIsLiked ? 1 : -1));
    }
  };

  // ★ いいねアイコンのソースを決定するロジック (変更なし)
  let currentLikeIconSrc: string;
  if (isAnimatingLike && isLiked) {
    currentLikeIconSrc = "icon/like_anime_up.gif"; // アニメーション中
  } else {
    currentLikeIconSrc = isLiked ? "icon/like_on.png" : "icon/like_off.png"; // オン/オフ
  }

  // ★ 8. 返信アイコンクリック (削除)
  // const handleCommentClick = (e: React.MouseEvent) => {};

  // ★ 9. ブックマーククリック処理 (いいねと同様に修正)
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "loading" || isAnimatingBookmark) return; // ★ アニメーション中は無効

    if (!session) {
      alert("ブックマーク機能を利用するにはログインが必要です。");
      signIn("google");
      return;
    }

    // 楽観的UI
    const newIsBookmarked = !isBookmarked;
    if (newIsBookmarked) {
      setIsAnimatingBookmark(true); // ★ アニメーション開始
    }
    setIsBookmarked(newIsBookmarked);
    setBookmarkCount((prevCount) => prevCount + (newIsBookmarked ? 1 : -1)); // ★ カウントも更新
    const action = newIsBookmarked ? "bookmark" : "unbookmark";

    // ★ アニメーション停止タイマー
    if (newIsBookmarked) {
      const ANIMATION_DURATION = 1000; // (仮のGIFの長さに合わせる)
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
      setBookmarkCount(result.new_bookmark_num); // ★ APIからの値で確定
      onLikeSuccess();
    } catch (error) {
      console.error("ブックマークの更新に失敗しました:", error);
      // エラー時はUIを元に戻す
      setIsAnimatingBookmark(false); // ★ アニメーション停止
      setIsBookmarked(!newIsBookmarked);
      setBookmarkCount((prevCount) => prevCount - (newIsBookmarked ? 1 : -1)); // ★ ロールバック
    }
  };

  // ★ ブックマークアイコンのソースを決定するロジック (追加)
  let currentBookmarkIconSrc: string;
  if (isAnimatingBookmark && isBookmarked) {
    // (※画像パスは仮のものです。実際のファイルパスに合わせてください)
    currentBookmarkIconSrc = "icon/bookmark_anime_up.gif"; // アニメーション中
  } else {
    currentBookmarkIconSrc = isBookmarked
      ? "icon/bookmark_on.png" // オン
      : "icon/bookmark_off.png"; // オフ
  }

  return (
    <>
      <div className="block w-full p-4 border-b-2 border-black bg-white transition-colors duration-150 hover:bg-gray-50">
        <div className="flex space-x-3">
          {/* 左側: アイコン (favicon.ico を使用) */}
          <div className="flex-shrink-0 w-12 h-12 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 overflow-hidden">
            {/* ★ /favicon.ico を <Image> に変更 */}
            <Image src="/favicon.ico" alt="icon" width={32} height={32} />
          </div>

          <div className="flex-1 min-w-0">
            {/* 外部サイトへの <a> リンク */}
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

            {/* 内部詳細ページへの <Link> */}
            <Link
              href={`/article/${article.id}`}
              className="block"
              aria-label={article.title}
            >
              {/* 画像 */}
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

              {/* テキスト (タイトルと要約) */}
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

              {/* コメントプレビュー (Userアイコンはlucideのまま) */}
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
            </Link>

            {/* 下部 (ボタンと時間) */}
            <div className="mt-4 flex items-center justify-between text-black">
              {/* 左側: ボタン */}
              <div className="flex items-center space-x-4">
                {/* 1. 返信ボタン (画像化) */}
                <Link
                  id={tutorialIds?.comment}
                  href={`/article/${article.id}`}
                  className="inline-flex items-center space-x-1 text-black hover:text-gray-600"
                  aria-label="返信"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* ★ Image に変更 (仮パス) */}
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

                {/* 2. 共有 (モーダル) (画像化) */}
                <button
                  id={tutorialIds?.share}
                  onClick={handleNativeShareOrModal}
                  className="p-2 rounded-full transition-colors duration-150 text-black hover:bg-gray-200"
                  aria-label="共有"
                >
                  {/* ★ Image に変更 (仮パス) */}
                  <Image
                    src="/icon/send.png"
                    alt="共有"
                    width={18}
                    height={18}
                  />
                </button>

                {/* 3. いいねボタン (画像実装のまま) */}
                <button
                  id={tutorialIds?.like}
                  onClick={handleLikeClick}
                  className="flex items-center space-x-1" // ★ 色指定を削除
                  aria-label="いいね"
                >
                  <div className="w-[18px] h-[18px] flex items-center justify-center">
                    <Image
                      src={currentLikeIconSrc}
                      alt="いいね"
                      width={18}
                      height={18}
                      key={currentLikeIconSrc} // アニメーションGIFのリロード用
                      unoptimized // GIFアニメーションのため
                    />
                  </div>
                  <span className="text-sm">{likeCount}</span>
                </button>

                {/* 4. ブックマークボタン (★ 画像化) */}
                <button
                  id={tutorialIds?.bookmark}
                  onClick={handleBookmarkClick}
                  className="flex items-center space-x-1" // ★ 色指定を削除
                  aria-label="ブックマーク"
                >
                  {/* ★ Image に変更 */}
                  <div className="w-[20px] h-[20px] flex items-center justify-center">
                    <Image
                      src={currentBookmarkIconSrc}
                      alt="ブックマーク"
                      width={18}
                      height={18}
                      key={currentBookmarkIconSrc} // アニメーションGIFのリロード用
                      unoptimized // GIFアニメーションのため
                    />
                  </div>
                  {/* ★ ブックマークカウントを追加 */}
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

      {/* --- 2. 共有モーダル (アイコンはlucideのまま) --- */}
      {isModalOpen && (
        // ★ ESLint A11y Warning対応:
        // モーダル背景クリックは補助的な機能であり、
        // メインの閉じるボタン(X)があるため、ルールを無効化
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
                記事を共有
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
                <span>X (Twitter) で共有</span>
              </a>
              <a
                href={getFacebookShareUrl(article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
              >
                <Facebook size={20} />
                <span>Facebook で共有</span>
              </a>
              <a
                href={getLineShareUrl(article.title, article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
              >
                <MessageSquare size={20} />
                <span>LINE で共有</span>
              </a>
              <button
                onClick={handleCopyUrl}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg text-left"
              >
                <Image
                  src="/icons/share.svg"
                  alt="URLをコピー"
                  width={20}
                  height={20}
                />
                <span>{urlCopied ? "コピーしました！" : "URLをコピー"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
