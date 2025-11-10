import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import tsParser from "@typescript-eslint/parser";
import eslintJs from "@eslint/js";
import globals from "globals"; // ★ 1. `globals` をインポート

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // 1. デフォルト設定 (ESLint推奨)
  eslintJs.configs.recommended,

  // 2. Next.js のコア設定 ( 'eslint-config-next/core-web-vitals' に相当 )
  // Note: 以前の 'eslint-config-next' は、これらを個別にインポートする形になりました
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,mts,cts,tsx,mtsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "@next/next": nextPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules, // React 17+
      ...hooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...jsxA11yPlugin.configs.recommended.rules,
    },
    languageOptions: {
      parser: tsParser, // TypeScript パーサーを使用
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
        project: ["./tsconfig.json"], // tsconfig.json の場所
      },
      globals: {
        ...globals.browser, // ★ 2. ブラウザのグローバル変数をここに追加
        React: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        console: "readonly",
      },
    },
    settings: {
      react: {
        version: "detect", // 'react' のバージョンを自動検出
      },
    },
  },

  // 3. グローバル無視設定
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      ".env.local",
      "next-env.d.ts",
      "**/*.d.ts", // ★ この行を追加 (型定義ファイルを検査対象外にする)
    ],
  },
];
