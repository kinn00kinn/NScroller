// frontend/src/app/article/[id]/page.tsx
// ★ 'use client' を削除！
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { Article } from "@/app/lib/mockData";
import { ArrowLeft } from "lucide-react";
import Link from "next/link"; // ★ Link をインポート
import { notFound } from "next/navigation"; // ★ notFound をインポート

// ★ インタラクティブな部分を別コンポーネントに分離
import ArticleDetailClient from "@/app/components/ArticleDetailClient";

// サーバーサイドでSupabaseクライアントを初期化 (サービスキーを使用)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL and Service Role Key must be defined");
}
// ★ ページ専用のサービスキーSupaClient
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * サーバーコンポーネント (RSC)
 * ページがリクエストされた時点で、サーバー側でデータを取得する
 */
export default async function ArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  // 1. セッションをサーバーサイドで取得 (RSCなので安全)
  const session = await getServerSession(authOptions);
  const user_id = session?.user?.id || null;

  // 2. 記事データをサーバーサイドで取得
  const { data: articleData, error: articleError } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (articleError || !articleData) {
    console.error("Article fetch error:", articleError);
    // 記事が見つからない場合は 404 ページを表示
    notFound();
  }

  // 3. いいね状態をサーバーサイドで取得
  let is_liked = false;
  if (user_id) {
    const { data: likeData } = await supabase
      .from("user_likes")
      .select("article_id")
      .eq("user_id", user_id)
      .eq("article_id", id)
      .maybeSingle();

    if (likeData) {
      is_liked = true;
    }
  }

  // 4. 取得したデータを Article 型に整形
  const article: Article = {
    ...articleData,
    id: articleData.id.toString(), // DBのbigintをstringに
    like_num: articleData.like_num || 0,
    is_liked: is_liked,
    comments: [], // コメントはクライアント側(SWR)で取得
  };

  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ヘッダー (サーバーコンポーネントなので Link を使用) */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-2 border-b-2 border-black">
          <Link
            href="/" // ★ router.back() の代わりにホームへ
            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
            <span className="font-bold">戻る</span>
          </Link>
        </header>

        {/* メインコンテンツ */}
        <main className="border-x-2 border-black">
          {/* ★ クライアントコンポーネントに必要な初期データを渡す */}
          <ArticleDetailClient initialArticle={article} />
        </main>
      </div>
    </div>
  );
}
