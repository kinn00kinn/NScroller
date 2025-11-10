/*
kinn00kinn/pando/frontend/src/app/links/policy/page.tsx の更新案
*/
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const PolicyPage = () => {
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
            <h1 className="text-xl font-bold">プライバシーポリシー</h1>
          </div>
        </header>

        {/* メインコンテンツ (テキスト部分を修正) */}
        <main className="border-x-2 border-b-2 border-black p-6">
          <div className="space-y-6 pt-6">
            <p className="text-sm text-right">最終更新日: 2025年11月9日</p>
            <p>
              PanDo (パンドゥ)
              （以下「当サービス」といいます）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーは、当サービスの利用に関して、どのような情報を収集し、どのように利用するかを定めたものです。
            </p>

            <section>
              <h2 className="text-xl font-bold mb-2">1. 収集する情報</h2>
              <p>当サービスは、以下の情報を収集します。</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <strong>Google認証により提供される情報:</strong>
                  <br />
                  当サービスは、Google認証 (NextAuth.jsおよびSupabase
                  Adapterを使用)
                  を通じて、ユーザーの氏名、メールアドレス、プロフィール画像URLを取得します。これらは認証およびアカウント識別のためにのみ使用されます。
                </li>
                <li>
                  <strong>ユーザーが任意で提供する情報:</strong>
                  <br />
                  プロフィール編集機能を利用する場合、ユーザーはニックネーム（氏名とは別）およびプロフィール画像（Googleアカウントとは別）を任意で設定できます。アップロードされた画像は、Supabase
                  Storageに安全に保存されます。
                </li>
                <li>
                  <strong>サービス利用により自動的に収集される情報:</strong>
                  <br />
                  ユーザーが「いいね」、「ブックマーク」、「コメント」機能を利用した際、その操作履歴（どのユーザーがどの記事に対して操作を行ったか）がSupabaseデータベースに記録されます。
                </li>
                <li>
                  <strong>アクセス解析情報 (匿名):</strong>
                  <br />
                  サービス向上のため、Vercel AnalyticsやGoogle
                  Analyticsなどの第三者ツールを使用し、Cookieを通じて匿名のトラフィックデータ（閲覧ページ、デバイス情報、地域など）を収集する場合があります。
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">2. 情報の利用目的</h2>
              <p>収集した情報は、以下の目的で利用します。</p>
              <ul className="list-disc pl-6 mt-2">
                <li>ユーザー認証およびアカウント管理のため。</li>
                <li>コメント投稿者のニックネームやアイコンを表示するため。</li>
                <li>
                  「いいねした投稿」や「ブックマークした投稿」のリストをユーザーごとに提供するため。
                </li>
                <li>
                  サービスの利用状況を分析し、機能改善や不具合修正に役立てるため。
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">
                3. 情報の第三者提供および委託
              </h2>
              <p>
                当サービスは、以下の場合を除き、収集した個人情報をユーザーの同意なく第三者に提供することはありません。
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>法令に基づく開示請求があった場合。</li>
                <li>
                  サービスの運営に必要な範囲で、業務委託先に情報の取り扱いを委託する場合。
                  <br />
                  (例: データベースおよびストレージ機能のためにSupabase
                  Inc.、ホスティングのためにVercel Inc.、認証のためにGoogle
                  LLCにデータを保存・処理させる場合)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">4. ユーザーの権利</h2>
              <p>
                ユーザーは、当サービスのプロフィール編集ページから、いつでも自身のニックネームとプロフィール画像を更新できます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">5. 外部リンク</h2>
              <p>
                当サービスは、外部のニュース記事やブログへのリンクを提供しています。リンク先のウェブサイトにおける個人情報の取り扱いについては、当サービスは責任を負いかねます。リンク先のプライバシーポリシーをご確認ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">
                6. プライバシーポリシーの変更
              </h2>
              <p>
                当サービスは、法令の変更やサービスのアップデートに伴い、本プライバシーポリシーを改定することがあります。重要な変更がある場合は、当ページにてお知らせします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">7. お問い合わせ</h2>
              <p>
                本プライバシーポリシーに関するご質問は、
                <Link
                  href="/links/contact"
                  className="text-blue-600 hover:underline"
                >
                  お問い合わせページ
                </Link>
                よりご連絡ください。
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PolicyPage;
