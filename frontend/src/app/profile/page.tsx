// frontend/src/app/profile/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, ChangeEvent } from "react";
import { ArrowLeft, Loader2, User, Camera, Check } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/app/lib/supabase"; // クライアントSupaClientをインポート

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession(); // 'update' を取得

  const [name, setName] = useState("");
  const [avatarImage, setAvatarImage] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // セッション読み込み時にフォームの初期値を設定
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setAvatarPreview(session.user.image || null);
    }
  }, [session]);

  // ファイルが選択されたらプレビューを更新
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarImage(file);
      setAvatarPreview(URL.createObjectURL(file));
      setIsSuccess(false); // 成功状態をリセット
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "authenticated" || isLoading) return;

    setIsLoading(true);
    setIsSuccess(false);
    let newImageUrl: string | undefined = undefined;

    try {
      // 1. (もしあれば) アイコン画像を Storage にアップロード
      if (avatarImage) {
        const fileExt = avatarImage.name.split(".").pop();
        const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarImage, {
            cacheControl: "3600",
            upsert: true, // 既存のものを上書き
          });

        if (uploadError) throw uploadError;

        // 2. アップロードした画像の公開URLを取得
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(uploadData.path);

        newImageUrl = urlData.publicUrl;
      }

      // 3. APIサーバーに更新リクエストを送信
      const updatePayload = {
        name: name,
        image_url: newImageUrl, // 新しいURLがない場合は undefined (更新しない)
      };

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "プロフィールの更新に失敗しました");
      }

      // 4. クライアントのセッションを更新 (重要！)
      // これにより、ヘッダーのアイコン等が即時反映される
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: name,
          image: newImageUrl || session.user.image, // 新URL > 旧URL
        },
      });

      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
      setAvatarImage(null); // ファイル選択をリセット
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") {
    router.push("/"); // ログインしていない場合はホームへ
    return null;
  }

  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ヘッダー */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-2 border-b-2 border-black flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">プロフィール編集</h1>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="border-x-2 border-b-2 border-black p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* アイコン編集 */}
            <div className="flex flex-col items-center space-y-2">
              <label htmlFor="avatarInput" className="cursor-pointer relative">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    width={120}
                    height={120}
                    className="rounded-full w-32 h-32 border-4 border-black object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-black flex items-center justify-center">
                    <User size={60} />
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-2 border-2 border-black">
                  <Camera size={18} />
                </div>
              </label>
              <input
                type="file"
                id="avatarInput"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <span className="text-sm text-gray-500">アイコンを変更</span>
            </div>

            {/* ニックネーム編集 */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold mb-1">
                ニックネーム
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsSuccess(false); // 成功状態をリセット
                }}
                className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
                required
              />
            </div>

            {/* 保存ボタン */}
            <button
              type="submit"
              disabled={
                isLoading ||
                status !== "authenticated" ||
                (name === session.user.name && !avatarImage)
              }
              className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-full disabled:bg-gray-400 hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : isSuccess ? (
                <>
                  <Check size={20} />
                  <span>保存しました</span>
                </>
              ) : (
                <span>保存する</span>
              )}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
