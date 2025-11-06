// frontend/src/app/api/like/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
// frontend/src/app/api/auth/[...nextauth]/route.ts
// ★ 修正：この行を追加
import { authOptions } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

// --- ★ サービスロールクライアントの初期化 ---
// このAPIはユーザーの代わりにDBを操作するため、'service_role' キーが必要です
// .env.local に SUPABASE_SERVICE_ROLE_KEY が設定されている前提
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase URL and Service Role Key must be defined in environment variables"
  );
}

// サービスロールキーでSupaClientを初期化
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// ----------------------------------------------------

/**
 * いいね操作 (POST)
 * { article_id: number, action: 'like' | 'unlike' } を受け取る
 */
export async function POST(req: NextRequest) {
  try {
    // --- 1. ユーザーセッションの取得 ---
    // @ts-ignore
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // NextAuthのセッションIDは、SupabaseAdapterにより auth.users.id と一致する
    const user_id = session.user.id;

    // --- 2. リクエストボディのパース ---
    const body = await req.json();
    const { article_id, action } = body;

    if (!article_id || (action !== "like" && action !== "unlike")) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // --- 3. アクションに応じたDB操作 ---
    let new_like_num = 0;
    const amount_to_add = action === "like" ? 1 : -1;

    if (action === "like") {
      // 1. user_likes に挿入 (重複は無視)
      const { error: likeError } = await supabase.from("user_likes").upsert(
        { user_id: user_id, article_id: article_id },
        {
          onConflict: "user_id, article_id", // 競合するカラム
          ignoreDuplicates: true, // trueにすると "DO NOTHING" (無視) になる
        }
      );

      if (likeError) {
        throw new Error(`User like error: ${likeError.message}`);
      }
    } else {
      // action === 'unlike'
      // 1. user_likes から削除
      const { error: unlikeError } = await supabase
        .from("user_likes")
        .delete()
        .match({ user_id: user_id, article_id: article_id });

      if (unlikeError) {
        throw new Error(`User unlike error: ${unlikeError.message}`);
      }
    }

    // 2. 記事本体の like_num カウンターを増減 (共通)
    // (注: unlike時に既に0だった場合の考慮など、RPCを-1に固定しない方が安全)
    const { data: rpc_data, error: rpc_error } = await supabase.rpc(
      "increment_like_num",
      {
        article_id_to_update: article_id,
        amount_to_add: amount_to_add,
      }
    );

    if (rpc_error) {
      throw new Error(`RPC error: ${rpc_error.message}`);
    }
    new_like_num = rpc_data;

    // --- 4. 成功レスポンス ---
    return NextResponse.json(
      {
        success: true,
        action: action,
        new_like_num: new_like_num,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API route error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
