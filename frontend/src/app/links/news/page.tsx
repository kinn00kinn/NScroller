/*
frontend/src/app/links/official/page.tsx (新規作成)
*/
import Link from "next/link";
import { ArrowLeft, Rss } from "lucide-react"; // ★ アイコンをインポート

// ★ お知らせのサンプルデータ（実際にはCMSやDBから取得するか、手動で更新）
const announcements = [
  {
    id: 3,
    date: "2025年11月9日",
    title: "v1.1 アップデート: ブックマーク機能を追加しました",
    content:
      "いつもPanDoをご利用いただきありがとうございます。本日、ブックマーク機能を追加しました。気になる記事を保存して、後から読み返すことができます。今後ともPanDoをよろしくお願いいたします。",
  },
  {
    id: 2,
    date: "2025年11月5日",
    title: "軽微な不具合の修正",
    content: "一部の環境で発生していた表示崩れを修正しました。",
  },
  {
    id: 1,
    date: "2025年11月4日",
    title: "「PanDo」サービスを開始しました",
    content:
      "パンダ特化型ニュースアグリゲーター「PanDo (パンドゥ)」のサービスを開始しました。世界中のパンダニュースをお楽しみください。",
  },
];

const OfficialPage = () => {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ヘッダー */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-2 border-b-2 border-black flex items-center space-x-4">
          <Link
            href="/links"
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">公式からのお知らせ</h1>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="border-x-2 border-b-2 border-black">
          {announcements.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <Rss size={48} className="mx-auto mb-4" />
              <p>現在、新しいお知らせはありません。</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {announcements.map((item, index) => (
                <article
                  key={item.id}
                  className={`p-6 ${
                    index < announcements.length - 1
                      ? "border-b-2 border-black"
                      : ""
                  }`}
                >
                  <time className="text-sm text-gray-600">{item.date}</time>
                  <h2 className="text-lg font-bold my-1">{item.title}</h2>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OfficialPage;
