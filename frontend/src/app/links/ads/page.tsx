/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/links/ads/page.tsx の更新案
*/
import React from "react";

const AdsPage = () => {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-4 py-3 border-b-2 border-black">
            <h1 className="text-xl font-bold text-center">広告掲載のご案内</h1>
          </div>
        </header>
        <main className="border-x-2 border-b-2 border-black p-6">
          <a
            href="/links"
            className="inline-block text-blue-600 border-y-2 border-x-2 border-black 
             p-2 mb-8 hover:bg-gray-100 transition-colors"
          >
            ◀Linkに戻る
          </a>
          <div className="space-y-8">
            <p>
              パンダを愛する多くのユーザーに、あなたのプロダクトやサービスを届けませんか？
            </p>

            <section>
              <h2 className="text-xl font-bold mb-2">
                PanDoの強み: ターゲットオーディエンス
              </h2>
              <p>
                PanDoのユーザーは、パンダの最新動向に強い関心を持つ、熱心なオーディエンスです。日々の情報収集に意欲的な、以下のような方々に直接アプローチできます。
              </p>
              <ul className="list-disc list-inside mt-2 pl-4 space-y-1">
                <li>パンダ愛好家</li>
                <li>動物園ファン</li>
                <li>動物関連の情報を探しているご家族</li>
                <li>環境保護に関心のある方</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">なぜPanDoなのか？</h2>
              <p>
                一般的なSNSや広告プラットフォームとは異なり、PanDoは「パンダ」という単一のテーマに特化しています。ユーザーは明確な目的を持ってサービスを利用しているため、広告への関心度も高く、質の高いエンゲージメントが期待できます。
              </p>
            </section>

            <section className="border-2 border-black p-4 text-center">
              <h2 className="text-xl font-bold mb-3">お問い合わせ</h2>
              <p className="mb-3">
                広告掲載に関するご相談、料金プラン、その他ご質問については、下記メールアドレスまでお気軽にお問い合わせください。
              </p>
              <a
                href="mailto:ads@example.com?subject=PanDo広告掲載について"
                className="text-blue-600 hover:underline"
              >
                ads@example.com
              </a>
              <p className="mt-3 text-sm">（※これはサンプルアドレスです）</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdsPage;