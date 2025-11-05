#!/usr/bin/env python3
"""
記事データ収集モジュール (NewsAPI)
- NewsApiClient を使ってパンダに関する記事を取得
- 画像はまず API の urlToImage を使い、なければ utils.py で補完
"""

import time
from urllib.parse import urlparse
from typing import Optional, List
# 共通ヘルパーをインポート
from utils import parse_published, get_main_image, validate_image_url

# NewsAPI クライアントのインポート試行
try:
    from newsapi import NewsApiClient
except Exception:
    NewsApiClient = None

def fetch_from_newsapi(newsapi_key: str, max_pages: int = 1, page_size: int = 100) -> List[dict]:
    """
    NewsAPIからパンダ関連ニュースを収集し、処理済みの記事辞書のリストを返す。
    (関数名を変更)
    """

    if not NewsApiClient:
        print(" [NewsAPI] newsapi ライブラリが見つかりません。pip install newsapi-python を実行してください。")
        return []
    
    if not newsapi_key:
        print(" [NewsAPI] NewsAPIキーが提供されていません。")
        return []

    client = NewsApiClient(api_key=newsapi_key)

    # --- ★ 検索クエリをパンダに特化 ---
    query = (
        '('
        'panda OR パンダ OR "giant panda" OR ジャイアントパンダ OR '
        'シャンシャン OR 香香 OR "アドベンチャーワールド" OR "上野動物園" '
        ') '
        # 必要に応じて除外キーワードを追加
        'NOT (software OR python OR data OR express OR "Panda Security")'
    )

    languages = ["en"]
    collected_articles = [] # 収集した記事を格納するリスト
    
    print(f"--- NewsAPI 実行中 (q={query}) ---")

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

                title = item.get("title") or "(無題)"
                # ★ 共通ヘルパーを使用
                published_dt = parse_published(item.get("publishedAt") or item.get("published"))
                image_url = item.get("urlToImage") or item.get("image")
                source_name = (item.get("source") or {}).get("name") or ""

                # --- 画像検証＆補完 (共通ヘルパーを使用) ---
                if image_url:
                    image_url = image_url.strip()
                    if not validate_image_url(image_url):
                        print(f" [API画像無効] {image_url}")
                        image_url = None

                if not image_url:
                    print("   メイン画像を取得中 (スクレイピング fallback)...")
                    # ★ 共通ヘルパーを使用
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
                
                # タイトルに「パンダ」関連の単語が含まれるものだけを最終的に採用する
                if "panda" in title.lower() or "パンダ" in title or "香香" in title or "シャンシャン" in title:
                    print(f" [NewsAPI] 新規記事候補: {article['title']}")
                    collected_articles.append(article)
                
            # レート制限対策
            time.sleep(0.3)

    return collected_articles