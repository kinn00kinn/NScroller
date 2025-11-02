import type { Article } from "@/app/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import Image from "next/image";
import UserIcon from "./UserIcon"; // ★ アイコンをインポート

type ArticleCardProps = {
  // ★ Article型に summary がオプションで追加されたと仮定します
  article: Article & { summary?: string | null };
};

export default function ArticleCard({ article }: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: ja,
  });

  // --- 動的スタイルロジック ---
  // 1. article.summary が存在し、かつ空文字列でないかチェック
  const hasSummary = article.summary && article.summary.length > 0;

  // 2. 要約がある場合はタイトルを1行に、ない場合は2行にする
  const titleLineClamp = hasSummary ? "line-clamp-1" : "line-clamp-2";
  // ---

  return (
    <a
      href={article.article_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full p-4 border-b-2 border-black bg-white cursor-pointer transition-colors duration-150 hover:bg-gray-50"
    >
      {" "}
      <div className="flex space-x-3">
        {/* 1. 左側: アイコン */}{" "}
        <div className="flex-shrink-0">
          <UserIcon sizePx={48} />{" "}
        </div>
        {/* 2. 右側: コンテンツ */}{" "}
        <div className="flex-1 min-w-0">
          {/* 上部: ユーザー名と投稿時間 */}{" "}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            {" "}
            <span className="font-bold text-lg text-black truncate">
              {article.source_name}{" "}
            </span>
            <span className="flex-shrink-0">· {timeAgo}</span>{" "}
          </div>
          {/* ★ 修正: 画像 (あれば表示) をテキストの前に移動 */}{" "}
          {article.image_url && (
            <div className="mb-2 w-full border-2 border-black flex items-center justify-center overflow-hidden rounded-lg">
              {" "}
              {/* マージンを mt-3 から mb-2 に変更 */}{" "}
              <Image
                src={article.image_url}
                alt={article.title}
                width={700}
                height={400}
                className="w-full h-auto object-cover max-h-96"
              />{" "}
            </div>
          )}
          {/* 中部: テキスト (タイトルと要約) */}{" "}
          <div className="space-y-1">
            {/* ★ 修正: 動的クラス適用 */}{" "}
            <h2 className={`text-xl font-bold ${titleLineClamp}`}>
              {article.title}{" "}
            </h2>
            {/* ★ 追加: 要約（summary）があれば表示 */}{" "}
            {hasSummary && (
              <p className="text-gray-700 line-clamp-2">
                {/* 要約は2行まで */}
                {article.summary}{" "}
              </p>
            )}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </a>
  );
}
