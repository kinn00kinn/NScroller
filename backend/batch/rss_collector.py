#!/usr/bin/env python3
"""
記事データ収集モジュール (RSS)
- 指定されたRSSフィードを巡回
- 記事の画像は utils.py の get_main_image で補完（任意）
"""

from typing import List, Optional
import feedparser
import requests
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import html

# 共通ヘルパーをインポート（ユーザ実装前提）
from utils import get_main_image, parse_published

# --- 設定 ---
REQUEST_TIMEOUT = 10.0
USER_AGENT = "Mozilla/5.0 (compatible; MyRSSBot/1.0; +https://example.com/bot)"

# 実稼働で安定して取得できたフィード（ログ確認済み）
RSS_FEEDS = [
    # --- 日本 国内（ログで entries>0 確認） ---
    "https://www3.nhk.or.jp/rss/news/cat0.xml",        # NHK 総合（OK）
    "https://mainichi.jp/rss/etc/flash.rss",           # 毎日新聞（OK）
    "https://www.asahi.com/rss/asahi/newsheadlines.rdf", # 朝日新聞（OK）
    "https://news.yahoo.co.jp/rss/topics/top-picks.xml",  # Yahoo! トップピックス（OK）

    # --- 海外 一般（ログで entries>0 確認） ---
    "https://feeds.bbci.co.uk/news/world/rss.xml",    # BBC World（OK）
    "https://www.aljazeera.com/xml/rss/all.xml",      # Al Jazeera（OK）
    "https://www.france24.com/en/rss",                # France24（OK）
    "http://www.wto.org/library/rss/latest_news_e.xml",# WTO（OK）
    "https://www.lemonde.fr/en/international/rss_full.xml", # Le Monde International（OK）

    # --- 動物 / 保護系（ログで entries>0 確認） ---
    "https://www.conservation.org/feed.xml",          # Conservation International（discovered, OK）
    "https://globalwildlife.org/feed",                # Global Wildlife Conservation（OK）
    "https://wildlife.org/feed",                      # The Wildlife Society（OK）
    "https://news.mongabay.com/feed/",                # Mongabay（OK）
    "https://www.awf.org/rss.xml",                    # African Wildlife Foundation（OK）
    # Treehugger の公式 feed が 404 だったが HTML 内で発見した canonical feed を使用
    "https://feeds-api.dotdashmeredith.com/v1/rss/google/c9053935-d1d7-49c7-b54c-11e651b69e28", # Treehugger (discovered)
    # Nature の subjects feed が 404 だったが discovery で nature.rss を取得できた
    "https://www.nature.com/nature.rss",              # Nature (discovered, OK)
]


# --- デフォルトキーワード（小文字で比較） ---
DEFAULT_KEYWORDS = [
    # 英語
    "panda", "pandas", "giant panda", "red panda",
    "panda cub", "baby panda", "panda birth",
    "panda conservation", "panda breeding", "panda exhibit", "panda zoo",

    # 日本語・中国語
    "パンダ", "レッサーパンダ",
    "シャンシャン", "リーリー", "シンシン", "タンタン", "香香",
    "熊猫", "大熊猫", "圓仔", "円仔", "圓圓", "円円",
]

DEFAULT_KEYWORDS_LOWER = [k.lower() for k in DEFAULT_KEYWORDS]


# -----------------------
# 内部ヘルパー
# -----------------------
def _discover_rss_link_from_html(base_url: str, html_text: str) -> Optional[str]:
    """HTML内からRSSリンクを発見して絶対URLとして返す（見つからなければ None）"""
    try:
        soup = BeautifulSoup(html_text, "html.parser")
        # <link rel="alternate" type="application/rss+xml" href="...">
        link = soup.find("link", rel=lambda x: x and "alternate" in x.lower(),
                         type=lambda t: t and "rss" in t.lower())
        if link and link.get("href"):
            return urljoin(base_url, link["href"])
        # <a> にフィードや RSS の文言がある場合
        a = soup.find("a", href=True, string=lambda s: s and "rss" in s.lower())
        if a:
            return urljoin(base_url, a["href"])
    except Exception:
        pass
    return None


def _get_feed_via_requests(url: str, user_agent: str, timeout: float, verify_ssl: bool):
    """requests で取得して feedparser に渡す。HTMLなら RSS 発見を試みる"""
    headers = {"User-Agent": user_agent}
    try:
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True, verify=verify_ssl)
    except Exception as e:
        print(f"  [HTTP ERROR] {url} を取得できません: {e}")
        return None, getattr(e, "__class__", Exception)

    status = getattr(resp, "status_code", None)
    print(f"  [HTTP] {url} -> status {status}")
    feed = feedparser.parse(resp.content)
    print(f"    feed.status: {getattr(feed,'status','N/A')}, entries: {len(feed.entries)}, bozo: {getattr(feed,'bozo',False)}")
    if len(feed.entries) > 0:
        return feed, None

    # HTML の場合はページ内に RSS リンクが無いか探す
    content_type = resp.headers.get("Content-Type", "")
    if "html" in content_type or len(resp.content) > 0:
        discovered = _discover_rss_link_from_html(resp.url, resp.text)
        if discovered and discovered != url:
            print(f"    [DISCOVER] HTML内にRSSリンクを発見: {discovered} — 再取得します")
            try:
                r2 = requests.get(discovered, headers=headers, timeout=timeout, allow_redirects=True, verify=verify_ssl)
                f2 = feedparser.parse(r2.content)
                print(f"      discovered feed.status: {getattr(f2,'status','N/A')}, entries: {len(f2.entries)}, bozo: {getattr(f2,'bozo',False)}")
                if len(f2.entries) > 0:
                    return f2, None
            except Exception as e:
                print(f"      [ERROR] 発見したRSSの取得失敗: {e}")
                return None, e
    return None, None


def _entry_combined_text(entry) -> str:
    """entry の title/summary/content/tags を結合して小文字化した文字列を返す"""
    parts: List[str] = []
    parts.append(entry.get("title") or "")
    parts.append(entry.get("summary") or entry.get("description") or "")

    content_text = ""
    if "content" in entry:
        try:
            c = entry["content"]
            if isinstance(c, list):
                content_text = " ".join([(ci.get("value") if isinstance(ci, dict) else str(ci)) or "" for ci in c])
            elif isinstance(c, dict):
                content_text = c.get("value", "") or ""
            elif isinstance(c, str):
                content_text = c
        except Exception:
            content_text = ""
    parts.append(content_text)

    if "tags" in entry:
        try:
            tag_texts = []
            for t in entry["tags"]:
                if isinstance(t, dict):
                    tag_texts.append(t.get("term", "") or t.get("label", "") or "")
                elif isinstance(t, str):
                    tag_texts.append(t)
            parts.append(" ".join(tag_texts))
        except Exception:
            pass

    combined = "\n".join(parts)
    return html.unescape(combined).lower()


# -----------------------
# メイン関数（外部から呼ぶだけで完結）
# -----------------------
def fetch_from_rss(
    feeds: Optional[List[str]] = None,
    keywords: Optional[List[str]] = None,
    fetch_images: bool = False,
    verify_ssl: bool = True,
    request_timeout: float = REQUEST_TIMEOUT,
    user_agent: str = USER_AGENT,
    max_articles_per_feed: Optional[int] = None,
) -> List[dict]:
    """
    フィード一覧を巡回してパンダ関連記事を返す。
    - feeds: RSS URL リスト（None の場合はデフォルト RSS_FEEDS）
    - keywords: 検索キーワードリスト（None の場合は DEFAULT_KEYWORDS_LOWER）
    - fetch_images: True なら get_main_image を呼ぶ（遅い）
    - verify_ssl: SSL 検証を行うか（デバッグで False にすることは可）
    """
    feeds_to_use = feeds or RSS_FEEDS
    kw_list = [k.lower() for k in (keywords or DEFAULT_KEYWORDS_LOWER)]

    print(f"--- RSSフィード巡回開始 ({len(feeds_to_use)} 件) ---")
    all_articles: List[dict] = []
    seen_urls = set()
    skipped_samples: List[str] = []

    for url in feeds_to_use:
        print(f"[RSS] {url} を巡回中...")
        feed, error = _get_feed_via_requests(url, user_agent, request_timeout, verify_ssl)
        if not feed:
            if error:
                print(f"  [SKIP] {url} でエラー: {error}")
            else:
                print(f"  [SKIP] {url} から有効なフィードが取得できませんでした")
            continue

        source_title = feed.feed.get("title") or urlparse(url).netloc
        entries = feed.entries or []
        for entry in entries:
            article_url = entry.get("link")
            title = entry.get("title") or ""
            if not article_url or not title:
                continue

            # キーワード判定（title+summary+content+tags を結合して検索）
            combined_text = _entry_combined_text(entry)
            if not any(kw in combined_text for kw in kw_list):
                skipped_samples.append(title or article_url or "<no title>")
                continue

            # published の安全取得
            dt_struct = entry.get("published_parsed") or entry.get("updated_parsed")
            if dt_struct:
                try:
                    published_at = parse_published(dt_struct).isoformat()
                except Exception:
                    published_at = entry.get("published") or entry.get("updated") or None
            else:
                published_at = entry.get("published") or entry.get("updated") or None

            # 重複除去（URLベース）
            if article_url in seen_urls:
                continue
            seen_urls.add(article_url)

            print(f"  [FOUND] {title} ({article_url})")

            image_url = None
            if fetch_images and article_url:
                try:
                    image_url = get_main_image(article_url)
                except Exception as e:
                    print(f"    [IMG ERR] {e}")

            all_articles.append({
                "title": title,
                "article_url": article_url,
                "image_url": image_url,
                "source_name": source_title,
                "published_at": published_at
            })

            if max_articles_per_feed and len(all_articles) >= max_articles_per_feed:
                break

    print(f"[収集完了] 総取得記事数: {len(all_articles)} (フィード候補: {len(feeds_to_use)})")
    if skipped_samples:
        print("  スキップサンプル(最大10):")
        for s in skipped_samples[:10]:
            print("   -", s)

    return all_articles


# 実行用
if __name__ == "__main__":
    # デバッグ実行：画像は取得せず高速に動かす
    results = fetch_from_rss(fetch_images=False, verify_ssl=True)
    print(f"合計記事数: {len(results)}")
