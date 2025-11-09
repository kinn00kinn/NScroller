"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
// date-fns から日本語と英語のロケールをインポート
import { ja, enUS } from "date-fns/locale";

// --- 型定義 ---
type Language = "ja" | "en";
type Locale = typeof ja | typeof enUS;

// --- 翻訳テキスト ---
// ★ 型推論のために、先にオブジェクトを定義します
const translations = {
  ja: {
    // --- page.tsx (FAB Menu) ---
    myLikes: "いいねした投稿",
    myBookmarks: "ブックマーク",
    profileEdit: "プロフィール編集",
    information: "インフォメーション",
    tutorial: "チュートリアル",
    signOut: "Sign Out",
    signIn: "Sign in with Google",
    language: "Language",

    // --- FeedSorter.tsx ---
    recent: "最新",
    likes: "いいね",

    // --- ArticleCard.tsx ---
    likeAlert: "いいね機能を利用するにはログインが必要です。",
    bookmarkAlert: "ブックマーク機能を利用するにはログインが必要です。",
    shareModalTitle: "記事を共有",
    shareOnX: "X (Twitter) で共有",
    shareOnFacebook: "Facebook で共有",
    shareOnLine: "LINE で共有",
    copyUrl: "URLをコピー",
    copiedUrl: "コピーしました！",

    // --- ArticleDetailClient.tsx (Comments) ---
    postComment: "返信",
    postingComment: "投稿中...",
    commentPlaceholder: "返信を投稿...",
    loginToComment: "コメントするにはログインが必要です。",
    noComments: "まだコメントはありません。",
    loadCommentsError: "コメントの読み込みに失敗しました。",

    // --- Page Headers (my-likes, my-bookmarks, profile) ---
    myLikesTitle: "いいねした投稿",
    myBookmarksTitle: "ブックマーク",
    profileTitle: "プロフィール編集",

    // --- profile/page.tsx ---
    changeIcon: "アイコンを変更",
    nickname: "ニックネーム",
    save: "保存する",
    saving: "保存中...",
    saved: "保存しました",

    // --- not-found.tsx ---
    notFoundTitle: "404 - Not Found",
    notFoundHeading: "ページがみつからないパン！",
    notFoundBody: "お探しのページは、どこかへ迷子になってしまったようです…",
    notFoundButton: "ホームへ戻るパン！",
  },
  en: {
    // (中略: 英語の翻訳)
    // ...
    myLikes: "Liked Posts",
    myBookmarks: "Bookmarks",
    profileEdit: "Edit Profile",
    information: "Information",
    tutorial: "Tutorial",
    signOut: "Sign Out",
    signIn: "Sign in with Google",
    language: "言語",
    recent: "Recent",
    likes: "Likes",
    likeAlert: "Login is required to use the like feature.",
    bookmarkAlert: "Login is required to use the bookmark feature.",
    shareModalTitle: "Share Article",
    shareOnX: "Share on X (Twitter)",
    shareOnFacebook: "Share on Facebook",
    shareOnLine: "Share on LINE",
    copyUrl: "Copy URL",
    copiedUrl: "Copied!",
    postComment: "Reply",
    postingComment: "Replying...",
    commentPlaceholder: "Post your reply...",
    loginToComment: "You must be logged in to comment.",
    noComments: "No comments yet.",
    loadCommentsError: "Failed to load comments.",
    myLikesTitle: "Liked Posts",
    myBookmarksTitle: "Bookmarks",
    profileTitle: "Edit Profile",
    changeIcon: "Change Icon",
    nickname: "Nickname",
    save: "Save",
    saving: "Saving...",
    saved: "Saved",
    notFoundTitle: "404 - Not Found",
    notFoundHeading: "Page Not Found!",
    notFoundBody: "The page you are looking for seems to have gotten lost...",
    notFoundButton: "Back to Home",
  },
};

// ★ 変更点 1: 'ja' のキーから TranslationKeys 型を自動生成
type TranslationKeys = keyof (typeof translations)["ja"];

// ★ 変更点 2: 't' 関数の引数に 'string' ではなく 'TranslationKeys' を使用
interface LanguageContextType {
  lang: Language;
  locale: Locale; // date-fns用のロケール
  toggleLanguage: () => void;
  t: (key: TranslationKeys) => string; // 翻訳関数
}

// --- コンテキストの作成 ---
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// --- プロバイダーコンポーネント ---
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>("ja");

  // 言語切り替え関数
  const toggleLanguage = useCallback(() => {
    setLang((prevLang) => (prevLang === "ja" ? "en" : "ja"));
  }, []);

  // useMemoでロケールと翻訳関数をメモ化
  const value = useMemo(() => {
    const locale = lang === "ja" ? ja : enUS;

    // キーに基づいて翻訳テキストを返す関数
    const t = (key: TranslationKeys): string => {
      // 英語の翻訳が存在しない場合は、安全策として日本語のテキストを返す
      return translations[lang][key] || translations["ja"][key];
    };

    return { lang, locale, toggleLanguage, t };
  }, [lang, toggleLanguage]);

  return (
    // この 'value' が LanguageContextType と一致するようになります
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// --- カスタムフック ---
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
