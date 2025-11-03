"use client";

import type { Article } from "@/app/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Share2,
  X,
  User,
  Twitter, // ★ Twitterアイコンをインポート
  Facebook, // ★ Facebookアイコンをインポート
  MessageSquare, // ★ LINEの代わりとしてMessageSquareをインポート
  Send
} from "lucide-react";
import { useState, useEffect } from "react";

type ArticleCardProps = {
  article: Article & { summary?: string | null };
};

export default function ArticleCard({ article }: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: ja,
  });

  // --- 動的スタイルロジック ---
  const hasSummary = article.summary && article.summary.length > 0;
  const titleLineClamp = hasSummary ? "line-clamp-1" : "line-clamp-2";

  // --- 状態管理 ---
  const [copiedMD, setCopiedMD] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      "canShare" in navigator
    ) {
      setCanNativeShare(true);
    }
  }, []);

  // --- イベントハンドラ ---

  // 1. Markdownリンクのコピー処理
  const handleShareMDClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const markdownLink = `[${article.title}](${article.article_url})`;
    try {
      await navigator.clipboard.writeText(markdownLink);
      setCopiedMD(true);
      setTimeout(() => setCopiedMD(false), 2000);
    } catch (err) {
      console.error("Markdownリンクのコピーに失敗しました:", err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = markdownLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopiedMD(true);
        setTimeout(() => setCopiedMD(false), 2000);
      } catch (copyErr) {
        console.error("フォールバックコピーにも失敗しました:", copyErr);
      }
    }
  };

  // 2. ネイティブ共有 または モーダルを開く処理
  const handleNativeShareOrModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: article.title,
      text: article.summary || article.title,
      url: article.article_url,
    };

    if (canNativeShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Web Share API が失敗しました:", err);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  // 3. 共有モーダルを閉じる処理
  const handleCloseModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsModalOpen(false);
    setUrlCopied(false);
  };

  // 4. モーダル内でURLをコピーする処理
  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(article.article_url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error("URLのコピーに失敗しました:", err);
      try {
        const input = (e.target as HTMLElement)
          .closest(".flex")
          ?.querySelector("input");
        if (input) {
          input.select();
          document.execCommand("copy");
          setUrlCopied(true);
          setTimeout(() => setUrlCopied(false), 2000);
        }
      } catch (copyErr) {
        console.error("フォールバックコピーにも失敗しました:", copyErr);
      }
    }
  };

  // 5. 画像読み込みエラーハンドラ
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.currentTarget as HTMLImageElement;
    target.src =
      "https://placehold.co/700x400/eeeeee/aaaaaa?text=Image+Not+Found";
    target.onerror = null;
  };

  // ★ 6. SNS共有リンク生成関数
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

  return (
    <>
      {/* --- 1. 記事カード本体 --- */}
      <a
        href={article.article_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full p-4 border-b-2 border-black bg-white transition-colors duration-150 hover:bg-gray-50"
      >
        <div className="flex space-x-3">
          {/* ★ 左側: アイコン (黒枠とサイズ調整) */}
          <div className="flex-shrink-0 w-12 h-12 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 overflow-hidden">
            {/* UserCircle を親要素のサイズいっぱいに広げる */}
            {/* <User size="150%" className="text-gray-500" strokeWidth={1.5} /> */}
            <img src="./favicon.ico" alt="" />
          </div>

          {/* 右側: コンテンツ */}
          <div className="flex-1 min-w-0">
            {/* 上部: ユーザー名 */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <span className="font-bold text-lg text-black truncate">
                {article.source_name}
              </span>
            </div>

            {/* 画像 (あれば表示) (★ <img> に変更) */}
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
                <p className="text-gray-700 line-clamp-2">{article.summary}</p>
              )}
            </div>

            {/* 下部 (ボタンと時間) */}
            <div className="mt-4 flex items-center justify-between text-black">
              {/* 左側: 共有ボタン */}
              <div className="flex items-center space-x-4">
                {/* 1. 共有ボタン (MD) */}
                <button
                  onClick={handleShareMDClick}
                  disabled={copiedMD}
                  className={`flex items-center space-x-1 transition-colors duration-150 ${
                    copiedMD
                      ? "text-green-600"
                      : "text-black hover:text-gray-600 cursor-pointer"
                  }`}
                >
                  <Share2 size={18} />
                  <span className="text-sm">
                    {copiedMD ? "コピーしました！" : "共有 (MD)"}
                  </span>
                </button>

                {/* 2. 共有ボタン (ネイティブ or モーダル) */}
                <button
                  onClick={handleNativeShareOrModal}
                  className="p-2 rounded-full transition-colors duration-150 text-black hover:bg-gray-200"
                  aria-label="共有"
                >
                  <Send size={18} />
                </button>
              </div>

              {/* 右側: 時間 */}
              <span className="text-sm text-gray-500 flex-shrink-0">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
      </a>

      {/* --- 2. 共有モーダル (フォールバック用 & SNS共有) --- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => handleCloseModal()}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">共有</h3>
              <button
                onClick={() => handleCloseModal()}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
                aria-label="閉じる"
              >
                <X size={24} />
              </button>
            </div>

            {/* コンテンツ */}
            {/* URLコピーセクション */}
            <p className="text-sm text-gray-600 mb-2">リンクをコピー</p>
            <div className="flex space-x-2 mb-6">
              <input
                type="text"
                readOnly
                value={article.article_url}
                className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-100 text-black"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={handleCopyUrl}
                className={`px-4 py-2 rounded-md font-semibold text-white transition-colors ${
                  urlCopied
                    ? "bg-green-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {urlCopied ? "コピー済み" : "コピー"}
              </button>
            </div>

            {/* ★ SNS共有セクション */}
            <p className="text-sm text-gray-600 mb-2">SNSで共有</p>
            <div className="flex space-x-4 justify-center">
              {/* Twitter */}
              <a
                href={getTwitterShareUrl(article.title, article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={handleCloseModal} // 共有後モーダルを閉じる
              >
                <Twitter size={32} className="text-blue-400" />
                <span className="text-xs text-gray-600 mt-1">Twitter</span>
              </a>

              {/* Facebook */}
              <a
                href={getFacebookShareUrl(article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={handleCloseModal} // 共有後モーダルを閉じる
              >
                <Facebook size={32} className="text-blue-600" />
                <span className="text-xs text-gray-600 mt-1">Facebook</span>
              </a>

              {/* LINE */}
              <a
                href={getLineShareUrl(article.title, article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={handleCloseModal} // 共有後モーダルを閉じる
              >
                <MessageSquare size={32} className="text-green-500" />
                <span className="text-xs text-gray-600 mt-1">LINE</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

