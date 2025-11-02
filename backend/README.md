
# NScroller - バックエンド

このリポジトリは、「Niche Scroller (AI Edition)」のバックエンド機能を管理します。
現在は、AI関連のニュース記事を収集するPython製のバッチ処理機能が含まれています。

## 1. データ収集バッチ

指定されたRSSフィードから記事情報を取得し、Supabaseデータベースに保存するバッチプログラムです。

### 1.1. セットアップ

1.  **リポジトリのクローン**

2.  **Python環境の構築**
    Python 3.8以上を推奨します。

3.  **依存関係のインストール**
    `backend` ディレクトリに移動し、以下のコマンドを実行します。
    ```bash
    pip install -r batch/requirements.txt
    ```

4.  **環境変数の設定**
    `backend/batch` ディレクトリに `.env` という名前のファイルを作成し、Supabaseプロジェクトの情報を記述します。

    ```
    # batch/.env
    SUPABASE_URL="YOUR_SUPABASE_URL"
    SUPABASE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
    ```
    - `YOUR_SUPABASE_URL`: SupabaseプロジェクトのURL。
    - `YOUR_SUPABASE_SERVICE_ROLE_KEY`: Supabaseプロジェクトの `service_role` キー。
      （※ `anon` キーではなく、書き込み権限のある `service_role` キーを設定してください）

### 1.2. ローカルでの実行

`backend` ディレクトリから、以下のコマンドでバッチを手動実行できます。

```bash
python batch/main.py
```

コンソールに処理状況が出力されます。

### 1.3. デプロイ (GitHub Actions)

このバッチは、GitHub Actions を利用して定期的に自動実行することを想定しています。

1.  **リポジトリのSecrets設定**
    GitHubリポジトリの `Settings` > `Secrets and variables` > `Actions` に、以下の2つのリポジトリシークレットを追加します。
    - `SUPABASE_URL`: あなたのSupabaseプロジェクトURL
    - `SUPABASE_KEY`: あなたのSupabase `service_role` キー

2.  **ワークフローファイルの作成**
    リポジトリのルートに `.github/workflows/batch.yml` というファイルを作成し、以下の内容を記述します。

    ```yaml
    name: Collect Articles Batch

    on:
      # 1時間に1回、毎時0分に実行
      schedule:
        - cron: "0 * * * *"
      # 手動実行も可能にする
      workflow_dispatch:

    jobs:
      collect:
        runs-on: ubuntu-latest
        defaults:
          run:
            working-directory: ./backend

        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Set up Python
            uses: actions/setup-python@v5
            with:
              python-version: '3.10'

          - name: Install dependencies
            run: pip install -r batch/requirements.txt

          - name: Run batch script
            env:
              SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
              SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
            run: python batch/main.py
    ```

上記の設定により、1時間ごとにバッチが自動実行されます。
