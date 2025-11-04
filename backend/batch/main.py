#!/usr/bin/env python3
"""
Pandas ニュース収集バッチ実行スクリプト

1. 記事収集モジュール (article_collector) を呼び出し、記事データを取得
2. DB管理モジュール (database_manager) を呼び出し、取得したデータを保存
"""

import os
import sys

# 作成したモジュールをインポート
from database_manager import init_supabase_client, save_articles_to_db
# from article_collector import fetch_cute_animal_news, get_main_image
from search_panda_images import fetch_cute_animal_news, get_main_image

def main():
    # 1. DBクライアントを初期化 (dotenvもここで読み込まれる)
    supabase_client = init_supabase_client()

    # 2. NewsAPIキーを環境変数から取得
    NEWSAPI_KEY = os.environ.get("NEWSAPI_KEY")
    if not NEWSAPI_KEY:
        print("NEWSAPI_KEY が .env に設定されていません。")
        return

    # 3. (元コードの機能) コマンドライン引数がある場合は単発検証モード
    args = sys.argv[1:]
    if args:
        for u in args:
            print(f"=== 単発検証: {u}")
            # 単発検証用に get_main_image を collector からインポート
            img = get_main_image(u) 
            if img:
                print(f"FOUND image: {img}")
            else:
                print("NO image found.")
        return

    # 4. メインのバッチ処理
    print("データ収集バッチ開始 (NewsAPI モード)")
    
    # 4-1. データの収集 (DBのことは知らない)
    collected_articles = fetch_cute_animal_news(NEWSAPI_KEY)
    
    print(f"--- APIから {len(collected_articles)} 件の記事候補を取得しました ---")
    print("--- データベースへの保存処理を開始します ---")

    # 4-2. データの保存 (APIのことは知らない)
    total_saved = save_articles_to_db(supabase_client, collected_articles)

    print(f"データ収集バッチ完了 (新規保存: {total_saved} 件)")


if __name__ == "__main__":
    main()