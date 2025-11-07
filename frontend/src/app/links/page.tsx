import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react"; // ★ ArrowLeft をインポート

const LinksPage = () => {
  // ★ リンクのテキストと順序を修正
  const siteLinks = [
    { href: "links/about", text: "PanDo (パンドゥ) について" },
    { href: "links/help", text: "よくある質問 (FAQ)" },
    { href: "links/credits", text: "素材・ライセンス" }, // ★ 新規追加
    { href: "links/terms", text: "利用規約" },
    { href: "links/policy", text: "プライバシーポリシー" },
    { href: "links/ads", text: "広告掲載について" },
    { href: "links/contact", text: "お問い合わせ" },
  ];

  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ★ ヘッダーを修正 (my-likes ページなどと統一) */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-2 border-b-2 border-black flex items-center space-x-4">
          <Link
            href="/" // ホームに戻る
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">インフォメーション</h1>
          </div>
        </header>

        <main className="border-x-2 border-b-2 border-black">
          <div>
            {siteLinks.map((link, index) => (
              <Link
                href={link.href}
                key={link.href}
                className={`block p-4 hover:bg-gray-100 transition-colors duration-200 ${
                  index < siteLinks.length - 1 ? "border-b-2 border-black" : ""
                }`}
              >
                <h3 className="text-lg font-semibold">{link.text}</h3>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LinksPage;