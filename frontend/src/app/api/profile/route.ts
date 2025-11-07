// frontend/src/app/api/profile/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

// サービスロールキーを使用
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL and Service Role Key must be defined");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * プロフィール更新 (POST)
 * { name: string, image_url?: string } を受け取る
 */
export async function POST(req: NextRequest) {
  try {
    // 1. ユーザーセッションの取得
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = session.user.id;

    // 2. リクエストボディのパース
    const body = await req.json();
    const { name, image_url } = body;

    // 更新するデータを準備
    const updateData: { name?: string; image?: string } = {};
    if (name && typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim();
    }
    if (image_url && typeof image_url === "string") {
      updateData.image = image_url;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No update data provided." },
        { status: 400 }
      );
    }

    // 3. データベースの 'users' テーブルを更新
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user_id)
      .select()
      .single();

    if (error) throw error;

    // 4. 成功レスポンス
    return NextResponse.json(
      {
        success: true,
        updatedUser: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API /api/profile error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
