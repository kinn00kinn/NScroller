
# NScroller - フロントエンド

このリポジトリは、「Niche Scroller (AI Edition)」のフロントエンド機能を管理します。
Next.js (App Router) で構築されており、Vercelへのホスティングを想定しています。

## 1. 機能

-   AI関連ニュースの無限スクロール表示
-   バックエンドが提供するデータ提供API (`/api/posts`)

## 2. セットアップ

1.  **リポジトリのクローン**

2.  **Node.js環境の構築**
    Node.js 18.17以上を推奨します。

3.  **依存関係のインストール**
    `frontend` ディレクトリに移動し、以下のコマンドを実行します。
    ```bash
    npm install
    ```

4.  **環境変数の設定**
    `frontend` ディレクトリに `.env.local` という名前のファイルを作成し、Supabaseプロジェクトの情報を記述します。

    ```
    # .env.local
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```
    - `YOUR_SUPABASE_URL`: SupabaseプロジェクトのURL。
    - `YOUR_SUPABASE_ANON_KEY`: Supabaseプロジェクトの `anon` (public) キー。

## 3. ローカルでの開発

以下のコマンドで、開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## 4. データ提供API

このプロジェクトには、記事データを取得するためのAPIルートが含まれています。

-   **エンドポイント**: `GET /api/posts`
-   **クエリパラメータ**:
    -   `page` (数値, オプショナル, デフォルト: 1): 取得ページ番号
    -   `limit` (数値, オプショナル, デフォルト: 20): 1ページあたりの件数
-   **レスポンス**: 記事オブジェクトの配列

ローカル開発サーバー実行中、`http://localhost:3000/api/posts?page=1&limit=5` のようなURLで動作を確認できます。

## 5. デプロイ (Vercel)

このNext.jsプロジェクトは、Vercelにデプロイすることを推奨します。

1.  **Vercelプロジェクトの作成**
    GitHubリポジトリをVercelにインポートして、新しいプロジェクトを作成します。
    -   **Framework Preset**: `Next.js`
    -   **Root Directory**: `frontend`

2.  **環境変数の設定**
    Vercelプロジェクトの `Settings` > `Environment Variables` に、以下の2つの環境変数を設定します。
    -   `NEXT_PUBLIC_SUPABASE_URL`: あなたのSupabaseプロジェクトURL
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: あなたのSupabase `anon` キー

上記設定後、Vercelが自動でビルドとデプロイを実行します。
