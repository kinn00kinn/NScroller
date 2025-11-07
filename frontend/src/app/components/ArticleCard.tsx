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
  tutorialIds?: TutorialIds; // ★ 2. tutorialIds を Props に追加
};

type TutorialIds = {
  like: string;
  bookmark: string;
  comment: string;
  share: string;
};

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
  const [copiedMD, setCopiedMD] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // ★ いいねのローカル状態 (APIからの 'article.is_liked' と 'article.like_num' を初期値とする)
  const [isLiked, setIsLiked] = useState(article.is_liked);
  const [likeCount, setLikeCount] = useState(article.like_num || 0);
  const [isBookmarked, setIsBookmarked] = useState(article.is_bookmarked);
  const { data: session, status } = useSession();
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);

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
  // ★ 7. いいねクリック処理 (修正)
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "loading" || isAnimatingLike) return; // ★ アニメーション中はクリックを無効化

    if (!session) {
      alert("いいね機能を利用するにはログインが必要です。");
      signIn("google");
      return;
    }

    // 楽観的UI
    const newIsLiked = !isLiked;
    if (newIsLiked) {
      setIsAnimatingLike(true); // ★ アニメーション開始
    }
    setIsLiked(newIsLiked);
    setLikeCount((prevCount) => prevCount + (newIsLiked ? 1 : -1));
    const action = newIsLiked ? "like" : "unlike";

    // ★ GIFアニメーションの再生時間（仮に1秒=1000ms）後にアニメーション状態を解除
    // (実際のGIFの長さに合わせて調整してください)
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
      setLikeCount(result.new_like_num);
      onLikeSuccess();
    } catch (error) {
      console.error("いいねの更新に失敗しました:", error);
      // エラー時はUIを元に戻す
      setIsAnimatingLike(false); // ★ アニメーションを即時停止
      setIsLiked(!newIsLiked);
      setLikeCount((prevCount) => prevCount - (newIsLiked ? 1 : -1));
    }
  };

  // ★ いいねアイコンのソースを決定するロジック
  let currentLikeIconSrc: string;
  if (isAnimatingLike && isLiked) {
    currentLikeIconSrc = "/like_anime_up.gif";
  } else {
    currentLikeIconSrc = isLiked ? "/like_on.png" : "/like_off.png";
  }

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
      {/* ★ 1. ルート要素を <Link> から <div> に変更 */}
      <div className="block w-full p-4 border-b-2 border-black bg-white transition-colors duration-150 hover:bg-gray-50">
        <div className="flex space-x-3">
          {/* 左側: アイコン (変更なし) */}
          <div className="flex-shrink-0 w-12 h-12 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 overflow-hidden">
            <img src="/favicon.ico" alt="icon" />
          </div>

          <div className="flex-1 min-w-0">
            {/* ★ 2. 外部サイトへの <a> リンク (ネスト解消) */}
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

            {/* ★ 3. 内部詳細ページへの <Link> をここに追加 */}
            <Link
              href={`/article/${article.id}`}
              className="block"
              aria-label={article.title} // スクリーンリーダー用にタイトルをラベルとして追加
            >
              {/* 画像 */}
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
            {/* ★ 4. 内部 <Link> をここで閉じる */}

            {/* 下部 (ボタンと時間) (★ Link の外に配置) */}
            <div className="mt-4 flex items-center justify-between text-black">
              {/* 左側: ボタン */}
              <div className="flex items-center space-x-4">
                {/* 1. 返信ボタン (★ ID追加) */}
                <button
                  // id={tutorialIds?.comment}
                  id={tutorialIds?.comment} // ★ 1. ID を <button> に設定し直す
                  // onClick={handleCommentClick} // ★ Linkの外になったので、onClickは不要 (Linkの中に入れる)
                  className="flex items-center space-x-1 text-black hover:text-gray-600"
                  aria-label="返信"
                  // ★ 5. ボタン自体もLinkにするか、Linkの中に入れる
                  //    ここでは Link の中（詳細ページへの導線）として扱う
                  //    ただし、クリックイベントは止めない
                  onClick={(e) => {
                    /* e.stopPropagation() しない */
                  }}
                >
                  <Link
                    // id={tutorialIds?.comment}
                    href={`/article/${article.id}`}
                    // ★ 1. `inline-flex` と `items-center` を追加して、IDの範囲をアイコンと数字全体にする
                    className="inline-flex items-center space-x-1" 
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <MessageCircle size={18} />
                    <span className="text-sm">
                      {article.comments?.length || 0}
                    </span>
                  </Link>
                </button>

                {/* 2. 共有 (モーダル) */}
                <button
                  id={tutorialIds?.share}
                  onClick={handleNativeShareOrModal}
                  className="p-2 rounded-full transition-colors duration-150 text-black hover:bg-gray-200"
                  aria-label="共有"
                >
                  <Send size={18} />
                </button>

                {/* 3. いいねボタン */}
                <button
                  id={tutorialIds?.like}
                  onClick={handleLikeClick}
                  className={`flex items-center space-x-1 transition-colors duration-150 ${
                    isLiked ? "text-red-500" : "text-black hover:text-gray-600"
                  }`}
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

              {/* 右側: 時間 */}
              <span className="text-sm text-gray-500 flex-shrink-0">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* ★ 1. 終了タグを </div> に変更 */}

      {/* --- 2. 共有モーダル (変更なし) --- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => handleCloseModal()}
          role="presentation"
          onKeyDown={() => {}}
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
                <Send size={20} />
                <span>{urlCopied ? "コピーしました！" : "URLをコピー"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
