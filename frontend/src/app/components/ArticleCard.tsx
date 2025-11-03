"use client";

import type { Article } from "@/app/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
// import Image from "next/image"; // ★ 削除 (標準の <img> に変更)
// import UserIcon from "./UserIcon"; // ★ 削除 (lucide-react の UserCircle に変更)
import { Share2, X, UserCircle } from "lucide-react"; // ★ UserCircle をインポート
import { useState, useEffect } from "react"; // ★ useEffect をインポート

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
  // ★ ネイティブ共有APIがサポートされているかどうかの状態
  const [canNativeShare, setCanNativeShare] = useState(false);

  // ★ 修正: "in" を使ってプロパティの存在をチェック (TypeScript linter 対策)
  // ブラウザ側でのみ navigator をチェックするために useEffect を使用
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      "canShare" in navigator
    ) {
      setCanNativeShare(true);
    }
  }, []); // ★ 空の依存配列でマウント時に一度だけ実行

  // --- イベントハンドラ ---

  // 1. Markdownリンクのコピー処理
  const handleShareMDClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const markdownLink = `[${article.title}](${article.article_url})`;
    try {
      // ★ navigator.clipboard.writeText を使用
      await navigator.clipboard.writeText(markdownLink);
      setCopiedMD(true);
      setTimeout(() => setCopiedMD(false), 2000);
    } catch (err) {
      console.error("Markdownリンクのコピーに失敗しました:", err);
      // document.execCommand をフォールバックとして使用
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

  // ★ 2. ネイティブ共有 または モーダルを開く処理
  const handleNativeShareOrModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: article.title,
      text: article.summary || article.title,
      url: article.article_url,
    };

    // ★ 修正: canNativeShare が true なら .canShare は存在するので、呼び出しのみ行う
    if (canNativeShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        // 共有が成功した（またはユーザーが閉じた）場合の処理
      } catch (err) {
        // ユーザーが共有をキャンセルした場合などはエラーになる
        console.error("Web Share API が失敗しました:", err);
      }
    } else {
      // Web Share API が使えない場合は、フォールバックとしてモーダルを開く
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
      // ★ navigator.clipboard.writeText を使用
      await navigator.clipboard.writeText(article.article_url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error("URLのコピーに失敗しました:", err);
      // document.execCommand をフォールバックとして使用
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

  // ★ 5. 画像読み込みエラーハンドラ
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.currentTarget as HTMLImageElement;
    // プレースホルダー画像に差し替え
    target.src =
      "https://placehold.co/700x400/eeeeee/aaaaaa?text=Image+Not+Found";
    target.onerror = null; // 無限ループを防ぐ
  };

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
          {/* ★ 左側: アイコン (黒枠を追加) */}
          <div className="flex-shrink-0 w-12 h-12 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 overflow-hidden">
            <UserCircle size={36} className="text-gray-500" />
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
                  onError={handleImageError} // ★ エラーハンドラを追加
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
              {/* 左側: S 共有ボタン */}
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

                {/* ★ 2. 共有ボタン (ネイティブ or モーダル) */}
                <button
                  onClick={handleNativeShareOrModal}
                  className="p-2 rounded-full transition-colors duration-150 text-black hover:bg-gray-200"
                  aria-label="共有"
                >
                  <Share2 size={18} />
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

      {/* --- 2. 共有モーダル (フォールバック用) --- */}
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
            <p className="text-sm text-gray-600 mb-2">リンクをコピーして共有</p>
            <div className="flex space-x-2">
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
                  urlCopied ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {urlCopied ? "コピー済み" : "コピー"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
