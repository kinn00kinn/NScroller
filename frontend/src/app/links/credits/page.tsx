/*
frontend/src/app/links/credits/page.tsx (新規作成)
*/
import React from "react";
import Link from "next/link"; // ★ インポート追加
import { ArrowLeft } from "lucide-react"; // ★ インポート追加

const CreditsPage = () => {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ★ ヘッダーを矢印アイコン形式に修正 */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-2 border-b-2 border-black flex items-center space-x-4">
          <Link
            href="/links"
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">素材・ライセンス</h1>
          </div>
        </header>

        <main className="border-x-2 border-b-2 border-black p-6">
          {/* ★ main タグ内の戻るボタンを削除 */}
          {/* <a
            href="/links"
            className="inline-block text-blue-600 border-y-2 border-x-2 border-black 
             p-2 mb-8 hover:bg-gray-100 transition-colors"
          >
            ◀Linkに戻る
          </a> */}
          <div className="space-y-8 pt-6">
            {" "}
            {/* ★ 削除したボタンの代わりにpt-6を追加 */}
            <section>
              <h2 className="text-xl font-bold mb-2">PanDo独自のアセット</h2>
              <p>
                当サービス「PanDo
                (パンドゥ)」のために独自に作成されたドット絵、イラスト、ロゴ、アニメーション（いいね・ブックマーク時のアニメーションGIFを含む）の著作権は、すべてPanDoの運営に帰属します。
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">
                テクノロジーとライブラリ
              </h2>
              <p className="mb-2">
                PanDoは、多くの素晴らしいオープンソース・ソフトウェアによって支えられています。この場を借りて感謝申し上げます。
              </p>
              <ul className="list-disc list-inside mt-2 pl-4 space-y-1 text-sm">
                <li>
                  <a
                    href="https://nextjs.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Next.js
                  </a>{" "}
                  (The React Framework)
                </li>
                <li>
                  <a
                    href="https://react.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    React
                  </a>{" "}
                  (The library for web and native user interfaces)
                </li>
                <li>
                  <a
                    href="https://supabase.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Supabase
                  </a>{" "}
                  (Open Source Firebase Alternative)
                </li>
                <li>
                  <a
                    href="https://swr.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    SWR
                  </a>{" "}
                  (React Hooks for Data Fetching)
                </li>
                <li>
                  <a
                    href="https://tailwindcss.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Tailwind CSS
                  </a>{" "}
                  (A utility-first CSS framework)
                </li>
                <li>
                  <a
                    href="https://next-auth.js.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    NextAuth.js
                  </a>{" "}
                  (Authentication for Next.js)
                </li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">アイコンとフォント</h2>
              <ul className="list-disc list-inside mt-2 pl-4 space-y-1 text-sm">
                <li>
                  <strong>フォント:</strong>{" "}
                  <a
                    href="https://vercel.com/font"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Geist Font
                  </a>{" "}
                  (by Vercel)
                </li>
                <li>
                  <strong>一部のアイコン:</strong>{" "}
                  <a
                    href="https://lucide.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Lucide
                  </a>{" "}
                  (by Lucide Contributors)
                </li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">ホスティング</h2>
              <ul className="list-disc list-inside mt-2 pl-4 space-y-1 text-sm">
                <li>
                  <a
                    href="https://vercel.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Vercel
                  </a>{" "}
                  (Frontend Cloud)
                </li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">情報源</h2>
              <p>
                当サービスに表示される記事、画像、およびその内容は、すべて元の情報提供元に帰属します。PanDoはこれらの情報を収集・集約するものであり、コンテンツの著作権を主張しません。
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreditsPage;