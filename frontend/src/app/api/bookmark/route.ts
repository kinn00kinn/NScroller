// frontend/src/app/api/bookmark/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

// サービスロールキー
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL and Service Role Key must be defined");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * ブックマーク操作 (POST)
 * { article_id: number, action: 'bookmark' | 'unbookmark' } を受け取る
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = session.user.id;

    const body = await req.json();
    const { article_id, action } = body;

    // ★ アクション名を変更
    if (!article_id || (action !== "bookmark" && action !== "unbookmark")) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    let new_bookmark_num = 0;
    const amount_to_add = action === "bookmark" ? 1 : -1;

    if (action === "bookmark") {
      // 1. user_bookmarks に挿入
      const { error: bookmarkError } = await supabase
        .from("user_bookmarks")
        .upsert(
          { user_id: user_id, article_id: article_id },
          {
            onConflict: "user_id, article_id", // 複合プライマリキー
            ignoreDuplicates: true,
          }
        );
      if (bookmarkError) throw bookmarkError;
    } else {
      // 2. user_bookmarks から削除
      const { error: unbookmarkError } = await supabase
        .from("user_bookmarks")
        .delete()
        .match({ user_id: user_id, article_id: article_id });
      if (unbookmarkError) throw unbookmarkError;
    }

    // 3. 記事本体の bookmark_num カウンターを増減
    const { data: rpc_data, error: rpc_error } = await supabase.rpc(
      "increment_bookmark_num", // ★ RPC関数名を変更
      {
        article_id_to_update: article_id,
        amount_to_add: amount_to_add,
      }
    );

    if (rpc_error) throw new Error(`RPC error: ${rpc_error.message}`);
    new_bookmark_num = rpc_data;

    return NextResponse.json(
      {
        success: true,
        action: action,
        new_bookmark_num: new_bookmark_num,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API /api/bookmark error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    // @ts-ignore
    const errorCode = error.code || "Unknown";
    // @ts-ignore
    return NextResponse.json(
      { error: errorMessage, code: errorCode },
      { status: 500 }
    );
  }
}
