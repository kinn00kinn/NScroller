// frontend/src/app/my-likes/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Timeline from "@/app/components/Timeline"; // タイムラインコンポーネントを再利用
import { ArrowLeft, Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import React from "react";

export default function MyLikesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 認証状態のハンドリング
  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">...</div>;
  }

  if (status === "unauthenticated") {
    // ログインページにリダイレクト (または 'signIn()')
    router.push("/");
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
            <h1 className="text-xl font-bold">いいねした投稿</h1>
            <p className="text-sm text-gray-500">{session?.user?.name || ""}</p>
          </div>
        </header>

        {/* メインタイムライン */}
        <main className="border-x-2 border-b-2 border-black">
          {/* Timelineコンポーネントを 'myLikesOnly' モードで再利用します。
            useInfiniteFeedフックが 'liked_by_user=true' パラメータを
            /api/posts に自動的に付与します。
            ソートは 'recent' (いいねした順) のみとします。
          */}
          <Timeline sortMode="recent" myLikesOnly={true} />
        </main>
      </div>
    </div>
  );
}
