
import os
import feedparser
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# .envファイルから環境変数を読み込む
load_dotenv()

# --- 定数定義 ---
# 本来は `全体要件定義.md` から取得するが、一旦ダミーを定義
# 出典: https://note.com/info/rss.html
RSS_FEEDS = [
    "https://note.com/rss/n/n0b3434c3a2a4", # サンプル: noteのRSS
    "https://feeds.feedburner.com/Publickey" # サンプル: Publickey
]

# --- Supabaseクライアントの初期化 ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SupabaseのURLとキーを環境変数に設定してください。")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    """
    RSSフィードを巡回し、新規記事をSupabaseに保存する
    """
    print("データ収集バッチを開始します。")

    for feed_url in RSS_FEEDS:
        print(f"フィードを処理中: {feed_url}")
        try:
            feed = feedparser.parse(feed_url)
            source_name = feed.feed.title

            for entry in feed.entries:
                article_url = entry.link
                
                # 1. 重複チェック
                # article_url をキーに articles テーブルを検索
                existing_article = supabase.table("articles").select("id").eq("article_url", article_url).execute()

                if len(existing_article.data) > 0:
                    print(f"スキップ（既存）: {entry.title}")
                    continue

                # 2. データ準備
                # published_parsedからdatetimeオブジェクトを取得
                published_dt = datetime(*entry.published_parsed[:6]) if hasattr(entry, 'published_parsed') else datetime.now()
                
                # 要件定義書にある項目を元にデータを構成
                article = {
                    "title": entry.title,
                    "article_url": article_url,
                    "published_at": published_dt.isoformat(), # ISO 8601形式
                    "source_name": source_name,
                    # image_urlはOGP取得が必要なため、一旦None
                    "image_url": None, 
                }

                # 3. データ保存
                print(f"新規記事を追加: {article['title']}")
                supabase.table("articles").insert(article).execute()

        except Exception as e:
            print(f"エラーが発生しました: {feed_url}, {e}")
            continue
    
    print("データ収集バッチが完了しました。")


if __name__ == "__main__":
    main()
