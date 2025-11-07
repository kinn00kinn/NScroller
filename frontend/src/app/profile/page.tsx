// frontend/src/app/profile/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, ChangeEvent } from "react";
import { ArrowLeft, Loader2, User, Camera, Check } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/app/lib/supabase"; // クライアントSupaClientをインポート

// ★ ファイルをBase64に変換するヘルパー関数
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

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

    const nameChanged = name !== session.user.name;
    const avatarChanged = !!avatarImage;

    // どちらも変更がなければ何もしない
    if (!nameChanged && !avatarChanged) return;

    setIsLoading(true);
    setIsSuccess(false);
    let newImageUrl: string | undefined = undefined; // 新しい画像のURLを格納する変数

    try {
      //
      // ステップ 1: アイコンが変更された場合、専用APIにアップロード
      //
      if (avatarImage) {
        // 1a. ファイルを Base64 文字列に変換
        const base64File = await fileToBase64(avatarImage);

        // 1b. 新しいAPI /api/profile/upload-icon (次のステップで作成) に送信
        const uploadResponse = await fetch("/api/profile/upload-icon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64File,
            contentType: avatarImage.type,
            fileExt: avatarImage.name.split(".").pop(), // "png" や "jpg" など
          }),
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(
            uploadResult.error || "アイコンのアップロードに失敗しました"
          );
        }

        newImageUrl = uploadResult.imageUrl; // APIから返された公開URLを取得
      }

      //
      // ステップ 2: /api/profile APIに (名前) と (新しい画像URL) を送信
      //
      const updatePayload = {
        name: name,
        // newImageUrl があれば (ステップ1で設定されたら) それを使い、
        // なければ (アイコン変更なしなら) undefined を送る
        image_url: newImageUrl,
      };

      const profileResponse = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const profileResult = await profileResponse.json();
      if (!profileResponse.ok) {
        // ここで 'public.users' エラーが出る場合は【手順1】が必要です
        throw new Error(
          profileResult.error || "プロフィールの更新に失敗しました"
        );
      }

      //
      // ステップ 3: クライアント側のセッションを更新 (即時反映のため)
      //
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: name,
          // 新しいURLがあればそれを、なければ既存のセッションの画像を使う
          image: newImageUrl || session.user.image,
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
