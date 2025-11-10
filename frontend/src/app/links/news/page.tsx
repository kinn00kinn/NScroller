/*
frontend/src/app/links/news/page.tsx (修正案)
DBから読み込み (ラベル機能なし)
*/
import Link from "next/link";
import { ArrowLeft, Rss, Clock } from "lucide-react"; // ★ Tag を削除
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { differenceInDays } from "date-fns";
import { Suspense } from "react";
import { Loader2 } from "lucide-react"; // ★ Loader2 をインポート

// TODO: Markdownレンダリング用のコンポーネント (別途インストール・作成が必要)
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
// (例: 'react-markdown' や 'marked' を使ったラッパー)

// データベースの型定義 (ラベルを削除)
type NewsItem = {
  id: string;
  created_at: string;
  title: string;
  content: string; // Markdown形式
};

// 1週間以内か判定するヘルパー
const isRecent = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    // 差が7日以内（0〜7）なら true
    return differenceInDays(today, date) <= 7;
  } catch (error) {
    return false;
  }
};

/**
 * ニュース一覧を実際に取得して表示するコンポーネント
 * (Suspenseのために分離)
 */
async function NewsList() {
  // Supabaseクライアントを初期化 (RSCなのでサービスキーが安全)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return (
      <div className="p-10 text-center text-red-500">
        Supabaseの接続設定がありません。
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. DBからニュースを取得 (select から label を削除)
  const { data: announcements, error } = await supabase
    .from("news") // ★ 'news' テーブル
    .select("id, created_at, title, content")
    .order("created_at", { ascending: false }); // ★ 2. 最新のニュースを上にする

  if (error) {
    console.error("Error fetching news:", error);
    return (
      <div className="p-10 text-center text-red-500">
        ニュースの読み込みに失敗しました: {error.message}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        <Rss size={48} className="mx-auto mb-4" />
        <p>現在、新しいお知らせはありません。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {announcements.map((item, index) => {
        // 3. 「最新」バッジの判定
        const recent = isRecent(item.created_at);

        return (
          <article
            key={item.id}
            className={`p-6 ${
              index < announcements.length - 1 ? "border-b-2 border-black" : ""
            }`}
          >
            {/* 日付と最新バッジ (ラベル表示を削除) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-2">
              <time className="text-gray-600 flex items-center gap-1">
                <Clock size={14} />
                {format(new Date(item.created_at), "yyyy年MM月dd日", {
                  locale: ja,
                })}
              </time>
              {recent && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded">
                  NEW
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold my-1">{item.title}</h2>

            {/* 4. Markdownレンダリング (仮) */}
            <div className="prose prose-sm max-w-none text-black mt-3">
              {<MarkdownRenderer content={item.content} />}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/**
 * お知らせページ (RSC)
 */
export default function NewsPage() {
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
          <Suspense
            fallback={
              <div className="p-10 text-center text-gray-500">
                <Loader2 className="animate-spin mx-auto" />
                <p>読み込み中...</p>
              </div>
            }
          >
            {/* @ts-ignore (async component) */}
            <NewsList />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
