#!/usr/bin/env python3
"""
Google Custom Search API を使用したパンダ画像収集モジュール
(article_collector.py と互換性のあるインターフェースを提供)

- fetch_cute_animal_news: メインの収集関数
- get_main_image: 記事URLから画像を取得するヘルパー関数
"""

import os
import sys
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import Optional, List
from urllib.parse import urlparse

# --- 定数 (グローバル) ---
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
HTTP_TIMEOUT = 10
MIN_IMAGE_BYTES = 512
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "ja,en-US;q=0.9,en;q=0.8"})

# --- ヘルパー (内部関数) ---

def fetch_html(url: str, timeout: int = HTTP_TIMEOUT) -> Optional[tuple]:
    """[内部] HTMLを取得して BeautifulSoup オブジェクトを返す"""
    try:
        resp = SESSION.get(url, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()
        return resp.url, BeautifulSoup(resp.text, "html.parser")
    except requests.RequestException as e:
        print(f" [fetch_html エラー] {url} : {e}")
        return None


def validate_image_url(img_url: str, timeout: int = 6) -> bool:
    """[内部] 提供された画像URLが有効か検証する"""
    try:
        if not img_url or not img_url.startswith("http"):
            return False
        
        # HEADリクエストで Content-Type と Content-Length を確認
        try:
            head = SESSION.head(img_url, timeout=timeout, allow_redirects=True)
            if head.status_code >= 400: return False
            ct = head.headers.get("Content-Type", "")
            if not ct.startswith("image/"): return False
            cl = head.headers.get("Content-Length")
            if cl and int(cl) < MIN_IMAGE_BYTES: return False
            return True
        
        # HEADが失敗した場合 (サーバーがHEADをサポートしていない場合)
        except Exception:
            g = SESSION.get(img_url, timeout=timeout, stream=True)
            if g.status_code >= 400: return False
            ct = g.headers.get("Content-Type", "") or ""
            if not ct.startswith("image/"): return False
            first_chunk = next(g.iter_content(1024), b"")
            g.close()
            return len(first_chunk) >= 16
            
    except Exception as e:
        print(f"   [validate_image 例外] {img_url} : {e}")
        return False

# --- 提供関数 1 ---

def get_main_image(article_url: str) -> Optional[str]:
    """
    記事URLをスクレイピングしてOGPや本文からメイン画像を取得する
    (main.py の単発検証モードから呼び出される)
    """
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
            if not txt: continue
            data = json.loads(txt)
            items = data if isinstance(data, list) else [data]
            for it in items:
                if isinstance(it, dict):
                    img = it.get("image") or it.get("thumbnailUrl")
                    if isinstance(img, str):
                        cand = requests.compat.urljoin(final_url, img)
                        if validate_image_url(cand): return cand
                    elif isinstance(img, dict):
                        urlf = img.get("url")
                        if urlf:
                            cand = requests.compat.urljoin(final_url, urlf)
                            if validate_image_url(cand): return cand
                    elif isinstance(img, list):
                        for it2 in img:
                            if isinstance(it2, str):
                                cand = requests.compat.urljoin(final_url, it2)
                                if validate_image_url(cand): return cand
        except Exception:
            continue

    # 3) 本文中画像
    selectors = ["article", "main", "[role='main']", ".post-content", ".article-body", "#content"]
    main_content = None
    for s in selectors:
        main_content = soup.select_one(s)
        if main_content: break
    if not main_content:
        main_content = soup.body

    if main_content:
        for img in main_content.find_all("img", src=True):
            src = img.get("src")
            if not src or src.startswith("data:"): continue
            cand = requests.compat.urljoin(final_url, src)
            if validate_image_url(cand):
                return cand
    return None

# --- 提供関数 2 ---

def fetch_cute_animal_news(api_key: str, cx_id: str) -> List[dict]:
    """
    Google Custom Search API (Image) を使って
    過去24時間 ('d1') のパンダの画像と元記事を取得する
    (main.py のメインバッチ処理から呼び出される)
    
    ※ 元の search_google_panda_images からリネーム
    """
    
    API_URL = "https://www.googleapis.com/customsearch/v1"
    query = 'panda OR "giant panda" OR パンダ OR ジャイアントパンダ'
    
    params = {
        "key": api_key,
        "cx": cx_id,
        "q": query,
        "searchType": "image",
        "dateRestrict": "d1",
        "num": 10,
    }
    
    print(f"--- Google Custom Search API 実行中 (q={query}, dateRestrict=d1) ---")
    
    try:
        response = SESSION.get(API_URL, params=params, timeout=HTTP_TIMEOUT)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as e:
        print(f" [APIリクエストエラー]: {e}")
        if response:
            print(f" [エラー詳細]: {response.text}")
        return []

    results = []
    items = data.get("items")
    
    if not items:
        print(" [情報] 該当する画像は見つかりませんでした。")
        return []

    for item in items:
        title = item.get("title", "(タイトルなし)")
        google_image_url = item.get("link")
        source_article_url = item.get("image", {}).get("contextLink")
        source_name = item.get("displayLink")

        if not source_article_url:
            print(f" [スキップ] 元記事のURLがありません: {title}")
            continue

        print(f"\n* 検証中: {title}")
        print(f"   元記事 (参考文献): {source_article_url}")

        final_image_url = None

        if validate_image_url(google_image_url):
            print(f"   [OK] Google提供の画像を採用: {google_image_url}")
            final_image_url = google_image_url
        else:
            print(f"   [NG] Google提供の画像が無効。元記事をスクレイピングします...")
            scraped_image_url = get_main_image(source_article_url)
            
            if scraped_image_url:
                print(f"   [OK] スクレイピングで画像を発見: {scraped_image_url}")
                final_image_url = scraped_image_url
            else:
                print(f"   [FAIL] スクレイピングでも画像を発見できませんでした。")

        if final_image_url:
            results.append({
                "title": title,
                "article_url": source_article_url,
                "image_url": final_image_url,
                "source_name": source_name,
                "fetched_at": datetime.now().isoformat()
            })

    return results


# --- 単体実行 (テスト) ---
if __name__ == "__main__":
    """
    このスクリプトを直接実行した場合のテスト処理
    (例: python search_panda_images.py)
    """
    print("--- モジュール単体テスト実行 ---")
    
    # .env を読み込む
    from dotenv import load_dotenv
    load_dotenv()
    
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
    CUSTOM_SEARCH_CX = os.environ.get("CUSTOM_SEARCH_CX")

    if not GOOGLE_API_KEY or not CUSTOM_SEARCH_CX:
        print("="*50)
        print("【エラー】 環境変数が設定されていません。")
        print("`.env` ファイルに以下の2行を追加してください:")
        print(" GOOGLE_API_KEY=...")
        print(" CUSTOM_SEARCH_CX=...")
        print("="*50)
        sys.exit(1)

    # メイン関数をテスト実行
    panda_images = fetch_cute_animal_news(GOOGLE_API_KEY, CUSTOM_SEARCH_CX)
    
    print(f"\n{'='*20} 最終結果: {len(panda_images)} 件 {'='*20}")
    
    if not panda_images:
        print("有効なパンダの画像は見つかりませんでした。")
    
    for i, item in enumerate(panda_images):
        print(f"\n【{i+1}】 {item['title']}")
        print(f"   記事(参考文献): {item['article_url']}")
        print(f"   画像URL: {item['image_url']}")
        print(f"   取得元: {item['source_name']}")