import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Supabaseクライアントを初期化
// 環境変数はVercelの管理画面で設定することを想定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be defined in environment variables"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // --- 修正点：上限設定の追加 ---
    const page = parseInt(searchParams.get("page") || "1", 10);
    // クライアントからのリクエスト値（デフォルトは20）
    const requestedLimit = parseInt(searchParams.get("limit") || "20", 10);
    // サーバー側で設定する最大値
    const MAX_LIMIT = 100;

    // リクエストされた値が1未満にならないよう、かつMAX_LIMITを超えないように調整
    const limit = Math.max(1, Math.min(requestedLimit, MAX_LIMIT)); // pageが数値で、かつ1以上であることを確認 (limitのチェックは↑で行ったため簡略化)
    // --- 修正点ここまで ---

    if (isNaN(page) || page < 1 || isNaN(limit)) {
      return NextResponse.json(
        { error: "Invalid page or limit parameter." },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Supabaseからデータを取得
    const { data, error, count } = await supabase
      .from("articles")
      .select(
        "id, title, article_url, published_at, source_name, image_url, summary",
        {
          count: "exact",
        }
      )
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(error.message);
    }

    const hasMore = count ? offset + data.length < count : false;

    // レスポンスを返す
    return NextResponse.json({ articles: data, total: count, hasMore });
  } catch (error) {
    console.error("API route error:", error); // エラーレスポンスを返す
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
