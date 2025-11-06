// frontend/src/app/api/comments/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
// frontend/src/app/api/auth/[...nextauth]/route.ts

import { authOptions } from "@/app/lib/auth";


export const dynamic = "force-dynamic";

// サービスロールキーを使用 (ユーザー情報JOINのため)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL and Service Role Key must be defined");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: コメントの取得 (記事ID指定)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const article_id = searchParams.get("article_id");

    if (!article_id) {
      return NextResponse.json(
        { error: "Article ID is required." },
        { status: 400 }
      );
    }

    // コメントをユーザー情報と共に取得 (投稿日順)
    const { data, error } = await supabase.rpc(
      "get_comments_for_article",
      {
        p_article_id: article_id,
      }
    )
     

    if (error) throw error;

    return NextResponse.json({ comments: data });
  } catch (error) {
    console.error("API GET comments error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST: コメントの投稿
export async function POST(req: NextRequest) {
  try {
    // 1. セッションの確認
    // @ts-ignore
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = session.user.id;
    const user_name = session.user.name;
    const user_image = session.user.image;

    // 2. リクエストボディのパース
    const body = await req.json();
    const { article_id, text } = body;

    if (!article_id || !text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 3. コメントを挿入
    const { data: newComment, error } = await supabase
      .from("comments")
      .insert({
        article_id: article_id,
        user_id: user_id,
        text: text.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    // 4. 新しいコメントデータを返す (投稿者情報を付加)
    const responseData = {
      ...newComment,
      user: {
        id: user_id,
        name: user_name,
        image: user_image,
      },
    };

    return NextResponse.json(responseData, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("API POST comments error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
