"use client";

import type { Article } from "@/app/lib/mockData";
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
  Heart, // ★ いいねアイコン
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react"; // ★ これらを追加

type ArticleCardProps = {
  // ★ Article型に likes プロパティ（任意）を追加
  article: Article & { summary?: string | null; like_num?: number };
};

export default function ArticleCard({ article }: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: ja,
  }); // --- 動的スタイルロジック ---

  const hasSummary = article.summary && article.summary.length > 0;
  const titleLineClamp = hasSummary ? "line-clamp-1" : "line-clamp-3"; // --- 状態管理 ---

  const [copiedMD, setCopiedMD] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false); // ★ いいね機能の state を追加 // (いいねの初期カウントを article.likes から取得し、なければ 0 で初期化)

  const [likeCount, setLikeCount] = useState(article.like_num || 0); // (本来はユーザーがいいね済みかどうかもAPIから取得する)
  const [isLiked, setIsLiked] = useState(false);

  // ★ セッション情報を取得
  const { data: session, status } = useSession();

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      "canShare" in navigator
    ) {
      setCanNativeShare(true);
    }
  }, []); // --- イベントハンドラ --- // 1. Markdownリンクのコピー処理 (変更なし)

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
  }; // 2. ネイティブ共有 または モーダルを開く処理 (変更なし)

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
  }; // 3. 共有モーダルを閉じる処理 (変更なし)

  const handleCloseModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsModalOpen(false);
    setUrlCopied(false);
  }; // 4. モーダル内でURLをコピーする処理 (変更なし)

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
  }; // 5. 画像読み込みエラーハンドラ (変更なし)

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.currentTarget as HTMLImageElement;
    target.src =
      "https://placehold.co/700x400/eeeeee/aaaaaa?text=Image+Not+Found";
    target.onerror = null;
  }; // 6. SNS共有リンク生成関数 (変更なし)

  const getTwitterShareUrl = (title: string, url: string) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      title
    )}&url=${encodeURIComponent(url)}`;

  const getFacebookShareUrl = (url: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const getLineShareUrl = (title: string, url: string) =>
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(title)}`; // ★ 7. いいねクリック処理

  // ★ 7. いいねクリック処理
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // ★ ログイン状態をチェック
    if (status === "loading") {
      return; // セッション情報を読み込み中はなにもしない
    }

    if (!session) {
      // ★ ログインしていない場合
      alert("いいね機能を利用するにはログインが必要です。");
      signIn("google"); // page.tsx と同様に Google サインインを実行
      return; // いいね処理を中断
    }

    // 状態を先に更新 (楽観的UI)
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prevCount) => prevCount + (newIsLiked ? 1 : -1));

    const action = newIsLiked ? "like" : "unlike";

    try {
      // ★ APIを呼び出す
      const response = await fetch("/api/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article_id: article.id, // (articleオブジェクトにidが必要)
          action: action,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const result = await response.json();

      // ★ サーバーからの最新のいいね数でローカルのstateを同期
      // (楽観的UIが成功していれば値は同じはずだが、念のため)
      setLikeCount(result.new_like_num);
    } catch (error) {
      console.error("いいねの更新に失敗しました:", error);
      // ★ エラーが起きたらUIを元に戻す
      setIsLiked(!newIsLiked); // 状態をロールバック
      setLikeCount((prevCount) => prevCount - (newIsLiked ? 1 : -1)); // カウントをロールバック
    }
  };

  return (
    <>
      {/* --- 1. 記事カード本体 --- */}{" "}
      <a
        href={article.article_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full p-4 border-b-2 border-black bg-white transition-colors duration-150 hover:bg-gray-50"
      >
        {" "}
        <div className="flex space-x-3">
          {/* ★ 左側: アイコン (変更なし) */}{" "}
          <div className="flex-shrink-0 w-12 h-12 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 overflow-hidden">
            <img src="./favicon.ico" alt="" />{" "}
          </div>
          {/* 右側: コンテンツ (変更なし) */}{" "}
          <div className="flex-1 min-w-0">
            {/* 上部: ユーザー名 (変更なし) */}{" "}
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              {" "}
              <span className="font-bold text-lg text-black truncate">
                {article.source_name}{" "}
              </span>{" "}
            </div>
            {/* 画像 (変更なし) */}{" "}
            {article.image_url && (
              <div className="mb-2 w-full border-2 border-black flex items-center justify-center overflow-hidden rounded-lg">
                {" "}
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-auto object-cover max-h-96"
                  onError={handleImageError}
                />{" "}
              </div>
            )}
            {/* テキスト (タイトルと要約) (変更なし) */}{" "}
            <div className="space-y-1">
              {" "}
              <h2 className={`text-xl font-bold ${titleLineClamp}`}>
                {article.title}{" "}
              </h2>{" "}
              {hasSummary && (
                <p className="text-gray-700 line-clamp-2">{article.summary}</p>
              )}{" "}
            </div>
            {/* 下部 (ボタンと時間) */}{" "}
            <div className="mt-4 flex items-center justify-between text-black">
              {/* 左側: 共有ボタン */}{" "}
              <div className="flex items-center space-x-4">
                {/* 1. 共有ボタン (MD) (変更なし) */}{" "}
                <button
                  onClick={handleShareMDClick}
                  disabled={copiedMD}
                  className={`flex items-center space-x-1 transition-colors duration-150 ${
                    copiedMD
                      ? "text-green-600"
                      : "text-black hover:text-gray-600 cursor-pointer"
                  }`}
                >
                  <Share2 size={18} />{" "}
                  <span className="text-sm">
                    {" "}
                    {copiedMD ? "コピーしました！" : "共有 (MD)"}{" "}
                  </span>{" "}
                </button>{" "}
                {/* 2. 共有ボタン (ネイティブ or モーダル) (変更なし) */}{" "}
                <button
                  onClick={handleNativeShareOrModal}
                  className="p-2 rounded-full transition-colors duration-150 text-black hover:bg-gray-200"
                  aria-label="共有"
                >
                  <Send size={18} />{" "}
                </button>
                {/* ★ 3. いいねボタン */}
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
                  {/* ★ likeCount (初期値は article.like_num) を常に表示 */}
                  <span className="text-sm">{likeCount}</span>
                </button>
              </div>
              {/* 右側: 時間 (変更なし) */}{" "}
              <span className="text-sm text-gray-500 flex-shrink-0">
                {timeAgo}{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </a>
      {/* --- 2. 共有モーダル (変更なし) --- */}{" "}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => handleCloseModal()}
        >
          {" "}
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}{" "}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">共有</h3>{" "}
              <button
                onClick={() => handleCloseModal()}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
                aria-label="閉じる"
              >
                <X size={24} />{" "}
              </button>{" "}
            </div>
            {/* コンテンツ */} {/* URLコピーセクション */}{" "}
            <p className="text-sm text-gray-600 mb-2">リンクをコピー</p>{" "}
            <div className="flex space-x-2 mb-6">
              {" "}
              <input
                type="text"
                readOnly
                value={article.article_url}
                className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-100 text-black"
                onFocus={(e) => e.target.select()}
              />{" "}
              <button
                onClick={handleCopyUrl}
                className={`px-4 py-2 rounded-md font-semibold text-white transition-colors ${
                  urlCopied ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {urlCopied ? "コピー済み" : "コピー"}{" "}
              </button>{" "}
            </div>
            {/* SNS共有セクション */}{" "}
            <p className="text-sm text-gray-600 mb-2">SNSで共有</p>{" "}
            <div className="flex space-x-4 justify-center">
              {/* Twitter */}{" "}
              <a
                href={getTwitterShareUrl(article.title, article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={handleCloseModal}
              >
                <Twitter size={32} className="text-blue-400" />{" "}
                <span className="text-xs text-gray-600 mt-1">Twitter</span>{" "}
              </a>
              {/* Facebook */}{" "}
              <a
                href={getFacebookShareUrl(article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={handleCloseModal}
              >
                <Facebook size={32} className="text-blue-600" />{" "}
                <span className="text-xs text-gray-600 mt-1">Facebook</span>{" "}
              </a>
              {/* LINE */}{" "}
              <a
                href={getLineShareUrl(article.title, article.article_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={handleCloseModal}
              >
                {" "}
                <MessageSquare size={32} className="text-green-500" />
                <span className="text-xs text-gray-600 mt-1">LINE</span>{" "}
              </a>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </>
  );
}
