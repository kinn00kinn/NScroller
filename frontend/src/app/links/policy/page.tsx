import React from "react";

const PolicyPage = () => {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-4 py-3 border-b-2 border-black">
            <h1 className="text-xl font-bold text-center">
              プライバシーポリシー
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
          <div className="space-y-6">
            <p className="text-sm text-right">最終更新日: 2025年11月4日</p>
            <p>
              NScroller（以下「当サービス」といいます）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーは、当サービスの利用に関して、どのような情報を収集し、どのように利用するかを定めたものです。
            </p>

            <section>
              <h2 className="text-xl font-bold mb-2">1. 収集する情報</h2>
              <p>
                当サービスは、MVP（最小プロダクト）段階において、ユーザー登録機能やコメント機能を提供しておりません。そのため、氏名、メールアドレス、住所、電話番号などの個人を直接特定できる情報（個人情報）を収集することはありません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">
                2. アクセス解析ツールによる情報収集
              </h2>
              <p>
                当サービスでは、サービス向上のため、第三者（例：Vercel
                Analytics, Google
                Analytics）が提供するアクセス解析ツールを利用しています。これらのツールは、トラフィックデータを収集するためにCookieを使用することがあります。収集される情報には以下のようなものが含まれますが、これらは匿名で収集されており、個人を特定するものではありません。
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>閲覧されたページ</li>
                <li>デバイスの種類やOS</li>
                <li>ブラウザの種類</li>
                <li>おおよその地理的地域</li>
              </ul>
              <p>
                収集されたデータは、各社のプライバシーポリシーに基づいて管理されます。Cookieを無効にすることで、収集を拒否することも可能ですので、お使いのブラウザの設定をご確認ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">3. 外部リンク</h2>
              <p>
                当サービスは、外部のニュース記事や論文へのリンクを提供しています。リンク先のウェブサイトにおける個人情報の取り扱いについては、当サービスは責任を負いかねます。リンク先のプライバシーポリシーをご確認ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">
                4. プライバシーポリシーの変更
              </h2>
              <p>
                当サービスは、法令の変更やサービスのアップデートに伴い、本プライバシーポリシーを改定することがあります。重要な変更がある場合は、当ページにてお知らせします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">5. お問い合わせ</h2>
              <p>
                本プライバシーポリシーに関するご質問は、
                <a href="/contact" className="text-blue-600 hover:underline">
                  お問い合わせページ
                </a>
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
