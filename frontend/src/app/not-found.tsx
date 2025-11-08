/*
frontend/src/app/not-found.tsx (修正後)
*/
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react"; // ★ アイコンをインポート

export default function NotFound() {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ★ ヘッダー (他のリンクページと統一) */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-2 border-b-2 border-black flex items-center space-x-4">
          <Link
            href="/" // ホームに戻る
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">404 - Not Found</h1>
          </div>
        </header>

        {/* ★ メインコンテンツ (シンプル化) */}
        <main className="border-x-2 border-b-2 border-black p-6 md:p-12">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* ★ 色と画像を削除し、シンプルなアイコンに変更 */}
            <div className="w-32 h-32 rounded-full border-4 border-black flex items-center justify-center bg-gray-100">
              <SearchX size={64} className="text-black" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold">
              ページがみつからないパン！
            </h2>
            <p className="text-lg text-gray-700">
              お探しのページは、どこかへ迷子になってしまったようです…
            </p>

            {/* ★ ボタンの色を削除し、白黒ベースに変更 */}
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-black rounded-full shadow-md text-lg font-bold bg-white text-black hover:bg-gray-100 transition-colors duration-200"
            >
              ホームへ戻るパン！
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
