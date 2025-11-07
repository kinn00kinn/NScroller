/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/links/about/page.tsx の更新案
*/
import React from "react";

const AboutPage = () => {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-4 py-3 border-b-2 border-black">
            <h1 className="text-xl font-bold text-center">
              PanDo (パンドゥ) について
            </h1>
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
            <section>
              <h2 className="text-xl font-bold mb-2">PanDo (パンドゥ) とは？</h2>
              <p>
                PanDo (パンドゥ)
                は、世界中のパンダに関する最新ニュース、ブログ、動画などを自動で集約し、X（旧Twitter）のようなタイムライン形式で「受動的」に最新情報をキャッチアップできる、パンダ特化型の情報アグリゲーションサービスです。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">解決する課題</h2>
              <p className="mb-2">
                パンダに関する情報は、数多くの動物園公式サイト、ニュースサイト、個人のブログやSNSに散らばっており、すべてを個別にチェックするのは大変な労力です。PanDoは、この「情報の洪水」と「巡回の手間」という課題を解決します。
              </p>
              <p>
                従来のRSSリーダーのように自ら記事を探しに行く「能動的」な情報収集ではなく、タイムラインを眺めるだけで自然と情報が目に入る「受動的」な体験を提供し、忙しいあなたの情報収集をサポートします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">主な情報源</h2>
              <p>
                PanDoでは、信頼性の高い以下の情報源からコンテンツを収集しています。（順次拡大予定）
              </p>
              <ul className="list-disc list-inside mt-2 pl-4 space-y-1">
                <li>国内外の主要な動物園（上野動物園、アドベンチャーワールドなど）</li>
                <li>主要なニュースメディア（パンダ関連）</li>
                <li>動物保護団体の公式ブログ</li>
                <li>パンダ関連の主要な個人ブログやSNS</li>
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AboutPage;