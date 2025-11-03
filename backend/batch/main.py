import os
import feedparser
import requests # ★ OGP取得のために追加
from bs4 import BeautifulSoup # ★ OGP取得のために追加
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# .envファイルから環境変数を読み込む
load_dotenv()

# --- 定数定義 ---
# ★ パンダ関連のRSSフィードに変更
RSS_FEEDS = [
    # Google News (日本) で「パンダ」を検索
    "https://news.google.com/rss/search?q=%E3%83%91%E3%83%B3%E3%83%80&hl=ja&gl=JP&ceid=JP:ja",
    # 上野動物園 (Ueno Zoo) のニュース (パンダ情報が含まれる)
    "https://www.tokyo-zoo.net/zoo/ueno/news/atom.xml",
    # アドベンチャーワールド (Adventure World) のニュース
    "https://www.aws-s.com/topics/atom.xml",
    # WWF (世界自然保護基金) のブログ (パンダ関連の記事が含まれる可能性)
    "https://www.worldwildlife.org/feeds/blog/posts",
    # Smithsonian's National Zoo (米国国立動物園) のニュース
    "https://nationalzoo.si.edu/news/rss.xml"
]

# --- Supabaseクライアントの初期化 ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SupabaseのURLとキーを環境変数に設定してください。")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_og_image(url: str) -> str | None:
    """
    記事のURLからOGP画像を取得する
    (★ 新規追加関数)
    """
    try:
        headers = {
            # クローリングを許可してもらうための一般的なユーザーエージェント
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        # タイムアウトを5秒に設定
        response = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
        response.raise_for_status() # エラーがあれば例外を発生

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 1. OGP画像 (og:image) を探す
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            print(f"  [OGP画像発見]: {og_image['content']}")
            return og_image['content']

        # 2. Twitterカード画像 (twitter:image) を探す
        twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_image and twitter_image.get('content'):
            print(f"  [Twitter画像発見]: {twitter_image['content']}")
            return twitter_image['content']
            
        print("  [画像未発見]")
        return None
        
    except requests.exceptions.HTTPError as e:
        print(f"  [OGP取得エラー] HTTPエラー: {url}, {e}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"  [OGP取得エラー] リクエスト失敗: {url}, {e}")
        return None
    except Exception as e:
        print(f"  [OGPパースエラー] 不明なエラー: {url}, {e}")
        return None


def main():
    """
    RSSフィードを巡回し、新規記事をSupabaseに保存する
    """
    print("データ収集バッチを開始します。 (パンダ版)")

    for feed_url in RSS_FEEDS:
        print(f"フィードを処理中: {feed_url}")
        try:
            feed = feedparser.parse(feed_url)
            # フィード名が取得できない場合のフォールバック
            source_name = feed.feed.title if hasattr(feed.feed, 'title') else "不明なソース"

            for entry in feed.entries:
                if not hasattr(entry, 'link') or not hasattr(entry, 'title'):
                    print("  スキップ (リンクまたはタイトルがありません)")
                    continue
                    
                article_url = entry.link
                
                # 1. 重複チェック
                existing_article = supabase.table("articles").select("id").eq("article_url", article_url).execute()

                if len(existing_article.data) > 0:
                    # print(f"  スキップ（既存）: {entry.title}") # 重複ログは省略
                    continue

                # 2. データ準備
                published_dt = datetime(*entry.published_parsed[:6]) if hasattr(entry, 'published_parsed') else datetime.now()
                
                # ★ 2-1. 画像の取得 (ロジック追加)
                image_url = None
                
                # まずは feedparser で探す (media_content)
                if hasattr(entry, 'media_content') and entry.media_content:
                    images = [m['url'] for m in entry.media_content if m.get('medium') == 'image' and m.get('url')]
                    if images:
                        image_url = images[0]
                        print(f"  [RSS内画像発見]: {image_url}")
                
                # 次に enclosures で探す
                if not image_url and hasattr(entry, 'enclosures'):
                    images = [e['href'] for e in entry.enclosures if e.get('type', '').startswith('image/') and e.get('href')]
                    if images:
                        image_url = images[0]
                        print(f"  [Enclosure画像発見]: {image_url}")

                # それでも見つからなければ、OGPを取得
                if not image_url:
                    print(f"  OGP画像を取得中: {article_url}")
                    image_url = get_og_image(article_url)
                
                # 2-2. 記事データの構成
                article = {
                    "title": entry.title,
                    "article_url": article_url,
                    "published_at": published_dt.isoformat(), # ISO 8601形式
                    "source_name": source_name,
                    "image_url": image_url, # ★ 取得した画像URLを設定
                }

                # 3. データ保存
                print(f"  新規記事を追加: {article['title']}")
                supabase.table("articles").insert(article).execute()

        except Exception as e:
            print(f"エラーが発生しました: {feed_url}, {e}")
            continue
    
    print("データ収集バッチが完了しました。")


if __name__ == "__main__":
    # ★ スクリプトの実行に必要なライブラリ
    # pip install feedparser requests beautifulsoup4 supabase python-dotenv
    main()
