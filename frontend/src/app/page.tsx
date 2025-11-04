'use client'; // ★ クライアントコンポーネントとして動作させる

import Timeline from "@/app/components/Timeline";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react"; // ★ 追加

export default function Home() {
  const { data: session, status } = useSession(); // ★ 追加

  return (
    // ★ 画面全体を中央寄せにするためのラッパー
    // PCでは左右に余白ができ、スマホでは全幅になる
    <div className="flex justify-center bg-white text-black">
      {/* メインのコンテンツコンテナ (PCでの最大幅を設定) */}
      <div className="w-full max-w-xl">
        {/* ヘッダー: スケッチのデザインを忠実に再現 */}
        <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-10 ">
          {/* ★ 修正: 要素がImageのみになったため、flexレイアウト関連のクラスを削除 */}
          <div className="px-4 py-3 border-b-2 border-black">
            <Image
              src="/Pando_banner_1000.gif" // ★ 修正: publicフォルダからのパス
              alt="NScroller Logo"
              width={400} // アスペクト比のヒント (例: 400:40 = 10:1)
              height={40} // アスペクト比のヒント
              className="w-full h-auto" // ★ 追加: 親要素(padding適用後)の幅いっぱいに表示
              unoptimized // ★ GIF画像の場合は最適化をオフ
            />
          </div>
          {/* ★★★ 認証状態の表示を追加 ★★★ */}
          <div className="px-4 py-2 border-b-2 border-black flex justify-between items-center">
            {status === "loading" ? (
              <p>Loading...</p>
            ) : session ? (
              <div className="flex items-center gap-4 w-full">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div className="flex-grow">
                  <p className="text-sm font-bold">{session.user?.name}</p>
                  <p className="text-xs text-gray-600">{session.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 whitespace-nowrap"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <p className="flex-grow">Not signed in.</p>
                <button
                  onClick={() => signIn("google")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 whitespace-nowrap"
                >
                  Sign in with Google
                </button>
              </div>
            )}
          </div>
          {/* ★★★ ここまで ★★★ */}
        </header>

        {/* タイムライン本体 (左右の境界線を追加) */}
        <main className="border-x-2 border-black">
          <Timeline />
        </main>
      </div>
    </div>
  );
}
