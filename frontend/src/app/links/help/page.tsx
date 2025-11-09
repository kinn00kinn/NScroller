/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/links/help/page.tsx の更新案
*/
import React from "react";
import Link from "next/link"; // ★ インポート追加
import { ArrowLeft } from "lucide-react"; // ★ インポート追加

const HelpPage = () => {
  const faqs = [
    {
      question: "PanDo (パンドゥ) とは何ですか？",
      answer:
        'PanDoは、パンダに関する最新ニュースやブログ記事、動画などを自動で集約し、タイムライン形式で手軽に閲覧できるパンダ特化型のアグリゲーションサービスです。詳しくは<a href="/links/about" class="text-blue-600 hover:underline">Aboutページ</a>をご覧ください。',
    },
    {
      question: "利用は無料ですか？",
      answer: "はい、当サービスのすべての機能は無料でご利用いただけます。",
    },
    {
      question: "どこから情報を集めているのですか？",
      answer:
        "国内外の主要な動物園、ニュースメディア、パンダ関連のブログなど、信頼性の高い情報源からコンテンツを収集しています。",
    },
    {
      question: "フィードに表示する情報源をカスタマイズできますか？",
      answer:
        "現在のバージョンでは、情報源のカスタマイズ機能は提供しておりません。今後のアップデートで実装を検討しています。",
    },
    {
      question: "バグの報告やフィードバックはどこから送れますか？",
      answer:
        'ありがとうございます。バグ報告やサービスに関するご意見・ご感想は、<a href="/links/contact" class="text-blue-600 hover:underline">お問い合わせページ</a>よりご連絡いただけますと幸いです。',
    },
  ];

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
            <h1 className="text-xl font-bold">ヘルプセンター</h1>
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
          <div className="space-y-6 pt-6">
            {" "}
            {/* ★ 削除したボタンの代わりにpt-6を追加 */}
            <p className="text-center">よくあるご質問</p>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`pb-4 ${
                  index < faqs.length - 1 ? "border-b-2 border-black" : ""
                }`}
              >
                <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                <p
                  className=""
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HelpPage;