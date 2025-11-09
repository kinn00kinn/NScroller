/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/links/ads/page.tsx の更新案
*/
import React from "react";
import Link from "next/link"; // ★ インポート追加
import { ArrowLeft } from "lucide-react"; // ★ インポート追加

const AdsPage = () => {
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
            <h1 className="text-xl font-bold">広告掲載のご案内</h1>
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
            {/* ★★★ ここから新規追加 ★★★ */}
            <section>
              <h2 className="text-xl font-bold mb-2">広告掲載プランのご提案</h2>
              <p className="mb-4">
                PanDoのタイムラインに自然に溶け込む、ドット絵スタイルの広告枠をご用意しています。
              </p>

              <div className="space-y-6">
                {/* --- プラン1 --- */}
                <div className="border-2 border-black rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">
                    プランA: タイムライン掲載プラン
                  </h3>
                  <p className="text-sm mb-3">
                    お客様がご用意した広告バナーを、タイムラインのフィード内に1ヶ月間掲載します。
                  </p>
                  <ul className="list-disc list-inside text-sm pl-4 space-y-1">
                    <li>掲載期間: 1ヶ月</li>
                    <li>表示箇所: タイムライン内 (一定間隔で表示)</li>
                    <li>形式: 画像バナー (お客様にてご用意)</li>
                  </ul>
                </div>

                {/* --- プラン2 --- */}
                <div className="border-2 border-black rounded-lg p-4 bg-gray-50">
                  <span className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                    おすすめ
                  </span>
                  <h3 className="font-bold text-lg mb-2">
                    プランB: ドット絵広告 制作・掲載プラン
                  </h3>
                  <p className="text-sm mb-3">
                    PanDoのサイトデザインを手掛けたドット絵クリエイターが、お客様のサービスや商品のためのオリジナル広告バナー（ドット絵）を制作し、タイムラインに1ヶ月間掲載します。
                  </p>
                  <ul className="list-disc list-inside text-sm pl-4 space-y-1">
                    <li>上記プランAの内容</li>
                    <li>PanDoクリエイターによる広告バナー制作</li>
                  </ul>
                </div>

                {/* --- 特典 --- */}
                <div className="border-2 border-black rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">
                    全プラン共通オプション
                  </h3>
                  <p className="text-sm mb-3">
                    広告効果を最大化するため、以下の特別な設定も可能です。
                  </p>
                  <ul className="list-disc list-inside text-sm pl-4 space-y-1">
                    <li>
                      広告記事専用の「いいね」「ブックマーク」アニメーション設定
                    </li>
                  </ul>
                </div>
              </div>
            </section>
            {/* ★★★ 追加ここまで ★★★ */}
            
            <section className="border-2 border-black p-4 text-center">
              <h2 className="text-xl font-bold mb-3">お問い合わせ</h2>
              <p className="mb-3">
                広告掲載に関するご相談、料金プラン、その他ご質問については、下記メールアドレスまでお気軽にお問い合わせください。
              </p>
              
              {/* ★ <a> タグを削除し、[at] 記法に変更 */}
              <div className="bg-gray-50 py-2">
                <p className="text-lg font-mono font-semibold text-black">
                  pando4408 [at] gmail.com
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  (お手数ですが、送信時に [at] を @ に置き換えてください)
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdsPage;
