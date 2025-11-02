import type { Article } from "@/app/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import Image from "next/image";
import UserIcon from "./UserIcon"; // ★ 新しいアイコンをインポート

type ArticleCardProps = {
  article: Article;
};

export default function ArticleCard({ article }: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: ja,
  });

  return (
    <a
      href={article.article_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full p-4 border-b-2 border-black bg-white cursor-pointer transition-colors duration-150 hover:bg-gray-50"
    >
      <div className="flex space-x-3">
        {/* 1. 左側: アイコン */}
        <div className="flex-shrink-0">
          <UserIcon sizePx={48} />
        </div>

        {/* 2. 右側: コンテンツ */}
        <div className="flex-1 min-w-0">
          {/* 上部: ユーザー名と投稿時間 */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <span className="font-bold text-lg text-black truncate">
              {article.source_name}
            </span>
            <span className="flex-shrink-0">· {timeAgo}</span>
          </div>

          {/* 中部: テキスト (タイトルと要約) */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold line-clamp-2">
              {article.title}
            </h2>
            
          </div>

          {/* 中部: 画像 (あれば表示) */}
          {article.image_url && (
            <div className="mt-3 w-full border-2 border-black flex items-center justify-center overflow-hidden rounded-lg">
              <Image
                src={article.image_url}
                alt={article.title}
                width={700}
                height={400}
                className="w-full h-auto object-cover max-h-96"
              />
            </div>
          )}

          {/* 下部: アクションボタン (いいね・共有) */}

          {/* <div className="mt-4 flex items-center space-x-4 text-black">
            <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-600">
              <ThumbsUp size={18} />
              <span className="text-sm">123</span> {}
            </div>
            <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-600">
              <Share2 size={18} />
              <span className="text-sm">共有</span>
            </div>
          </div> */}
          
        </div>
      </div>
    </a>
  );
}