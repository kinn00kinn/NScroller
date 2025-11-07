import React from "react";
import Link from "next/link";

const HelpPage = () => {
  const faqs = [
    {
      question: "NScrollerとは何ですか？",
      answer:
        'NScrollerは、AI分野の最新ニュースや技術記事、論文などを自動で集約し、タイムライン形式で手軽に閲覧できるAI特化型ニュースアグリゲーターです。詳しくは<a href="/about" class="text-blue-600 hover:underline">Aboutページ</a>をご覧ください。',
    },
    {
      question: "利用は無料ですか？",
      answer: "はい、当サービスのすべての機能は無料でご利用いただけます。",
    },
    {
      question: "どこから情報を集めているのですか？",
      answer:
        "OpenAI、Google DeepMind、Hugging Faceなどの主要なテックブログや、Zenn、Qiita、arXivといった国内外の信頼性の高い情報源からコンテンツを収集しています。",
    },
    {
      question: "フィードに表示する情報源をカスタマイズできますか？",
      answer:
        "現在のバージョン（MVP）では、情報源のカスタマイズ機能は提供しておりません。今後のアップデートで実装を検討しています。",
    },
    {
      question: "バグの報告やフィードバックはどこから送れますか？",
      answer:
        'ありがとうございます。バグ報告やサービスに関するご意見・ご感想は、<a href="/contact" class="text-blue-600 hover:underline">お問い合わせページ</a>よりご連絡いただけますと幸いです。',
    },
  ];

  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-4 py-3 border-b-2 border-black">
            <h1 className="text-xl font-bold text-center">ヘルプセンター</h1>
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
