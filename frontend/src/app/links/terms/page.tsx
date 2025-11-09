/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/links/terms/page.tsx の更新案
*/
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const TermsPage = () => {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ヘッダー (変更なし) */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-2 border-b-2 border-black flex items-center space-x-4">
          <Link
            href="/links"
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">利用規約</h1>
          </div>
        </header>

        {/* メインコンテンツ (テキスト部分を修正) */}
        <main className="border-x-2 border-b-2 border-black p-6">
          <div className="space-y-6 pt-6">
            <p className="text-sm text-right">施行日: 2025年11月9日</p>
            <p>
              この利用規約（以下「本規約」といいます）は、PanDo (パンドゥ)
              （以下「当サービス」といいます）の利用条件を定めるものです。当サービスを利用するすべてのユーザー（以下「ユーザー」といいます）は、本規約に同意した上で当サービスを利用するものとみなします。
            </p>

            <section>
              <h2 className="text-xl font-bold mb-2">第1条（適用）</h2>
              <p>
                本規約は、ユーザーと当サービスとの間の当サービスの利用に関わる一切の関係に適用されるものとします。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-2">第2条（アカウント）</h2>
              <p>
                当サービスの一部の機能（コメント、いいね、ブックマーク、プロフィール編集）を利用するには、Googleアカウントによる認証（以下「アカウント」といいます）が必要です。
                ユーザーは、自己の責任において、アカウントを不正に利用されないよう管理するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">
                第3条（ユーザー投稿コンテンツ）
              </h2>
              <p>
                1. ユーザーが当サービスに投稿したコメント（以下「投稿コンテンツ」といいます）の著作権は、当該投稿を行ったユーザー本人に帰属します。
              </p>
              <p>
                2.
                ただし、ユーザーは、投稿コンテンツを送信した時点で、当サービスに対し、当該投稿コンテンツをサービスの提供、改善、宣伝広告に必要な範囲（例：コメントの表示、複製）において、無償、無期限、非独占的に使用する権利を許諾したものとみなします。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-2">第4条（禁止事項）</h2>
              <p>
                ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>
                  他人の知的財産権（著作権、商標権等）、プライバシー権、肖像権、その他の権利または利益を侵害する行為
                </li>
                <li>
                  他人になりすます行為、または意図的に虚偽の情報を流布させる行為
                </li>
                <li>
                  当サービスのサーバーまたはネットワークの機能を破壊したり、過度な負荷をかけたりする行為
                </li>
                <li>
                  当サービスの情報を不正に収集（スクレイピング、クローリング等）する行為
                </li>
                <li>
                  当サービスの運営を妨害するおそれのある行為（スパム行為、不正アクセス等）
                </li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">
                第5条（アカウントの停止・削除）
              </h2>
              <p>
                当サービスは、ユーザーが本規約のいずれかの条項に違反したと判断した場合、事前の通知なく、当該ユーザーのアカウント停止、または投稿コンテンツの削除を行うことができるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">第6条（免責事項）</h2>
              <ul className="list-disc pl-6 mt-2">
                <li>
                  当サービスは、収集した外部コンテンツの正確性、完全性、合法性、最新性、安全性について、一切の保証をしません。外部コンテンツの利用は、ユーザー自身の責任において行うものとします。
                </li>
                <li>
                  ユーザーが投稿した投稿コンテンツについて、当サービスは一切の責任を負いません。ユーザー間のトラブルは、当事者間で解決するものとします。
                </li>
                <li>
                  当サービスは、システムの障害、メンテナンス、またはその他の理由により、予告なくサービスの一部または全部を中断、変更、または終了することができるものとします。
                </li>
                <li>
                  当サービスは、ユーザーが当サービスを利用したこと、または利用できなかったことによって生じるいかなる損害についても、一切の責任を負いません。
                </li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-2">第7条（本規約の変更）</h2>
              <p>
                当サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の利用規約は、当ページに掲載された時点から効力を生じるものとします。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-2">
                第8条（準拠法・裁判管轄）
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