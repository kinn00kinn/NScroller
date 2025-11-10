import React from "react";
import Link from "next/link";
import Image from "next/image"; // ★ Image コンポーネントをインポート
import {
  ArrowLeft,
  Rss, // ★ news
  FileText, // ★ credits, terms
  Shield, // ★ policy
  Megaphone, // ★ ads
  Mail, // ★ contact (send.png が「共有」のイメージが強いため)
} from "lucide-react";

const LinksPage = () => {
  // ★ リンクに「アイコン」と「説明文」を追加
  const siteLinks = [
    {
      href: "links/about",
      text: "PanDo (パンドゥ) について",
      description: "このサービスが目指すもの",
      icon: (
        <Image
          src="/icon/exclamation.png"
          alt="about"
          width={24}
          height={24}
          unoptimized
        />
      ),
    },
    {
      href: "links/news",
      text: "公式からのお知らせ",
      description: "アップデートやメンテナンス情報",
      icon: <Rss size={24} />, // lucide
    },
    {
      href: "links/help",
      text: "よくある質問 (FAQ)",
      description: "使い方や疑問点はこちら",
      icon: (
        <Image
          src="/icon/question.png"
          alt="help"
          width={24}
          height={24}
          unoptimized
        />
      ),
    },
    {
      href: "links/credits",
      text: "素材・ライセンス",
      description: "お世話になった技術や素材",
      icon: <FileText size={24} />, // lucide
    },
    {
      href: "links/developer",
      text: "開発者紹介",
      description: "このサービスを作った人",
      icon: (
        <Image
          src="/icon/developer.jpeg"
          alt="developer"
          width={24}
          height={24}
          unoptimized
          className="rounded-full border border-black"
        />
      ),
    },
    {
      href: "links/creator",
      text: "クリエイター紹介",
      description: "素敵なドット絵を作った人",
      icon: (
        <Image
          src="/icon/creater.jpg" // ★ creater.jpg を使用
          alt="creator"
          width={24}
          height={24}
          className="rounded-full border border-black" // ★ 丸くする
          unoptimized
        />
      ),
    },
    {
      href: "links/terms",
      text: "利用規約",
      description: "サービスのルール",
      icon: <FileText size={24} />, // lucide
    },
    {
      href: "links/policy",
      text: "プライバシーポリシー",
      description: "個人情報の取り扱いについて",
      icon: <Shield size={24} />, // lucide
    },
    {
      href: "links/ads",
      text: "広告掲載について",
      description: "サービスへの広告出稿",
      icon: <Megaphone size={24} />, // lucide
    },
    {
      href: "links/contact",
      text: "お問い合わせ",
      description: "バグ報告・ご意見はこちら",
      icon: <Mail size={24} />, // lucide (send.png より Mail が適切と判断)
    },
  ];

  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl">
        {/* ヘッダー (変更なし) */}
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
                className={`flex items-center space-x-4 p-4 hover:bg-gray-100 transition-colors duration-200 ${
                  index < siteLinks.length - 1 ? "border-b-2 border-black" : ""
                }`}
              >
                {/* ★ アイコン用のコンテナ */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  {link.icon}
                </div>

                {/* ★ テキストと説明文 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate">
                    {link.text}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {link.description}
                  </p>
                </div>

                {/* ★ 右矢印（雰囲気） */}
                <div className="flex-shrink-0 text-gray-400">
                  {/* シンプルなSVG矢印 */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 12L10 8L6 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LinksPage;
