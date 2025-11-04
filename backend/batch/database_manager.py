#!/usr/bin/env python3
"""
データベース管理モジュール (Supabase)
- Supabaseクライアントの初期化
- 記事データのリストを受け取り、重複をチェックしながらDBに保存
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Optional, List

def init_supabase_client() -> Optional[Client]:
    """
    環境変数を読み込み、Supabaseクライアントを初期化して返す
    """
    load_dotenv()
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

    if SUPABASE_URL and SUPABASE_KEY:
        print("Supabaseクライアントを初期化しました。")
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    else:
        print("Supabase未設定: ローカル検証モード（DB保存はスキップ）")
        return None

def save_articles_to_db(supabase_client: Optional[Client], articles: List[dict]) -> int:
    """
    記事データのリストを受け取り、DBに保存する。
    重複チェックを行ってから、新規分を一括挿入する。
    """
    if not supabase_client:
        print("DBクライアント未設定のため、保存処理をスキップします。")
        return 0
    
    if not articles:
        print("保存対象の記事がありません。")
        return 0

    articles_to_insert = []
    
    # 元コードのロジック（1件ずつチェック）を踏襲
    for item in articles:
        url = item.get("article_url")
        if not url:
            continue
            
        try:
            # --- 既存チェック ---
            existing = supabase_client.table("articles").select("id").eq("article_url", url).execute()
            if existing.data:
                print(f" [既存記事] {url} -> スキップ")
                continue
            
            # 存在しない場合、挿入リストに追加
            print(f" 新規記事追加予定: {item['title']}")
            articles_to_insert.append(item)
            
        except Exception as e:
            print(f" [Supabase チェックエラー] {url} : {e}")

    # --- 新規記事を一括挿入 ---
    total_inserted = 0
    if articles_to_insert:
        print(f"--- {len(articles_to_insert)} 件の新規記事をDBに一括挿入します ---")
        try:
            supabase_client.table("articles").insert(articles_to_insert).execute()
            total_inserted = len(articles_to_insert)
            print(f" [Supabase挿入成功] {total_inserted} 件")
        except Exception as e:
            print(f"  [Supabase一括挿入エラー]: {e}")
    else:
        print("--- 追加対象の新規記事はありませんでした ---")

    return total_inserted