import React from "react";

const ContactPage = () => {
  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-4 py-3 border-b-2 border-black">
            <h1 className="text-xl font-bold text-center">お問い合わせ</h1>
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
          <div className="text-center space-y-6">
            <p>
              NScrollerに関するご意見・ご感想、バグのご報告、その他のお問い合わせは、下記のメールアドレスまでお気軽にご連絡ください。
            </p>

            <div className="border-2 border-black p-4">
              <a
                href="mailto:contact@example.com?subject=NScrollerへのお問い合わせ"
                className="text-blue-600 hover:underline font-semibold"
              >
                contact@example.com
              </a>
            </div>

            <div className="text-sm">
              <p>（※これはサンプルアドレスです）</p>
              <p className="mt-2">
                すべてのお問い合わせに返信できない場合がございます。あらかじめご了承ください。
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContactPage;
