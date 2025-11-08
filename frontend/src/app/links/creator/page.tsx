/*
frontend/src/app/links/creator/page.tsx (新規作成)
*/
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
// import Image from "next/image";

const CreatorPage = () => {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ヘッダー */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-2 border-b-2 border-black flex items-center space-x-4">
          <Link
            href="/links"
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">クリエイター紹介</h1>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="border-x-2 border-b-2 border-black p-6">
          <div className="space-y-8">
            {/* クリエイター プロフィールセクション */}
            <section className="flex flex-col items-center text-center">
              {/* ★ 要設定: 
                ここにクリエイターのアイコン画像パスを設定します。
                (例: /images/creator_avatar.png)
                設定が完了したら、下のプレースホルダー(<svg>)は削除してください。
              */}
              <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
                {/* <Image
                  src="/images/creator_avatar.png" 
                  alt="Creator Avatar"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
                */}
                {/* --- 以下はプレースホルダー --- */}
                <svg
                  className="w-24 h-24 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                {/* --- プレースホルダーここまで --- */}
              </div>

              <h2 className="text-2xl font-bold">
                [クリエイター名 / ハンドル名]
              </h2>
              <p className="text-sm text-gray-500">[肩書き / @HandleName]</p>
            </section>

            {/* 自己紹介セクション */}
            <section>
              <h3 className="text-xl font-bold mb-2">ごあいさつ</h3>
              <p className="text-gray-800 leading-relaxed">
                PanDoのロゴ、バナー、アイコン、アニメーションなどのドット絵アセットは、[クリエイター名]様によって制作されました。
                <br />
                <br />
                ここにクリエイターからの自己紹介や、PanDoの世界観に込めた思いなどを記載します。
                <br />
                (例：ご覧いただきありがとうございます。パンダの可愛らしさと、ピクセルアートの温かみが伝わるように一つ一つ心を込めて作成しました。...)
              </p>
            </section>

            {/* リンク集セクション */}
            <section>
              <h3 className="text-xl font-bold mb-3 text-center">
                クリエイターの活動
              </h3>
              <div className="flex justify-center gap-4 flex-wrap">
                {/* テンプレート: X (Twitter) */}
                <a
                  href="https://twitter.com/[YourHandle]" // ★ 要変更
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-white bg-black border-2 border-black px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  X (Twitter)
                </a>

                {/* テンプレート: ポートフォリオ */}
                <a
                  href="https://[YourPortfolio.com]" // ★ 要変更
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-black bg-white border-2 border-black px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  ポートフォリオ
                </a>

                {/* テンプレート: その他 (例: pixiv, Instagramなど) */}
                <a
                  href="https://[YourOtherSite.com]" // ★ 要変更
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-black bg-white border-2 border-black px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  [その他サイト]
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreatorPage;
