import Timeline from "@/app/components/Timeline";

export default function Home() {
  return (
    // ★ 画面全体を中央寄せにするためのラッパー
    // PCでは左右に余白ができ、スマホでは全幅になる
    <div className="flex justify-center bg-white text-black">
      {/* メインのコンテンツコンテナ (PCでの最大幅を設定) */}
      <div className="w-full max-w-xl">
        {/* ヘッダー: スケッチのデザインを忠実に再現 */}
        <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-10 ">
          <div className="flex justify-between items-center px-4 py-3 border-b-2 border-black">
            <h1 className="text-4xl font-extrabold tracking-tighter ">
              NScroller
            </h1>
          </div>
        </header>

        {/* タイムライン本体 (左右の境界線を追加) */}
        <main className="border-x-3 border-black">
          <Timeline />
        </main>
      </div>
    </div>
  );
}
