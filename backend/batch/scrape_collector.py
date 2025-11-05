#!/usr/bin/env python3
"""
記事データ収集モジュール (個別スクレイピング)
- APIやRSSを提供していない特定のサイトを直接クロールする
- 非常に壊れやすいため、対象は最小限に
"""

from typing import List
from urllib.parse import urljoin
# 共通ヘルパーをインポート
from utils import fetch_html, get_main_image, parse_published
import datetime

# --- ★ 収集対象のサイト情報 ---
# (これは架空のサイト'panda-news.jp'を想定した例です)
TARGET_SITE = {
    "list_url": "https://panda-news.jp/news-list", # 記事一覧ページのURL
    "list_selector": "article.news-item a",       # 記事一覧から記事URLを見つけるCSSセレクタ
    "title_selector": "h1.entry-title",           # 記事ページでタイトルを見つけるCSSセレクタ
    "date_selector": "time.published-date",       # 記事ページで日付を見つけるCSSセレクタ
    "source_name": "Panda News (スクレイプ)"
}

def fetch_from_scraping() -> List[dict]:
    """
    特定のサイトをスクレイピングし、記事辞書のリストを返す。
    (現在はサンプルのため、実際には動作しない可能性が高い)
    """
    print(f"--- 個別スクレイピング開始 ({TARGET_SITE['source_name']}) ---")
    all_articles = []
    
    # 1. 記事一覧ページを取得
    fetched = fetch_html(TARGET_SITE["list_url"])
    if not fetched:
        print(f" [スクレイプ] 記事一覧の取得に失敗: {TARGET_SITE['list_url']}")
        return []
    
    list_page_url, soup = fetched
    
    # 2. 記事一覧ページから個別の記事URLを抽出
    article_links = soup.select(TARGET_SITE["list_selector"])
    
    if not article_links:
        print(f" [スクレイプ] 記事一覧リンクが見つかりません (セレクタ: {TARGET_SITE['list_selector']})")
        return []

    for link in article_links[:10]: # (負荷対策: 最新10件のみ)
        try:
            relative_url = link.get('href')
            if not relative_url:
                continue
                
            article_url = urljoin(list_page_url, relative_url)
            
            # 3. 個別の記事ページをスクレイピング
            # (注: 高速化のため、タイトルや日付も一覧ページから取得する方が望ましいが、
            #      ここでは get_main_image を使うため記事ページを訪問する)
            
            print(f"  [スクレイプ] 記事ページを解析中: {article_url}")
            
            # 4. 共通ヘルパーで画像を取得
            # (get_main_image は内部で fetch_html を呼ぶ)
            image_url = get_main_image(article_url)
            
            # (本来はここでタイトルや日付も個別取得する)
            # (今回は一覧ページのリンクテキストと現在時刻で代用)
            title = link.text.strip() or "スクレイピング記事"
            published_at = datetime.now().isoformat()
            
            if image_url: # 画像があるものだけを採用
                all_articles.append({
                    "title": title,
                    "article_url": article_url,
                    "image_url": image_url,
                    "source_name": TARGET_SITE["source_name"],
                    "published_at": published_at
                })

        except Exception as e:
            print(f"  [スクレイプ] 記事処理エラー: {e}")
            
    return all_articles