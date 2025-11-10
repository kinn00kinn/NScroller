"use client";

import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm"; // GFM (テーブル、取り消し線など) のため
// import Link from "next/link"; // 内部リンク用
// ★ 1. `react-markdown` のコンポーネント型をインポート (TypeScriptエラー TS2339 対策)
import type { Components } from "react-markdown";

type MarkdownRendererProps = {
  content: string;
};

/**
 * Markdownコンテンツを安全にレンダリングするコンポーネントラッパー
 *
 * (プレビュー環境のエラーを回避するため、`remark-gfm` と `next/link` を無効化しています)
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // ★ 2. components の型を明示的に指定
  const components: Components = {
    // リンク (aタグ) をカスタマイズ
    // ★ 3. `node` を削除、`children` を分割代入 (no-unused-vars, react/prop-types 対策)
    a: ({ children, ...props }) => {
      // ★ next/link を使用せず、すべてaタグで開く
      // 外部リンク・内部リンク問わず新しいタブで開く
      return (
        <a
          {...props}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-medium" // ★ PanDoのリンク色に合わせて 'font-medium' を追加
        >
          {children}
        </a>
      );
    },
    // 見出し (h2)
    // ★ 3. `node` を削除、`children` を分割代入
    h2: ({ children, ...props }) => (
      <h2
        {...props}
        className="text-xl font-bold mt-8 mb-4 border-b-2 border-black pb-2" // ★ スペース調整
      >
        {children}
      </h2>
    ),
    // 見出し (h3)
    // ★ 3. `node` を削除、`children` を分割代入
    h3: ({ children, ...props }) => (
      <h3 {...props} className="text-lg font-bold mt-6 mb-3">
        {" "}
        {/* ★ シンプルに変更 */}
        {children}
      </h3>
    ),
    // リスト (ul)
    // ★ 3. `node` を削除、`children` を分割代入
    ul: ({ children, ...props }) => (
      <ul
        {...props}
        className="list-disc list-outside pl-6 space-y-2 my-4" // ★ list-outside と pl-6, space-y-2 に変更
      >
        {children}
      </ul>
    ),
    // リスト (ol)
    // ★ 3. `node` を削除、`children` を分割代入
    ol: ({ children, ...props }) => (
      <ol
        {...props}
        className="list-decimal list-outside pl-6 space-y-2 my-4" // ★ list-outside と pl-6, space-y-2 に変更
      >
        {children}
      </ol>
    ),
    // 段落 (p)
    // ★ 3. `node` を削除、`children` を分割代入
    p: ({ children, ...props }) => (
      <p {...props} className="leading-relaxed mb-4">
        {" "}
        {/* ★ my-3 を mb-4 に変更 */}
        {children}
      </p>
    ),
    // コードブロック (pre)
    // ★ 3. `node` を削除、`children` を分割代入
    pre: ({ children, ...props }) => (
      <pre
        {...props}
        className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm my-5 border-2 border-black" // ★ p-4, rounded-md, my-5 に変更
      >
        {children}
      </pre>
    ),
    // インラインコード (code)
    // ★ 3. `node` を削除、`inline` と `children` を分割代入 (TS2339, no-unused-vars, react/prop-types 対策)
    // ★ 修正: TS2339エラーを回避するため、Propsの型をインラインで明示的に定義します
    code: ({
      inline,
      children,
      ...props
    }: {
      inline?: boolean;
      children?: React.ReactNode;
      [key: string]: any;
    }) => {
      return inline ? (
        <code
          {...props}
          className="bg-gray-200 text-black font-mono px-1.5 py-0.5 rounded-md text-sm border border-gray-300" // ★ PanDoのモノクロテーマに合わせて調整
        >
          {children}
        </code>
      ) : (
        // コードブロック内の <code> タグには特別なスタイルを適用しない
        <code {...props}>{children}</code>
      );
    },
    // 引用 (blockquote)
    // ★ 3. `node` を削除、`children` を分割代入
    blockquote: ({ children, ...props }) => (
      <blockquote
        {...props}
        className="border-l-4 border-black pl-4 italic my-5 text-gray-700" // ★ my-5 と text-gray-700 を追加
      >
        {children}
      </blockquote>
    ),
  };

  return (
    // スタイリング用のラッパー
    <div className="markdown-content">
      <ReactMarkdown
        // remarkPlugins={[remarkGfm]} // ★ プレビューエラーのため無効化
        components={components} // ★ 4. 型定義済みの components を渡す
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
