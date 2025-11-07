// frontend/src/app/my-bookmarks/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Timeline from "@/app/components/Timeline";
import { ArrowLeft, Bookmark } from "lucide-react"; // ★ Heart を Bookmark に変更
import { useSession } from "next-auth/react";
import React from "react";

export default function MyBookmarksPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">...</div>;
  }
  if (status === "unauthenticated") {
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
            <h1 className="text-xl font-bold">ブックマーク</h1> {/* ★ 変更 */}
            <p className="text-sm text-gray-500">{session?.user?.name || ""}</p>
          </div>
        </header>

        {/* メインタイムライン */}
        <main className="border-x-2 border-b-2 border-black">
          {/*
            Timelineコンポーネントを 'myBookmarksOnly' モードで再利用
          */}
          <Timeline
            sortMode="recent" // ブックマークした順
            myLikesOnly={false}
            myBookmarksOnly={true} // ★ ここを true に変更
          />
        </main>
      </div>
    </div>
  );
}
