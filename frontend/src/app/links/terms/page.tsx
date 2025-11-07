import React from "react";

const TermsPage = () => {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-4 py-3 border-b-2 border-black">
            <h1 className="text-xl font-bold text-center">利用規約</h1>
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
          <div className="space-y-6">
            <p className="text-sm text-right">施行日: 2025年11月4日</p>
            <p>
              この利用規約（以下「本規約」といいます）は、NScroller（以下「当サービス」といいます）の利用条件を定めるものです。当サービスを利用するすべてのユーザー（以下「ユーザー」といいます）は、本規約に同意したものとみなします。
            </p>

            <section>
              <h2 className="text-xl font-bold mb-2">第1条（サービス内容）</h2>
              <p>
                当サービスは、AI（人工知能）に関連する外部の技術ブログ、ニュース記事、論文等のコンテンツ（以下「外部コンテンツ」といいます）を自動的に収集し、ユーザーが閲覧しやすい形式で提供するニュースアグリゲーションサービスです。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">第2条（知的財産権）</h2>
              <p>
                当サービスを構成するテキスト、画像、デザイン、プログラムなどの著作権は、当サービスまたは正当な権利を有する第三者に帰属します。また、当サービスに表示される外部コンテンツの著作権およびその他の知的財産権は、各コンテンツの提供元または正当な権利者に帰属します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">第3条（禁止事項）</h2>
              <p>
                ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>
                  当サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
                </li>
                <li>
                  当サービスの情報を不正に収集（スクレイピング等）する行為
                </li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>当サービスの運営を妨害するおそれのある行為</li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">第4条（免責事項）</h2>
              <ul className="list-disc pl-6 mt-2">
                <li>
                  当サービスは、外部コンテンツの正確性、完全性、合法性、最新性について、一切の保証をしません。
                </li>
                <li>
                  当サービスは、ユーザーが当サービスを利用したこと、または利用できなかったことによって生じるいかなる損害についても、一切の責任を負いません。
                </li>
                <li>
                  当サービスは、予告なくサービスの内容を変更、中断、または終了することができるものとします。
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">第5条（本規約の変更）</h2>
              <p>
                当サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の利用規約は、当ページに掲載された時点から効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">
                第6条（準拠法・裁判管轄）
              </h2>
              <p>
                本規約の解釈にあたっては、日本法を準拠法とします。当サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TermsPage;
