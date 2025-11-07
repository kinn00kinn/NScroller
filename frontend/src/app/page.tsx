/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/page.tsx の修正
*/
// frontend/src/app/page.tsx
"use client";

import Timeline from "@/app/components/Timeline";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User, X, Heart, UserCog, Bookmark, Info,  HelpCircle,} from "lucide-react";
import FeedSorter from "@/app/components/FeedSorter";
// ★ 1. インポート先を変更
import InteractiveTutorial from "@/app/components/InteractiveTutorial";

const TUTORIAL_KEY = "pando_tutorial_shown_v1";

export default function Home() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [sortMode, setSortMode] = useState<"recent" | "recommended">("recent");
  const [showTutorial, setShowTutorial] = useState(false);

  // ... (handleClickOutside effect) ...
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // ★ 2. チュートリアル表示ロジック (変更なし)
  useEffect(() => {
    if (status === "authenticated") {
      const hasSeenTutorial = localStorage.getItem(TUTORIAL_KEY);
      if (!hasSeenTutorial) {
        // ★ タイムラインの要素が描画されるのを少し待つ
        setShowTutorial(true);
        localStorage.setItem(TUTORIAL_KEY, "true");
      }
    }
  }, [status]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  // ★ 2. チュートリアルを再開するための新しいハンドラを追加
  const handleRestartTutorial = () => {
    setIsMenuOpen(false); // メニューを閉じる
    setShowTutorial(true); // チュートリアルを開始する
  };

  return (
    <div className="bg-white text-black">
      {/* ★ 3. 呼び出すコンポーネントを変更 */}
      <InteractiveTutorial
        show={showTutorial}
        onComplete={handleCloseTutorial}
      />

      <div className="w-full max-w-xl bg-white mx-auto">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
          <div
            id="tutorial-header-banner" // ★ 4. チュートリアル用のIDを追加
            onClick={scrollToTop}
            className="border-b-2 border-black flex justify-center cursor-pointer h-[73px] items-center"
          >
            <Image
              src="/Pando_banner_1000.gif"
              alt="PanDo Banner"
              width={1000}
              height={100}
              className="w-10/12 h-auto"
              unoptimized
              priority
            />
          </div>
          <FeedSorter sortMode={sortMode} setSortMode={setSortMode} />
        </header>

        <main className="border-x-2 border-b-2 border-black">
          {/* ★ 5. チュートリアルがアクティブかどうかのフラグを渡す */}
          <Timeline sortMode={sortMode} isTutorialActive={showTutorial} />
        </main>

        <div
          ref={menuRef}
          className="fixed top-4 right-4 z-20 flex flex-col items-end sm:right-8"
        >
          {/* Menu Panel (変更なし) */}
          {isMenuOpen && (
            <div className="bg-white border-2 border-black rounded-lg shadow-lg mb-2 w-48 overflow-hidden">
              {/* ... (省略) ... */}
              <div className="p-3 border-b-2 border-black">
                {status === "loading" ? (
                  <p className="text-sm animate-pulse">Loading...</p>
                ) : session && session.user ? (
                  <div className="flex items-center gap-3">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User Avatar"}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={18} />
                      </div>
                    )}
                    <span className="text-sm font-bold truncate">
                      {session.user.name || "User"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm font-bold">Not signed in</p>
                )}
              </div>
              <div className="flex flex-col text-sm">
                {session && (
                  <Link
                    href="/my-likes"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                    id="tutorial-menu-likes"
                  >
                    <Heart size={16} />
                    <span>いいねした投稿</span>
                  </Link>
                )}
                {session && (
                  <Link
                    href="/my-bookmarks"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <Bookmark size={16} />
                    <span>ブックマーク</span>
                  </Link>
                )}
                {session && (
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <UserCog size={16} />
                    <span>プロフィール編集</span>
                  </Link>
                )}
                <Link
                  href="/links"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <Info size={16} />
                  <span>インフォメーション</span>
                </Link>
                {/* ★ 3. チュートリアル再開ボタンを追加 */}
                <button
                  onClick={handleRestartTutorial}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <HelpCircle size={16} />
                  <span>チュートリアル</span>
                </button>
                {session ? (
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-left w-full px-3 py-2 hover:bg-gray-100 transition-colors border-t-2 border-black"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      signIn("google");
                      setIsMenuOpen(false);
                    }}
                    className="text-left w-full px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FAB */}
          <button
            id="tutorial-fab-button" // ★ 6. チュートリアル用のIDを追加
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-black text-white w-10 h-10 b-4 rounded-full flex items-center justify-center overflow-hidden shadow-lg hover:bg-gray-800 transition-transform active:scale-95"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X size={30} />
            ) : session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="User Avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={30} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
