import os
import feedparser
import requests # ★ OGP取得のために追加
from bs4 import BeautifulSoup # ★ OGP取得のために追加
from urllib.parse import urljoin # ★ 相対URLを絶対URLに変換するために追加
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# .envファイルから環境変数を読み込む
load_dotenv()

# --- 定数定義 ---
# ★ パンダ関連のRSSフィード
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


def get_main_image(url: str) -> str | None:
    """
    記事のURLからOGPまたは本文中のメイン画像を取得する
    (★ ロジックを強化)
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
        response.raise_for_status() 

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # --- 1. OGP/Twitter (最優先) ---
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            print(f"  [OGP画像発見]: {og_image['content']}")
            return og_image['content']

        twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_image and twitter_image.get('content'):
            print(f"  [Twitter画像発見]: {twitter_image['content']}")
            return twitter_image['content']

        # --- 2. 本文中の画像 (フォールバック) ---
        # ★ メインコンテンツのコンテナを推測
        content_selectors = ['article', 'main', '[role="main"]', '.main-content', '.post-content', '.article-body', '#content']
        main_content = None
        for selector in content_selectors:
            main_content = soup.select_one(selector)
            if main_content:
                print(f"  [本文コンテナ発見]: {selector}")
                break
        
        if not main_content:
            main_content = soup.body # 見つからなければ body 全体

        if main_content:
            # コンテナ内の最初の <img> タグを探す (src属性があるもの)
            first_image = main_content.find('img', src=True)
            if first_image:
                image_src = first_image['src']
                
                # srcが // から始まる場合 (プロトコル相対)
                if image_src.startswith('//'):
                    image_src = 'https:' + image_src
                
                # srcが相対パスの場合、絶対パスに変換
                # urljoin(base_url, relative_url)
                absolute_image_url = urljoin(response.url, image_src) 
                
                # data:image (埋め込み画像) は除外
                if absolute_image_url.startswith('data:'):
                     print("  [本文内画像スキップ] data URI")
                     return None

                print(f"  [本文内画像発見]: {absolute_image_url}")
                return absolute_image_url

        print("  [画像未発見]")
        return None
        
    except requests.exceptions.HTTPError as e:
        print(f"  [画像取得エラー] HTTPエラー: {url}, {e}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"  [画像取得エラー] リクエスト失敗: {url}, {e}")
        return None
    except Exception as e:
        print(f"  [画像取得/パースエラー] 不明なエラー: {url}, {e}")
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
            source_name = feed.feed.title if hasattr(feed.feed, 'title') else "不明なソース"

            for entry in feed.entries:
                if not hasattr(entry, 'link') or not hasattr(entry, 'title'):
                    print("  スキップ (リンクまたはタイトルがありません)")
                    continue
                    
                article_url = entry.link
                
                # 1. 重複チェック
                existing_article = supabase.table("articles").select("id").eq("article_url", article_url).execute()

                if len(existing_article.data) > 0:
                    continue

                # 2. データ準備
                published_dt = datetime(*entry.published_parsed[:6]) if hasattr(entry, 'published_parsed') else datetime.now()
                
                # ★ 2-1. 画像の取得 (RSS -> OGP -> 本文スキャン の順で探す)
                image_url = None
                
                if hasattr(entry, 'media_content') and entry.media_content:
                    images = [m['url'] for m in entry.media_content if m.get('medium') == 'image' and m.get('url')]
                    if images:
                        image_url = images[0]
                        print(f"  [RSS内画像発見]: {image_url}")
                
                if not image_url and hasattr(entry, 'enclosures'):
                    images = [e['href'] for e in entry.enclosures if e.get('type', '').startswith('image/') and e.get('href')]
                    if images:
                        image_url = images[0]
                        print(f"  [Enclosure画像発見]: {image_url}")

                # それでも見つからなければ、(★ 強化した関数を呼び出す)
                if not image_url:
                    print(f"  メイン画像を取得中: {article_url}")
                    image_url = get_main_image(article_url)
                
                # 2-2. 記事データの構成
                article = {
                    "title": entry.title,
                    "article_url": article_url,
                    "published_at": published_dt.isoformat(),
                    "source_name": source_name,
                    "image_url": image_url,
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
    # pip install -r requirements.txt
    main()

