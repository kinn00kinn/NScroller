/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/links/contact/page.tsx の更新案
*/
import React from "react";
import Link from "next/link"; // ★ インポート追加
import { ArrowLeft } from "lucide-react"; // ★ インポート追加

const ContactPage = () => {
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
            <h1 className="text-xl font-bold">お問い合わせ</h1>
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
          <div className="text-center space-y-6 pt-6">
            {" "}
            {/* ★ 削除したボタンの代わりにpt-6を追加 */}
            <p>
              PanDo (パンドゥ)
              に関するご意見・ご感想、バグのご報告、その他のお問い合わせは、下記のメールアドレスまでお気軽にご連絡ください。
            </p>
            <div className="border-2 border-black p-4">
              <a
                href="mailto:contact@example.com?subject=PanDoへのお問い合わせ"
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