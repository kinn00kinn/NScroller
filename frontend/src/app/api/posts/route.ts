// frontend/src/app/api/posts/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

// frontend/src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
// ★ 変更：インポート先を新しい auth.ts に変更
import { authOptions } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

// ★★★
// このAPIは、ログイン中ユーザーの「いいね」状態や「コメント投稿者」の情報を
// RLSをバイパスして取得する必要があるため、*サービスロールキー* を使います。
// .env.local の SUPABASE_SERVICE_ROLE_KEY が必須です。
// ★★★
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase URL and Service Role Key must be defined for API routes"
  );
}

// サービスロールキーでSupaClientを初期化
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // ユーザーRLEを強制しない
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // --- 1. セッションの取得 (ログインしていなくてもOK) ---
    // @ts-ignore
    const session = await getServerSession(authOptions);
    // ログインしていれば user_id をRPCに渡す
    const requesting_user_id = session?.user?.id || null;

    // --- 2. クエリパラメータの取得 ---
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    // ソートモード: 'recent' (デフォルト) または 'likes'
    const sort = searchParams.get("sort") || "recent";
    // 'my-likes' ページ用のフィルタ
    const liked_by_user = searchParams.get("liked_by_user") === "true";

    const MAX_LIMIT = 100;
    const safeLimit = Math.max(1, Math.min(limit, MAX_LIMIT));

    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page." }, { status: 400 });
    }

    // --- 3. RPCの呼び出し ---
    // 'get_feed_articles' (page_num, page_limit, sort_mode, requesting_user_id)

    // liked_by_user=true の場合、専用のRPC 'get_my_liked_articles' を呼び出す
    if (liked_by_user && requesting_user_id) {
      // ★★★ ここから修正 ★★★

      // 1. .rpc() は 'count' を返さないため、{ data, error } のみ受け取る
      const { data, error } = await supabase.rpc("get_my_liked_articles", {
        p_user_id: requesting_user_id,
        p_page_num: page,
        p_page_limit: safeLimit,
      });

      if (error) throw error;

      // 2. data は既に正しい Article[] 形式 (または null)
      //    'a: any' エラーの原因だった .map() 処理を削除
      const articles = data || [];

      // 3. 'count' がないので、取得件数とリミット数を比較して 'hasMore' を判断
      const hasMore = articles.length === safeLimit;

      // 4. 'total: null' (総件数なし) でレスポンスを返す
      return NextResponse.json({ articles, total: null, hasMore });

      // ★★★ 修正ここまで ★★★
    } else {
      // ★ 通常のタイムライン (RPC呼び出し)
      const { data, error } = await supabase.rpc("get_feed_articles", {
        page_num: page,
        page_limit: safeLimit,
        sort_mode: sort === "likes" ? "likes" : "recent", // 'recent' をデフォルトに
        requesting_user_id: requesting_user_id,
      });

      if (error) {
        console.error("Supabase RPC error:", error);
        throw new Error(error.message);
      }

      // RPCはhasMoreを返さないので、件数がlimit未満かで判定
      // (data が null の場合も考慮)
      const hasMore = data ? data.length === safeLimit : false;

      return NextResponse.json({
        articles: data || [], // data が null の場合は空配列を返す
        total: null, // RPCでは総数を取得していない
        hasMore: hasMore,
      });
    }
  } catch (error) {
    console.error("API route error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}