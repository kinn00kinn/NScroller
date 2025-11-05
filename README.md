
![](frontend/public/Pando_banner_1000.gif)

# PanDo - フロントエンド (`frontend/README.md`)

Next.js (App Router), TypeScript, TailwindCSSで構築されたPanDo (パンドゥ) プロジェクトのフロントエンドです。Supabaseからデータを取得し、認証と「いいね」機能を含む無限スクロールのタイムラインを提供します。

## 1\. 主要な機能と実装

このフロントエンドは、見た目以上に多くの機能を実装しています。

  * **認証 (NextAuth):**
      * `app/api/auth/[...nextauth]/route.ts` でNextAuthをセットアップしています。
      * Googleプロバイダー (`GoogleProvider`) を使用します。
      * Supabaseのアダプター (`SupabaseAdapter`) を使用し、認証情報をSupabaseの`users`, `accounts`テーブル等に自動で保存します。
  * **データ取得 (SWR Infinite Scroll):**
      * メインのタイムライン (`app/components/Timeline.tsx`) は、カスタムフック `useInfiniteFeed` (`app/lib/hook.ts`) を使用します。
      * このフックは `useSWRInfinite` を利用し、`GET /api/posts` APIをページネーションしながら継続的に呼び出します。
  * **記事API (`GET /api/posts`):**
      * `app/api/posts/route.ts` で定義されています。
      * Supabaseのパブリッククライアントを使用し、`articles` テーブルから記事を `published_at` の降順で取得します。
      * `page` と `limit` (最大100) のクエリパラメータに対応し、無限スクロールを実現します。
  * **いいね機能 (`POST /api/like`):**
      * 記事カード (`app/components/ArticleCard.tsx`) は、`useSession` でログイン状態を監視します。
      * ログイン時（`session` がある場合）に「いいね」ボタンを押すと、`POST /api/like` にリクエストを送信します。
      * `app/api/like/route.ts` はリクエストを受け取り、SupabaseのRPC（データベース関数） `increment_like_num` を呼び出して、`articles` テーブルの `like_num` カラムをアトミックに（安全に）増減させます。
  * **広告の動的挿入:**
      * `app/lib/hook.ts` 内で、取得した記事フィードに対し、ランダムな間隔（3〜7件ごと）で動的に広告カード (`AdCard.tsx`) が挿入されるロジックが実装されています。

-----

## 2\. セットアップ（ローカル開発）

### ステップ 1: 依存関係のインストール

`frontend` ディレクトリに移動し、`npm` を使って必要なパッケージをインストールします。

```bash
cd frontend
npm install
```

### ステップ 2: 環境変数の設定

`frontend` ディレクトリのルートに `.env.local` ファイルを作成し、**6つ**の環境変数を設定します。

**重要:** このプロジェクトは認証（NextAuth）とデータベース（Supabase）に深く依存しているため、設定漏れがあると動作しません。

```ini
# .env.local

# 1. Supabase (クライアント用)
# Supabaseプロジェクトの「API」設定ページから取得
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# 2. Supabase (NextAuthアダプタ用)
# Supabaseプロジェクトの「Database」>「Roles」または「Project Settings」>「API」>「Service Role Key」
# (注: 'service_role' キー。Anonキーとは別物です)
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

# 3. Google OAuth (NextAuth用)
# Google Cloud ConsoleでOAuth 2.0クライアントIDを作成して取得
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# 4. NextAuth
# セッション暗号化用のシークレットキー。
# `openssl rand -base64 32` コマンドで生成可能
AUTH_SECRET="YOUR_GENERATED_AUTH_SECRET"
```

### ステップ 3: 開発サーバーの起動

以下のコマンドで、開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

-----

## 3\. 主要なAPIルート

このフロントエンドは、外部にデータを公開するだけでなく、自身の機能のために複数の内部API（Route Handlers）を定義しています。

  * **`GET /api/posts`**
      * タイムラインに表示する記事データをページネーション付きで返します。
  * **`POST /api/like`**
      * 記事の「いいね」数をインクリメントまたはデクリメントします。
  * **`GET /api/auth/*`**
      * NextAuthが使用する認証関連のエンドポイント（サインイン、サインアウト、コールバック処理など）。

-----

## 4\. デプロイ (Vercel)

このNext.jsプロジェクトはVercelへのデプロイが推奨されます。

1.  **Vercelプロジェクトの作成**
      * GitHubリポジトリをVercelにインポートします。
      * **Root Directory** を `frontend` に設定します。
2.  **環境変数の設定**
      * Vercelプロジェクトの `Settings` \> `Environment Variables` に、上記の `.env.local` に記述した**6つ**の環境変数（`NEXT_PUBLIC_SUPABASE_URL`〜`AUTH_SECRET`）をすべて設定します。

-----

## 5\. 注意点

  * **画像ドメイン:**
      * `next.config.mjs` には、NextAuth経由で取得するGoogleユーザーのアバター画像 (`lh3.googleusercontent.com`) を表示するための `remotePatterns` が設定されています。
  * **Supabase RPC:**
      * 「いいね」機能は、Supabase側で `increment_like_num` という名前のSQL関数（RPC）が定義されていることを前提としています。

-----

-----

# PanDo - バックエンド (`backend/README.md`)

このバックエンドは、Pythonスクリプトで構成されたデータ収集バッチです。
GitHub Actionsによって定期的に実行され、Google Custom Search APIから**パンダ関連のニュース**を収集し、Supabaseデータベースに保存・クリーンアップします。

## 1\. 主要な機能と実装

このバッチは、`main.py` をエントリーポイントとして実行されます。

  * **`main.py` (メインスクリプト):**
      * すべての処理の起点。
      * Supabaseクライアントを初期化します。
      * `GOOGLE_API_KEY` と `CUSTOM_SEARCH_CX` の環境変数を必須としてチェックします。
      * `search_panda_images.py` を呼び出して記事データを収集します。
      * `database_manager.py` を呼び出してデータを保存・削除します。
  * **`search_panda_images.py` (データ収集):**
      * `fetch_cute_animal_news` 関数（※名前に反し、実装はパンダ専用）が、Google Custom Search API (`customsearch/v1`) を使用します。
      * `'panda OR "giant panda" ...'` というクエリで、過去24時間 (`dateRestrict: "d1"`) の**画像検索**結果を最大100件（10ページx10件）取得します。
      * `get_main_image` 関数が、記事の元URL（コンテキストリンク）をスクレイピングし、OGP画像（`og:image`）など最適な画像URLを抽出します。
  * **`database_manager.py` (DB管理):**
      * `save_articles_to_db`: 取得した記事リストを、Supabaseの `articles` テーブルに `upsert` します。`article_url` が重複キーとなり、重複した場合は無視 (ignore) されます。
      * `delete_old_articles`: `created_at` タイムスタンプが24時間以上経過した古い記事をDBから自動で削除（クリーンアップ）します。

-----

## 2\. セットアップ（ローカル開発）

### ステップ 1: 依存関係のインストール

`backend` ディレクトリに移動し、`pip` を使って必要なライブラリをインストールします。

```bash
cd backend
# (推奨: 仮想環境の作成 `python -m venv venv` && `source venv/bin/activate`)
pip install -r batch/requirements.txt
```

**主なライブラリ:**

  * `supabase-client`: Supabaseへの接続用
  * `python-dotenv`: `.env` ファイルの読み込み
  * `requests`: HTTPリクエスト（Google Search API, スクレイピング）
  * `beautifulsoup4`: HTMLのパース
  * `newsapi-python`, `feedparser`: (※ `requirements.txt` には含まれますが、現在の `main.py` の実装では直接使用されていません)

### ステップ 2: 環境変数の設定

`backend/batch` ディレクトリに `.env` という名前のファイルを作成し、**4つ**の環境変数を設定します。

```ini
# backend/batch/.env

# 1. Supabase
# DBへの書き込み・削除権限が必要なため、'service_role' キーを設定してください。
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

# 2. Google Custom Search API
# Google Cloud ConsoleでAPIキーと、カスタム検索エンジンID(CX)を取得
GOOGLE_API_KEY="YOUR_GOOGLE_CUSTOM_SEARCH_API_KEY"
CUSTOM_SEARCH_CX="YOUR_CUSTOM_SEARCH_CX_ID"
```

### ステップ 3: ローカルでの実行

`backend` ディレクトリから、以下のコマンドでバッチを手動実行できます。

```bash
python batch/main.py
```

コンソールに処理状況（APIからの取得件数、DBへの新規保存件数、削除件数）が出力されます。

-----

## 3\. 自動デプロイ (GitHub Actions)

このバッチは、`.github/workflows/batch.yml` の定義に基づき、GitHub Actionsで自動実行されます。

  * **トリガー:**
    1.  スケジュール実行: 毎時0分 (`cron: "0 * * * *"`)
    2.  手動実行: `workflow_dispatch`
  * **実行内容:**
      * `ubuntu-latest` のランナーを使用します。
      * `working-directory: ./backend` が設定されているため、ジョブは `backend` ディレクトリを基点に実行されます。
      * `pip install -r batch/requirements.txt` を実行します。
      * `python batch/main.py` を実行します。

### 必要なリポジトリシークレット

このワークフローを正しく動作させるには、GitHubリポジトリの `Settings` \> `Secrets and variables` \> `Actions` に、以下の**4つ**のシークレットを設定する必要があります。

  * `SUPABASE_URL`
  * `SUPABASE_KEY` (※ `service_role` キー)
  * `GOOGLE_API_KEY`
  * `CUSTOM_SEARCH_CX`
