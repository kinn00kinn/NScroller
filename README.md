![banner](/frontend/public/Pando_banner_1000.gif)

# PanDo - フロントエンド (`frontend/README.md`)

Next.js (App Router), TypeScript, TailwindCSSで構築されたPanDo (パンドゥ) プロジェクトのフロントエンドです。Supabaseからデータを取得し、認証と「いいね」機能を含む無限スクロールのタイムラインを提供します。

## 1\. 主要な機能と実装

このフロントエンドは、見た目以上に多くの機能を実装しています。

  * **認証 (NextAuth):**
      * `app/api/auth/[...nextauth]/route.ts`/route.ts] でNextAuth.js (v4) をセットアップしています。
      * Googleプロバイダー (`GoogleProvider`) を使用します。
      * Supabaseのアダプター (`@auth/supabase-adapter`) を使用し、認証情報をSupabaseのテーブル（`next_auth.users`, `next_auth.accounts`等）に自動で保存します。
  * **データ取得 (SWR Infinite Scroll):**
      * メインのタイムライン (`app/components/Timeline.tsx`) は、カスタムフック `useInfiniteFeed` (`app/lib/hook.ts`) を使用します。
      * このフックは `useSWRInfinite` を利用し、`GET /api/posts` API をページネーションしながら継続的に呼び出します。
  * **記事API (`GET /api/posts`):**
      * `app/api/posts/route.ts` で定義されています。
      * SupabaseのRPC（`get_feed_articles`, `get_my_liked_articles`）を呼び出し、`is_liked` や `is_bookmarked` の状態を含めた記事データを返します。
  * **いいね機能 (`POST /api/like`):**
      * `app/api/like/route.ts` は、SupabaseのRPC `increment_like_num` を呼び出し、`articles` テーブルの `like_num` をアトミックに増減させます。
  * **ブックマーク機能 (`POST /api/bookmark`):**
      * `app/api/bookmark/route.ts` (新規) は、`user_bookmarks` テーブルへの挿入/削除と、RPC `increment_bookmark_num` を呼び出します。
      * `app/my-bookmarks/page.tsx` (新規) でブックマーク一覧を表示します。
  * **プロフィール編集機能 (`POST /api/profile`):**
      * `app/profile/page.tsx` (新規) でニックネームとアイコン画像の変更UIを提供します。
      * `app/api/profile/upload-icon/route.ts` (新規) がBase64画像を受け取り、Supabase Storage (`avatars` バケット) にアップロードします。
      * `app/api/profile/route.ts` (新規) が、`next_auth.users` テーブルの `name` と `image` カラムを更新します。
  * **広告の動的挿入:**
      * `app/lib/hook.ts` 内で、取得した記事フィードに対し、ランダムな間隔で動的に広告カード (`AdCard.tsx`) が挿入されるロジックが実装されています。

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

# 2. Supabase (バックエンドAPI / NextAuthアダプタ用)
# Supabaseプロジェクトの「Project Settings」>「API」>「Service Role Key」
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

このフロントエンドは、自身の機能のために複数の内部API（Route Handlers）を定義しています。

  * **`GET /api/posts`**
      * タイムラインに表示する記事データをページネーション付きで返します。
  * **`GET /api/auth/*`**
      * NextAuthが使用する認証関連のエンドポイント（サインイン、コールバックなど）。
  * **`POST /api/like`**
      * 記事の「いいね」数を増減させます。
  * **`POST /api/bookmark` (新規)**
      * 記事のブックマーク状態を追加・削除します。
  * **`POST /api/profile` (新規)**
      * 認証中ユーザーの `name` と `image` URLを更新します。
  * **`POST /api/profile/upload-icon` (新規)**
      * プロフィール編集用のアイコン画像をSupabase Storageにアップロードします。

-----

## 4\. デプロイ (Vercel)

このNext.jsプロジェクトはVercelへのデプロイが推奨されます。

1.  **Vercelプロジェクトの作成**
      * GitHubリポジトリをVercelにインポートします。
      * **Root Directory** を `frontend` に設定します。
2.  **環境変数の設定**
      * Vercelプロジェクトの `Settings` \> `Environment Variables` に、上記の `.env.local` に記述した**6つ**の環境変数（`NEXT_PUBLIC_SUPABASE_URL`〜`AUTH_SECRET`）をすべて設定します。

-----

## 5\. 注意点とデバッグ

  * **画像ドメイン:**
      * `next.config.mjs` には、NextAuth経由のGoogleアバター (`lh3.googleusercontent.com`) と、**Supabase Storage** (`YOUR_PROJECT_ID.supabase.co`) のホスト名を `remotePatterns` に登録する必要があります。
  * **Supabase Storage:**
      * プロフィール編集機能を使うには、`avatars` という名前の**パブリック (Public) バケット**がSupabase Storageに作成されている必要があります。
  * **Supabase RPC と スキーマ:**
      * `いいね`、`ブックマーク`、`記事取得` 機能は、Supabase側で以下のSQL関数（RPC）が定義されていることを前提としています。
          * `increment_like_num`
          * `increment_bookmark_num` (新規)
          * `get_feed_articles` (改修)
          * `get_my_liked_articles` (改修)
          * `get_my_bookmarked_articles` (新規)
      * NextAuthアダプタは、`public` ではなく `next_auth` スキーマに `users` テーブルを作成する場合があります。APIが `Could not find the table 'public.users'` エラーを返す場合、APIルート (`/api/profile`) 内で `supabase.schema("next_auth").from("users")` のようにスキーマを明示的に指定する必要があります。
      * RPCの戻り値（`SELECT` する列）を変更した場合、`DROP FUNCTION ...;` してから `CREATE FUNCTION ...;` し直さないと `cannot change return type` エラーが発生します。
      * RPCがテーブルやカラムを見つけられない場合、Supabase APIのキャッシュが古い可能性があります。SQL Editorで `NOTIFY pgrst, 'reload schema'` を実行すると解決することがあります。
  * **Supabase RLS:**
      * `user_likes` や `user_bookmarks` テーブルには、`upsert` や `delete` のために複合プライマリキー `(user_id, article_id)` と、`authenticated` ロールに対するRLSポリシーが設定されている必要があります。

-----

-----

# PanDo - バックエンド (`backend/README.md`)

（※バックエンド側のREADMEは、フロントエンドの機能追加による変更がないため、元の内容を維持します）

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
      * `fetch_from_google_search` 関数が、Google Custom Search API (`customsearch/v1`) を使用します。
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