/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/links/contact/page.tsx の更新案 (埋め込み対応版)
*/

// ★ 1. "use client" と Reactフックをインポート
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ContactPage = () => {
  // ★ 2. ステップ2で取得したご自身の情報に書き換えてください
  const GOOGLE_FORM_BASE_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSdbPuj_gYUhuiBzZ4q_yYDj64nHXiPq6PU5lbvNtf2BKfknQA/viewform?usp=dialog";
  const USER_AGENT_ENTRY_ID = "entry.1211414253"; // 例: "entry.123456789"

  // ★ 3. iframeのsrc属性を格納するState
  const [dynamicFormSrc, setDynamicFormSrc] = useState("");

  // ★ 4. ページがブラウザで読み込まれた時に1回だけ実行
  useEffect(() => {
    // navigatorオブジェクトはブラウザにしか存在しないため、useEffect内で使用します
    try {
      const userAgent = navigator.userAgent;

      // ユーザーエージェントをURLパラメータとしてエンコード
      const encodedUserAgent = encodeURIComponent(userAgent);

      // 埋め込みURLと自動入力IDを連結して、最終的なURLを生成
      const finalUrl = `${GOOGLE_FORM_BASE_URL}&${USER_AGENT_ENTRY_ID}=${encodedUserAgent}`;

      setDynamicFormSrc(finalUrl);
    } catch (error) {
      console.error("Failed to build form URL:", error);
      // エラー時は、環境情報なしの通常フォームを埋め込む
      setDynamicFormSrc(GOOGLE_FORM_BASE_URL);
    }
  }, []); // 空の配列[]を指定することで、ページ読み込み時に1回だけ実行されます

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
            <h1 className="text-xl font-bold">お問い合わせ</h1>
          </div>
        </header>

        <main className="border-x-2 border-b-2 border-black p-6">
          <div className="space-y-6 pt-6">
            <p>
              PanDo (パンドゥ) に関するご意見・ご感想は、
              以下のメールアドレスまでご連絡ください。
            </p>
            <div className="border-2 border-black p-4 bg-gray-50 text-center">
              <p className="text-lg font-mono font-semibold text-black">
                pando4408 [at] gmail.com
              </p>
              <p className="text-sm text-gray-600 mt-2">
                (お手数ですが、送信時に [at] を @ に置き換えてください)
              </p>
            </div>
            {/* ★ 5. バグ報告フォームを埋め込むセクション */}
            <div className="pt-4 border-t-2 border-black">
              <h2 className="text-xl font-bold mb-3 text-center">
                バグ報告フォーム
              </h2>
              <p className="text-center text-sm mb-4 text-gray-600">
                （※ご利用のOS・ブラウザ情報が自動入力されます）
              </p>

              {/* dynamicFormSrc がセットされたら iframe を表示する */}
              {dynamicFormSrc ? (
                <iframe
                  src={dynamicFormSrc}
                  width="100%"
                  height="800" // フォームの縦幅（適宜調整してください）
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                  className="border-2 border-black" // サイトの雰囲気に合わせて枠線を追加
                >
                  フォームを読み込んでいます…
                </iframe>
              ) : (
                <p className="text-center p-4 border-2 border-black border-dashed">
                  フォームを読み込んでいます…
                </p>
              )}
            </div>

            <div className="text-sm text-center text-gray-500">
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
