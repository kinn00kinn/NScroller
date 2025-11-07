/*
kinn00kinn/pando/PanDo-f8b140cd538de0b9dffd171838892a1e2efe0883/frontend/src/app/components/InteractiveTutorial.tsx の修正
*/
"use client";

import React, { useState, useLayoutEffect, useEffect, useRef } from "react";

// ★ 1. チュートリアルステップを 5 -> 6 に変更
const tutorialSteps = [
  {
    selector: "#tutorial-header-banner",
    title: "上に戻る",
    content:
      "タイムラインをスクロールした後、このバナーをクリックすると一番上まですばやく戻れます。",
    position: "bottom",
    align: "center", // ★
  },
  {
    selector: "#tutorial-like-button",
    title: "いいねボタン",
    content:
      "「いいな！」と思ったら気軽に押してください。いいねした投稿は後でメニューから一覧できます。",
    position: "bottom",
    align: "center", // ★
  },
  {
    selector: "#tutorial-bookmark-button",
    title: "ブックマークボタン",
    content: "後で見返したい投稿は、ここを押して保存できます。",
    position: "bottom",
    align: "center", // ★
  },
  {
    selector: "#tutorial-comment-button",
    title: "返信ボタン",
    content:
      "この投稿についてコメントしたい場合は、ここを押して詳細ページに移動します。",
    position: "bottom",
    align: "center", // ★
  },
  {
    selector: "#tutorial-fab-button",
    title: "メニューを開く", // ★ 2. タイトルと内容を変更
    content: "ここをクリックすると、各種メニューが開きます。",
    position: "left",
    align: "center", // ★
  },
  {
    selector: "#tutorial-menu-likes", // ★ 3. 新しいステップ (Step 6) を追加
    title: "メニュー",
    content:
      "「いいね一覧」や「プロフィール編集」など、さまざまな機能にここからアクセスできます。",
    position: "left",
    align: "center", // ★
  },
];

type Props = {
  show: boolean;
  onComplete: () => void;
};

// ★ 4. メニューを閉じるヘルパー関数
const closeMenuIfOpen = () => {
  // メニュー項目（#tutorial-menu-likes）が画面に表示されているかチェック
  const menuLikes = document.querySelector("#tutorial-menu-likes");
  if (menuLikes) {
    // 表示されている＝メニューが開いているので、FABをクリックして閉じる
    const fab = document.querySelector("#tutorial-fab-button") as HTMLElement;
    if (fab) {
      fab.click();
    }
  }
};

export default function InteractiveTutorial({ show, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, opacity: 0 });
  const highlightedElementRef = useRef<Element | null>(null);
  // ★ 2. show が true になるたびにステップをリセットする Effect を追加
  useEffect(() => {
    if (show) {
      setCurrentStep(0); // ステップを最初に戻す
    }
  }, [show]); // show プロパティを監視

  useLayoutEffect(() => {
    if (!show || currentStep >= tutorialSteps.length) {
      return;
    }
    if (highlightedElementRef.current) {
      highlightedElementRef.current.classList.remove("tutorial-highlight");
      highlightedElementRef.current = null;
    }
    setPopoverPos({ top: 0, left: 0, opacity: 0 });

    const step = tutorialSteps[currentStep];

    let attempts = 0;
    const maxAttempts = 200; // 20秒待機
    const interval = setInterval(() => {
      const element = document.querySelector(step.selector);

      if (element) {
        clearInterval(interval);
        element.classList.add("tutorial-highlight");
        highlightedElementRef.current = element;

        // ★ 5. クリックをシミュレート
        // if (currentStep === 5) {
        //   // Step 5 (インデックス 4) の場合、クリックしてメニューを開く
        //   (element as HTMLElement).click();
        // }

        // ★★★ ポップオーバー位置計算ロジックの刷新 ★★★
        const rect = element.getBoundingClientRect();
        const POPOVER_WIDTH = 280; // CSSのmax-width
        const POPOVER_HEIGHT_ESTIMATE = 180; // ポップオーバーのおおよその高さ (ボタン込)
        const PADDING = 16; // 要素とポップオーバーの間の余白
        const SCREEN_MARGIN = 16; // 画面端からのマージン

        let newTop = 0;
        let newLeft = 0;

        // --- 垂直位置 (Y) の決定 ---
        // 要素が画面の「下半分」にあるか？
        if (rect.top > window.innerHeight / 2) {
          // 下半分にある -> ポップオーバーを「上」に表示
          newTop = rect.top - POPOVER_HEIGHT_ESTIMATE - PADDING;
        } else {
          // 上半分にある -> ポップオーバーを「下」に表示
          newTop = rect.bottom + PADDING;
        }

        // --- 水平位置 (X) の決定 ---
        if (step.position === "left") {
          // メニューボタン用: 要素の「左」に表示
          newLeft = rect.left - POPOVER_WIDTH - PADDING;
        } else {
          // (position: "bottom" など)
          // デフォルト: 要素の中央に合わせる
          newLeft = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
        }

        // --- 画面外にはみ出ないように補正 ---
        // 水平方向
        if (newLeft < SCREEN_MARGIN) {
          newLeft = SCREEN_MARGIN;
        } else if (
          newLeft + POPOVER_WIDTH >
          window.innerWidth - SCREEN_MARGIN
        ) {
          newLeft = window.innerWidth - POPOVER_WIDTH - SCREEN_MARGIN;
        }
        // 垂直方向 (はみ出しそうなら画面端に固定)
        if (newTop < SCREEN_MARGIN) {
          newTop = SCREEN_MARGIN;
        } else if (
          newTop + POPOVER_HEIGHT_ESTIMATE >
          window.innerHeight - SCREEN_MARGIN
        ) {
          newTop = window.innerHeight - POPOVER_HEIGHT_ESTIMATE - SCREEN_MARGIN;
        }

        // スクロールオフセットを追加して、最終的なドキュメント座標に変換
        newTop += window.scrollY;
        newLeft += window.scrollX;

        setPopoverPos({ top: newTop, left: newLeft, opacity: 1 });

        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      } else if (attempts > maxAttempts) {
        clearInterval(interval);
        console.warn(`Tutorial element not found after 20s: ${step.selector}`);
        setCurrentStep((s) => s + 1);
      }
      attempts++;
    }, 100);

    return () => {
      clearInterval(interval);
      // ★ 6. クリーンアップ時にハイライトを消す（メニュー閉じは行わない）
      const el = document.querySelector(step.selector);
      if (el) {
        el.classList.remove("tutorial-highlight");
      }
    };
  }, [currentStep, show]);

  // "次へ" ボタン
  const handleNext = () => {
    if (currentStep === 4) {
      // Step 5 ("メニューを開く") の「次へ」が押された時
      const fab = document.querySelector("#tutorial-fab-button") as HTMLElement;
      if (fab) {
        fab.click(); // メニューを開く
      }
    }

    // ★ 3. 最後のステップ (index 5) で「次へ」が押された時
    if (currentStep === 5) {
      closeMenuIfOpen(); // メニューを閉じる
    }
    setCurrentStep((s) => s + 1);
  };

  // "スキップ" ボタン
  const handleSkip = () => {
    // ★ 8. スキップ時、メニューが開いていたら閉じる
    if (currentStep === 4 || currentStep === 5) {
      closeMenuIfOpen();
    }
    onComplete();
    setCurrentStep(tutorialSteps.length);
  };

  if (!show || currentStep >= tutorialSteps.length) {
    if (show && currentStep === tutorialSteps.length) {
      onComplete();
    }
    return null;
  }

  const step = tutorialSteps[currentStep];

  return (
    <>
      <div className="tutorial-overlay" />
      <div
        className="tutorial-popover"
        style={{
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
          opacity: popoverPos.opacity,
        }}
      >
        <h3 className="text-lg font-bold mb-2">{step.title}</h3>
        <p className="text-sm mb-4">{step.content}</p>
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:underline"
          >
            スキップ
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700"
          >
            {/* ★ 9. 最後のステップ (index 5) のボタンテキストを「完了」に変更 */}
            {currentStep === tutorialSteps.length - 1 ? "完了" : "次へ"} (
            {currentStep + 1} / {tutorialSteps.length})
          </button>
        </div>
      </div>
    </>
  );
}
