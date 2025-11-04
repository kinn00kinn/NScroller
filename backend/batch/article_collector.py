#!/usr/bin/env python3
"""
記事データ収集モジュール (NewsAPI + スクレイピング)
- NewsApiClient を使って動物に関する記事を取得
- 画像はまず API の urlToImage を使い、なければ簡易スクレイピングで補完
- DBに関するロジックは一切含まない
"""

import sys
import time
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Optional, List
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse # 変更：urlparseをインポート

# NewsAPI クライアントのインポート試行
try:
    from newsapi import NewsApiClient
except Exception:
    NewsApiClient = None

# --- 定数 ---
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
HTTP_TIMEOUT = 10
MIN_IMAGE_BYTES = 512
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "ja,en-US;q=0.9,en;q=0.8"})

# --- ヘルパー (元コードからそのままコピー) ---

def parse_published(pubval) -> datetime:
    if not pubval:
        return datetime.now()
    if isinstance(pubval, (int, float)):
        try:
            return datetime.fromtimestamp(int(pubval))
        except Exception:
            return datetime.now()
    if isinstance(pubval, str):
        try:
            return datetime.fromisoformat(pubval.replace("Z", "+00:00"))
        except Exception:
            pass
        try:
            return parsedate_to_datetime(pubval)
        except Exception:
            pass
    return datetime.now()


def fetch_html(url: str, timeout: int = HTTP_TIMEOUT) -> Optional[tuple]:
    try:
        resp = SESSION.get(url, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()
        return resp.url, BeautifulSoup(resp.text, "html.parser")
    except requests.RequestException as e:
        print(f" [fetch_html エラー] {url} : {e}")
        return None


def validate_image_url(img_url: str, timeout: int = 6) -> bool:
    try:
        if not img_url or not img_url.startswith("http"):
            return False
        try:
            head = SESSION.head(img_url, timeout=timeout, allow_redirects=True)
            if head.status_code >= 400:
                return False
            ct = head.headers.get("Content-Type", "")
            if not ct.startswith("image/"):
                return False
            cl = head.headers.get("Content-Length")
            if cl and int(cl) < MIN_IMAGE_BYTES:
                return False
            return True
        except Exception:
            g = SESSION.get(img_url, timeout=timeout, stream=True)
            if g.status_code >= 400:
                return False
            ct = g.headers.get("Content-Type", "") or ""
            if not ct.startswith("image/"):
                return False
            first_chunk = next(g.iter_content(1024), b"")
            g.close()
            return len(first_chunk) >= 16
    except Exception as e:
        print(f"  [validate_image 例外] {img_url} : {e}")
        return False


def get_main_image(article_url: str) -> Optional[str]:
    fetched = fetch_html(article_url)
    if not fetched:
        return None
    final_url, soup = fetched

    # 1) OGP / Twitter
    meta_keys = [
        ("meta", {"property": "og:image"}, "content"),
        ("meta", {"property": "og:image:secure_url"}, "content"),
        ("meta", {"name": "twitter:image"}, "content"),
    ]
    for tag, attrs, attrname in meta_keys:
        t = soup.find(tag, attrs=attrs)
        if t and t.get(attrname):
            cand = requests.compat.urljoin(final_url, t.get(attrname))
            if validate_image_url(cand):
                return cand

    # 2) JSON-LD
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            txt = script.string
            if not txt:
                continue
            data = json.loads(txt)
            items = data if isinstance(data, list) else [data]
            for it in items:
                if isinstance(it, dict):
                    img = it.get("image") or it.get("thumbnailUrl")
                    if isinstance(img, str):
                        cand = requests.compat.urljoin(final_url, img)
                        if validate_image_url(cand):
                            return cand
                    elif isinstance(img, dict):
                        urlf = img.get("url")
                        if urlf:
                            cand = requests.compat.urljoin(final_url, urlf)
                            if validate_image_url(cand):
                                return cand
                    elif isinstance(img, list):
                        for it2 in img:
                            if isinstance(it2, str):
                                cand = requests.compat.urljoin(final_url, it2)
                                if validate_image_url(cand):
                                    return cand
        except Exception:
            continue

    # 3) 本文中画像
    selectors = ["article", "main", "[role='main']", ".post-content", ".article-body", "#content"]
    main_content = None
    for s in selectors:
        main_content = soup.select_one(s)
        if main_content:
            break
    if not main_content:
        main_content = soup.body

    if main_content:
        for img in main_content.find_all("img", src=True):
            src = img.get("src")
            if not src or src.startswith("data:"):
                continue
            cand = requests.compat.urljoin(final_url, src)
            if validate_image_url(cand):
                return cand
    return None


# --- NewsAPI から収集 (DBロジックを削除) ---

def fetch_cute_animal_news(newsapi_key: str, max_pages: int = 3, page_size: int = 100) -> List[dict]:
    """
    かわいい動物ニュース収集版
    NewsAPIから記事を収集し、処理済みの記事辞書のリストを返す。
    """

    if not NewsApiClient:
        print("newsapi ライブラリが見つかりません。pip install newsapi-python を実行してください。")
        return []
    
    if not newsapi_key:
        print("NewsAPIキーが提供されていません。")
        return []

    client = NewsApiClient(api_key=newsapi_key)

    # --- 検索クエリ ---
    query = (
        '('
        'panda OR パンダ OR "giant panda" OR '
        'cat OR 猫 OR ねこ OR kitten OR 子猫 OR '
        'dog OR 犬 OR いぬ OR puppy OR 子犬 OR '
        'red panda OR レッサーパンダ OR otter OR カワウソ OR '
        'hedgehog OR ハリネズミ OR ferret OR フェレット OR rabbit OR うさぎ OR ウサギ '
        ') '
        'AND (cute OR かわいい OR adorable OR 動物 OR animal OR zoo OR 赤ちゃん OR baby OR cub OR 癒し OR "アドベンチャーワールド" OR 上野 OR 和歌山 OR 神戸) '
        'NOT (software OR python OR data OR express OR antivirus OR library OR analysis OR programming OR code)'
    )

    languages = ["ja", "en"]
    collected_articles = [] # 収集した記事を格納するリスト

    for lang in languages:
        for page in range(1, max_pages + 1):
            try:
                res = client.get_everything(
                    q=query,
                    language=lang,
                    page=page,
                    page_size=page_size,
                    sort_by="publishedAt"
                )
            except Exception as e:
                print(f" [NewsAPI 取得失敗] lang={lang} page={page} : {e}")
                break

            articles = res.get("articles") or []
            if not articles:
                break

            for item in articles:
                url = (item.get("url") or "").strip()
                if not url:
                    continue

                # ★★★ DB既存チェックはここから削除 ★★★
                # (DBマネージャーが担当)

                title = item.get("title") or "(無題)"
                published_dt = parse_published(item.get("publishedAt") or item.get("published"))
                image_url = item.get("urlToImage") or item.get("image")
                source_name = (item.get("source") or {}).get("name") or ""

                # --- 画像検証＆補完 ---
                if image_url:
                    image_url = image_url.strip()
                    if not validate_image_url(image_url):
                        print(f" [API画像無効] {image_url}")
                        image_url = None

                if not image_url:
                    print(" メイン画像を取得中 (スクレイピング fallback)...")
                    scraped = get_main_image(url)
                    if scraped:
                        image_url = scraped

                article = {
                    "title": title,
                    "article_url": url,
                    "published_at": published_dt.isoformat(),
                    "source_name": source_name or urlparse(url).netloc,
                    "image_url": image_url,
                }

                print(f" 新規記事候補: {article['title']} （image: {image_url}）")
                collected_articles.append(article)
                
                # ★★★ DB挿入ロジックはここから削除 ★★★

            # レート制限対策
            time.sleep(0.3)

    return collected_articles