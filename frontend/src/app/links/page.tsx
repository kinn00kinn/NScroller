import React from "react";
import Link from "next/link";

const LinksPage = () => {
  const siteLinks = [
    { href: "links/about", text: "NScrollerについて" },
    { href: "links/terms", text: "利用規約" },
    { href: "links/policy", text: "プライバシーポリシー" },
    { href: "links/help", text: "ヘルプセンター" },
    { href: "links/ads", text: "広告掲載のご案内" },
    { href: "links/contact", text: "お問い合わせ" },
  ];

  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        <header className="w-full bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <a
            href="/"
            className="inline-block text-blue-600 border-y-2 border-x-2 border-black 
             p-2 mb-8 hover:bg-gray-100 transition-colors"
          >
            ◀PanDoに戻る
          </a>
          <div className="px-4 py-3 border-b-2 border-black">
            <h1 className="text-xl font-bold text-center">
              インフォメーション
            </h1>
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
