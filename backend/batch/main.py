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
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        # Google Newsからのリダイレクトを考慮しタイムアウトを10秒に延長
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        response.raise_for_status() 

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # --- 1. OGP/Twitter (最優先) ---
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            img_url = urljoin(response.url, og_image['content']) # ★ 相対パスを絶対パスに
            print(f"  [OGP画像発見]: {img_url}")
            return img_url

        twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_image and twitter_image.get('content'):
            img_url = urljoin(response.url, twitter_image['content']) # ★ 相対パスを絶対パスに
            print(f"  [Twitter画像発見]: {img_url}")
            return img_url

        # --- 2. 本文中の画像 (フォールバック) ---
        content_selectors = ['article', 'main', '[role="main"]', '.main-content', '.post-content', '.article-body', '#content']
        main_content = None
        for selector in content_selectors:
            main_content = soup.select_one(selector)
            if main_content:
                print(f"  [本文コンテナ発見]: {selector}")
                break
        
        if not main_content:
            main_content = soup.body

        if main_content:
            first_image = main_content.find('img', src=True)
            if first_image:
                image_src = first_image['src']
                
                # data:image (埋め込み画像) は除外
                if image_src.startswith('data:'):
                     print("  [本文内画像スキップ] data URI")
                     return None
                
                # 絶対URLに変換
                absolute_image_url = urljoin(response.url, image_src) 
                
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
            
            # ★ Google News かどうかを判定
            is_google_news = "news.google.com" in feed_url

            for entry in feed.entries:
                article_url = None
                image_url = None # フォールバック用の画像URL

                if is_google_news:
                    # --- ★ Google News (特別処理) ---
                    if not hasattr(entry, 'description'):
                        print("  [Google News] スキップ (description がありません)")
                        continue
                    
                    try:
                        desc_soup = BeautifulSoup(entry.description, 'html.parser')
                        
                        # 1. 記事の元URLを取得 (最初の <a> タグ)
                        link_tag = desc_soup.find('a', href=True)
                        if link_tag:
                            article_url = link_tag['href']
                        else:
                            print("  [Google News] スキップ (元の記事URLが見つかりません)")
                            continue
                            
                        # 2. サムネイル画像を取得 (最初の <img> タグ) - フォールバック用
                        img_tag = desc_soup.find('img', src=True)
                        if img_tag:
                            image_url = img_tag['src']
                            print(f"  [Google News サムネイル発見]: {image_url}")

                    except Exception as e:
                        print(f"  [Google News] パースエラー: {e}")
                        continue
                
                else:
                    # --- ★ 標準RSSフィード ---
                    if not hasattr(entry, 'link') or not hasattr(entry, 'title'):
                        print("  スキップ (リンクまたはタイトルがありません)")
                        continue
                    article_url = entry.link

                # 1. 重複チェック (article_url が確定してから)
                if not article_url:
                    continue 

                existing_article = supabase.table("articles").select("id").eq("article_url", article_url).execute()
                if len(existing_article.data) > 0:
                    continue

                # 2. データ準備
                published_dt = datetime(*entry.published_parsed[:6]) if hasattr(entry, 'published_parsed') else datetime.now()
                
                # 3. 画像の取得 (RSS -> OGP/Web -> Google News Fallback)
                
                # 3-1. (非Google News) RSSフィード内の画像を探す
                if not is_google_news:
                    if hasattr(entry, 'media_content') and entry.media_content:
                        images = [m['url'] for m in entry.media_content if m.get('medium') == 'image' and m.get('url')]
                        if images:
                            image_url = images[0] # この時点では image_url に値が入る
                            print(f"  [RSS内画像発見]: {image_url}")
                    
                    if not image_url and hasattr(entry, 'enclosures'):
                        images = [e['href'] for e in entry.enclosures if e.get('type', '').startswith('image/') and e.get('href')]
                        if images:
                            image_url = images[0]
                            print(f"  [Enclosure画像発見]: {image_url}")

                # 3-2. OGP/Webスキャン (RSSで見つからない場合、またはGoogle Newsの場合)
                # (Google Newsの場合、image_url には低解像度のサムネイルが入っている可能性があるが、高解像度のOGPを優先する)
                
                scraped_image_url = None
                print(f"  メイン画像を取得中: {article_url}")
                scraped_image_url = get_main_image(article_url)
                
                # OGP/スキャンで取得できた画像を優先
                if scraped_image_url:
                    image_url = scraped_image_url
                # (scraped_image_url が None でも、image_url にGoogle NewsサムネイルやRSS画像が残っている)

                # 4. 記事データの構成
                article = {
                    "title": entry.title,
                    "article_url": article_url,
                    "published_at": published_dt.isoformat(),
                    "source_name": source_name,
                    "image_url": image_url, # 最終的に決定した画像URL
                }

                # 5. データ保存
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

