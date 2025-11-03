import os
import feedparser
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# --- 環境変数の読み込み ---
load_dotenv()

# --- RSSフィード一覧 ---
RSS_FEEDS = [
    "https://news.google.com/rss/search?q=%E3%83%91%E3%83%B3%E3%83%80&hl=ja&gl=JP&ceid=JP:ja",
    "https://www.tokyo-zoo.net/zoo/ueno/news/atom.xml",
    "https://www.aws-s.com/topics/atom.xml",
    "https://www.worldwildlife.org/feeds/blog/posts",
    "https://nationalzoo.si.edu/news/rss.xml"
]

# --- Supabase 初期化 ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SupabaseのURLとキーを環境変数に設定してください。")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_main_image(url: str) -> str | None:
    """
    記事URLから OGP または本文中の代表的な画像を取得する
    """
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/115.0.0.0 Safari/537.36"
            )
        }

        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        response.raise_for_status()
        final_url = response.url
        soup = BeautifulSoup(response.text, "html.parser")

        # --- 1. OGP画像 ---
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            img_url = urljoin(final_url, og_image["content"])
            if not img_url.startswith("https://lh3.googleusercontent.com"):
                print(f"  [OGP画像発見]: {img_url}")
                return img_url

        # --- 2. Twitterカード画像 ---
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        if twitter_image and twitter_image.get("content"):
            img_url = urljoin(final_url, twitter_image["content"])
            if not img_url.startswith("https://lh3.googleusercontent.com"):
                print(f"  [Twitter画像発見]: {img_url}")
                return img_url

        # --- 3. 本文中の画像 (フォールバック) ---
        content_selectors = [
            "article", "main", "[role='main']",
            ".main-content", ".post-content", ".article-body", "#content"
        ]
        main_content = None
        for selector in content_selectors:
            main_content = soup.select_one(selector)
            if main_content:
                print(f"  [本文コンテナ発見]: {selector}")
                break

        if not main_content:
            main_content = soup.body

        if main_content:
            first_img = main_content.find("img", src=True)
            if first_img:
                src = first_img["src"]
                if src.startswith("data:"):
                    print("  [本文内画像スキップ] data URI")
                    return None
                abs_img = urljoin(final_url, src)
                if not abs_img.startswith("https://lh3.googleusercontent.com"):
                    print(f"  [本文内画像発見]: {abs_img}")
                    return abs_img

        print("  [画像未発見]")
        return None

    except requests.exceptions.RequestException as e:
        print(f"  [画像取得エラー] リクエスト失敗: {url}, {e}")
        return None
    except Exception as e:
        print(f"  [画像取得エラー] 不明なエラー: {url}, {e}")
        return None


def main():
    """
    RSSを巡回して新規記事をSupabaseに登録
    """
    print("データ収集バッチ開始 (パンダ版)")

    for feed_url in RSS_FEEDS:
        print(f"フィードを処理中: {feed_url}")
        try:
            feed = feedparser.parse(feed_url)
            source_name = getattr(feed.feed, "title", "不明なソース")
            is_google_news = "news.google.com" in feed_url

            for entry in feed.entries:
                article_url = None
                image_url = None

                # --- Google News 特別処理 ---
                if is_google_news:
                    if not hasattr(entry, "description"):
                        print("  [Google News] スキップ (description なし)")
                        continue

                    desc_soup = BeautifulSoup(entry.description, "html.parser")
                    link_tag = desc_soup.find("a", href=True)
                    if link_tag:
                        article_url = link_tag["href"]
                    else:
                        print("  [Google News] 元記事URLなし -> スキップ")
                        continue

                    # Googleキャッシュ画像除外
                    img_tag = desc_soup.find("img", src=True)
                    if img_tag:
                        candidate_img = img_tag["src"]
                        if not candidate_img.startswith("https://lh3.googleusercontent.com"):
                            image_url = candidate_img
                            print(f"  [Google News サムネイル採用]: {image_url}")
                        else:
                            print(f"  [Google News キャッシュ画像除外]: {candidate_img}")

                else:
                    # --- 通常RSS ---
                    if not hasattr(entry, "link"):
                        print("  [RSS] スキップ (リンクなし)")
                        continue
                    article_url = entry.link

                    # RSS内画像探索
                    if hasattr(entry, "media_content") and entry.media_content:
                        images = [
                            m["url"]
                            for m in entry.media_content
                            if m.get("medium") == "image" and m.get("url")
                        ]
                        if images:
                            image_url = images[0]
                            print(f"  [RSS内画像発見]: {image_url}")
                    if not image_url and hasattr(entry, "enclosures"):
                        images = [
                            e["href"]
                            for e in entry.enclosures
                            if e.get("type", "").startswith("image/") and e.get("href")
                        ]
                        if images:
                            image_url = images[0]
                            print(f"  [Enclosure画像発見]: {image_url}")

                if not article_url:
                    continue

                # --- Supabase 重複チェック ---
                existing = supabase.table("articles").select("id").eq("article_url", article_url).execute()
                if existing.data:
                    continue

                # --- 公開日 ---
                published_dt = datetime(*entry.published_parsed[:6]) if hasattr(entry, "published_parsed") else datetime.now()

                # --- メイン画像をOGPから取得 ---
                print(f"  メイン画像を取得中: {article_url}")
                scraped_img = get_main_image(article_url)
                if scraped_img:
                    image_url = scraped_img

                # --- 記事データ構築 ---
                article = {
                    "title": entry.title,
                    "article_url": article_url,
                    "published_at": published_dt.isoformat(),
                    "source_name": source_name,
                    "image_url": image_url,
                }

                # --- 保存 ---
                print(f"  新規記事追加: {article['title']}")
                supabase.table("articles").insert(article).execute()

        except Exception as e:
            print(f"  [フィードエラー]: {feed_url}, {e}")
            continue

    print("データ収集バッチ完了。")


if __name__ == "__main__":
    main()
