// frontend/src/app/api/profile/upload-icon/route.ts
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
// ★ 管理者用クライアント
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * アイコンアップロード (POST)
 * { file: base64 string, contentType: string } を受け取る
 */
export async function POST(req: NextRequest) {
  try {
    // 1. ユーザーセッションの取得
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = session.user.id;

    // 2. リクエストボディ (JSON) のパース
    const body = await req.json();
    const { file: base64File, contentType, fileExt } = body;

    if (!base64File || !contentType || !fileExt) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 3. Base64をBufferにデコード
    // (data:image/png;base64,AAAA... のプレフィックスを削除)
    const buffer = Buffer.from(base64File.split(",")[1], "base64");

    // 4. Supabase Storage にアップロード (管理者権限)
    const filePath = `${user_id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("avatars") // ★ 'avatars' バケット
      .upload(filePath, buffer, {
        contentType: contentType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 5. 公開URLを取得
    const { data: urlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(uploadData.path);

    // 6. 公開URLをクライアントに返す
    return NextResponse.json(
      {
        success: true,
        imageUrl: urlData.publicUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API /api/profile/upload-icon error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
