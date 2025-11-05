import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// --- Supabaseクライアント初期化 (既存のコードと同じ) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be defined in environment variables"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ----------------------------------------------------

/**
 * いいね操作 (POST)
 * フロントエンドから { article_id: number, action: 'like' | 'unlike' } を受け取る
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { article_id, action } = body;

    // --- 1. バリデーション ---
    if (!article_id || (action !== "like" && action !== "unlike")) {
      return NextResponse.json(
        {
          error:
            "Invalid request body. 'article_id' and 'action' (like/unlike) are required.",
        },
        { status: 400 }
      );
    }

    // --- 2. 増減量の決定 ---
    // 'like'なら+1、'unlike'なら-1
    const amount_to_add = action === "like" ? 1 : -1;

    // --- 3. Supabase RPCの実行 ---
    // ステップ1で作成した 'increment_like_num' 関数を呼び出す
    const { data: new_like_num, error } = await supabase.rpc(
      "increment_like_num",
      {
        article_id_to_update: article_id,
        amount_to_add: amount_to_add,
      }
    );

    if (error) {
      console.error("Supabase RPC error:", error);
      throw new Error(error.message);
    }

    // --- 4. 成功レスポンス ---
    // 更新後のいいね数をフロントエンドに返す
    return NextResponse.json(
      {
        success: true,
        action: action,
        new_like_num: new_like_num, // SQL関数が返した更新後の値
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
