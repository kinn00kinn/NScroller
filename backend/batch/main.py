#!/usr/bin/env python3
import os
import sys
import json
import re
import requests
import feedparser
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs, unquote
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional, Tuple, List

# --- 環境変数読み込み ---
load_dotenv()

RSS_FEEDS = [
    "https://news.google.com/rss/search?q=%E3%83%91%E3%83%B3%E3%83%80&hl=ja&gl=JP&ceid=JP:ja",
    "https://www.tokyo-zoo.net/zoo/ueno/news/atom.xml",
    "https://www.aws-s.com/topics/atom.xml",
    "https://www.worldwildlife.org/feeds/blog/posts",
    "https://nationalzoo.si.edu/news/rss.xml"
]

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("Supabase未設定: ローカル検証モード（DB保存はスキップ）")

MIN_IMAGE_BYTES = 512
HTTP_TIMEOUT = 10
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"

# --- helpers ---


def is_google_cache_url(u: Optional[str]) -> bool:
    if not u:
        return False
    u = u.lower()
    return any(x in u for x in ("lh3.googleusercontent.com", "googleusercontent", "gstatic.com"))


def fetch_html(url: str, timeout: int = HTTP_TIMEOUT) -> Optional[Tuple[str, BeautifulSoup]]:
    try:
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()
        final = resp.url
        soup = BeautifulSoup(resp.text, "html.parser")
        return final, soup
    except requests.RequestException as e:
        print(f"  [fetch_html エラー] {url} : {e}")
        return None


def validate_image_url(img_url: str, timeout: int = 6) -> bool:
    try:
        parsed = urlparse(img_url)
        if not parsed.scheme:
            return False
        headers = {"User-Agent": USER_AGENT}

        # HEAD first
        try:
            head = requests.head(img_url, timeout=timeout, headers=headers, allow_redirects=True)
            if head.status_code >= 400:
                head = None
        except requests.RequestException:
            head = None

        if head:
            ct = head.headers.get("Content-Type", "")
            if ct and ct.startswith("image/"):
                cl = head.headers.get("Content-Length")
                if cl:
                    try:
                        if int(cl) < MIN_IMAGE_BYTES:
                            return False
                    except Exception:
                        pass
                return True

        # fallback GET
        g = requests.get(img_url, timeout=timeout, headers=headers, stream=True)
        if g.status_code >= 400:
            g.close()
            return False
        ct = g.headers.get("Content-Type", "")
        if not (ct and ct.startswith("image/")):
            g.close()
            return False
        cl = g.headers.get("Content-Length")
        if cl:
            try:
                if int(cl) < MIN_IMAGE_BYTES:
                    g.close()
                    return False
            except Exception:
                pass
        # read small chunk
        chunk = next(g.iter_content(1024), b"")
        if len(chunk) < 16:
            g.close()
            return False
        g.close()
        return True
    except Exception as e:
        print(f"    [validate] 例外: {img_url} : {e}")
        return False


# --- Google News 元記事解決ロジック強化 ---


def unwrap_google_redirect(href: str) -> Optional[str]:
    """
    Googleのリダイレクト形式やAMPプロキシをアンラップする。
    例:
      - https://www.google.com/url?q=https%3A%2F%2Fexample.com%2F...
      - https://www.google.com/amp/s/example.com/...
      - /amp/s/example.com/...
    """
    if not href:
        return None
    # full URL?
    parsed = urlparse(href)
    qs = parse_qs(parsed.query)
    # google.com/url?q=...
    if parsed.netloc.endswith("google.com") and "q" in qs:
        q = qs.get("q")[0]
        return unquote(q)
    # google redirect param named 'url' (some variants)
    if parsed.netloc.endswith("google.com") and "url" in qs:
        return unquote(qs.get("url")[0])
    # AMP proxy: contains '/amp/s/' or '/amp/'
    # e.g. https://www.google.com/amp/s/www.example.com/...
    match = re.search(r"/amp/(?:s/)?(https?://[^/]+/?.*)", href)
    if match:
        return match.group(1)
    # news.google.com/__amp/s/www.example.com/...
    if "/__amp/s/" in href:
        idx = href.find("/__amp/s/")
        candidate = href[idx + len("/__amp/s/") :]
        if candidate.startswith("http"):
            return candidate
        return "https://" + candidate
    # query param in non-google host that contains url=
    if "url=" in parsed.query:
        q = parse_qs(parsed.query).get("url")
        if q:
            return unquote(q[0])
    return None


def extract_urls_from_soup(soup: BeautifulSoup, base_url: str) -> List[str]:
    """
    soupの中から href/src/data-*属性などに含まれるURLを幅広く抽出する
    """
    urls = set()

    # 1) hrefs
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href:
            # make absolute if relative
            abs_href = urljoin(base_url, href)
            urls.add(abs_href)

    # 2) src attributes
    for tag in soup.find_all(src=True):
        src = tag["src"]
        if src:
            abs_src = urljoin(base_url, src)
            urls.add(abs_src)

    # 3) data-* attributes that might contain URLs
    for tag in soup.find_all():
        for attr, val in tag.attrs.items():
            if isinstance(val, str) and ("http://" in val or "https://" in val):
                urls.add(val)

    # 4) script/text内のURL（AF_initDataCallback 等に埋められていることがある）
    text = soup.get_text(separator=" ")
    urls_in_text = re.findall(r"https?://[^\s'\"<>]+", text)
    for u in urls_in_text:
        urls.add(u)

    return list(urls)


def score_candidate_url(u: str, base_netloc: str) -> int:
    """
    URL候補の簡易スコアリング
    - googleドメインは除外（呼び出し側で除外済みが望ましい）
    - 同一ドメインよりも外部ニュースドメインの方が高得点
    - パス長（記事っぽさ）を考慮
    """
    net = urlparse(u).netloc.lower()
    if not u.startswith("http"):
        return 0
    if "google" in net:
        return 0
    score = 0
    # prefer different netlocs from base (if base is news.google.com)
    if net != base_netloc:
        score += 10
    # penalize top-level domains that look like CDNs or images (example: si0, lh3, gstatic)
    if any(x in net for x in ("lh3.", "googleusercontent", "gstatic", "akamai", "cdn")):
        score -= 50
    # path length positive
    path = urlparse(u).path or ""
    score += min(len(path), 100)
    # if contains obvious article tokens
    if re.search(r"/news/|/article|/articles/|/202\d/|/20\d{2}/|/topics/|/topics/", path):
        score += 20
    return score


def resolve_google_news_original(final_url: str, soup: BeautifulSoup) -> Optional[str]:
    """
    強化版: 中間ページからあらゆる手段で元記事URLを探す
    """
    base_netloc = urlparse(final_url).netloc.lower()

    # 1) og:url / canonical
    og_url = soup.find("meta", property="og:url")
    if og_url and og_url.get("content"):
        cand = og_url["content"]
        if cand.startswith("http") and "google" not in urlparse(cand).netloc:
            print(f"  [解決] og:url -> {cand}")
            return cand

    canonical = soup.find("link", rel="canonical")
    if canonical and canonical.get("href"):
        cand = canonical["href"]
        if cand.startswith("http") and "google" not in urlparse(cand).netloc:
            print(f"  [解決] canonical -> {cand}")
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
                    url = it.get("url") or it.get("@id")
                    if url and url.startswith("http") and "google" not in urlparse(url).netloc:
                        print(f"  [解決] JSON-LD -> {url}")
                        return url
                    me = it.get("mainEntityOfPage")
                    if isinstance(me, dict):
                        url2 = me.get("@id") or me.get("url")
                        if url2 and url2.startswith("http") and "google" not in urlparse(url2).netloc:
                            print(f"  [解決] JSON-LD.mainEntityOfPage -> {url2}")
                            return url2
        except Exception:
            continue

    # 3) amphtml
    amp = soup.find("link", rel="amphtml")
    if amp and amp.get("href"):
        cand = urljoin(final_url, amp["href"])
        # try to unwrap if it's google amp proxy
        unwrapped = unwrap_google_redirect(cand) or cand
        if unwrapped:
            if "google" not in urlparse(unwrapped).netloc:
                print(f"  [解決候補] amphtml -> {unwrapped}")
                return unwrapped
            else:
                print(f"  [amphtmlはgoogleプロキシ, 候補として残す]: {unwrapped}")

    # 4) find <a> href first pass: prefer non-google
    candidates = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not href:
            continue
        abs_href = urljoin(final_url, href)
        # unwrap google redirect style
        maybe = unwrap_google_redirect(abs_href) or abs_href
        candidates.append(maybe)

    # 5) extract many urls from attributes and text (script etc.)
    extra_urls = extract_urls_from_soup(soup, final_url)
    for u in extra_urls:
        candidates.append(u)

    # normalize and dedupe
    normed = []
    seen = set()
    for u in candidates:
        if not u or not isinstance(u, str):
            continue
        # remove fragments
        u = u.split("#")[0]
        if u in seen:
            continue
        seen.add(u)
        normed.append(u)

    # score and pick best non-google candidate
    scored = []
    for u in normed:
        # skip google domains
        net = urlparse(u).netloc.lower()
        if not u.startswith("http"):
            continue
        if "google" in net and "news.google.com" in base_netloc:
            # accept google amp proxies only if we can unwrap
            unwrapped = unwrap_google_redirect(u)
            if unwrapped and "google" not in urlparse(unwrapped).netloc:
                scored.append((unwrapped, score_candidate_url(unwrapped, base_netloc)))
            continue
        # skip obvious image/CDN hosts
        if any(x in net for x in ("lh3.googleusercontent.com", "gstatic", "googleusercontent", "akamai", "cdn")):
            continue
        sc = score_candidate_url(u, base_netloc)
        if sc > 0:
            scored.append((u, sc))

    if scored:
        # sort by score desc
        scored.sort(key=lambda t: t[1], reverse=True)
        best, best_score = scored[0]
        print(f"  [解決候補選出] {best} (score={best_score})")
        return best

    # final fallback: try to extract first non-google URL from page text
    text_urls = re.findall(r"https?://[^\s'\"<>]+", soup.get_text()[:20000])
    for u in text_urls:
        net = urlparse(u).netloc.lower()
        if "google" in net:
            continue
        print(f"  [テキスト内URL採用] {u}")
        return u

    return None


# --- 画像取得ロジック（OGP優先など） ---


def get_main_image(url: str) -> Optional[str]:
    tried = set()
    queue = [(url, True)]
    while queue:
        cur, allow_resolve = queue.pop(0)
        if cur in tried:
            continue
        tried.add(cur)

        fetched = fetch_html(cur)
        if not fetched:
            continue
        final_url, soup = fetched
        netloc = urlparse(final_url).netloc.lower()

        # Google中間ページの解決（1段）
        if allow_resolve and ("news.google.com" in netloc or ("google" in netloc and "news" in final_url)):
            orig = resolve_google_news_original(final_url, soup)
            if orig and orig not in tried:
                orig_abs = urljoin(final_url, orig)
                print(f"  [中間ページ解決 -> 元記事へ再取得]: {orig_abs}")
                queue.insert(0, (orig_abs, False))
                continue
            else:
                print("  [中間ページ] 元記事解決できず、そのページでOGP探索を継続します")

        # 1) OGP/Twitter/link rel=image_src
        meta_candidates = []
        for tag, attr in [("meta", "og:image"), ("meta", "og:image:secure_url"), ("meta", "twitter:image")]:
            node = soup.find("meta", **({"property": attr} if attr.startswith("og:") else {"name": attr}))
            if node and node.get("content"):
                meta_candidates.append(node["content"])
        link_img = soup.find("link", rel="image_src")
        if link_img and link_img.get("href"):
            meta_candidates.append(link_img["href"])

        for cand in meta_candidates:
            img = urljoin(final_url, cand)
            if is_google_cache_url(img):
                print(f"  [メタ画像除外(Googleキャッシュ)]: {img}")
                continue
            if validate_image_url(img):
                print(f"  [OGP/Twitter画像発見]: {img}")
                return img
            else:
                print(f"  [メタ画像は無効]: {img}")

        # 2) JSON-LD images
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                js = script.string
                if not js:
                    continue
                data = json.loads(js)
                items = data if isinstance(data, list) else [data]
                for it in items:
                    if isinstance(it, dict):
                        imgfield = it.get("image") or it.get("thumbnailUrl")
                        if isinstance(imgfield, str):
                            img = urljoin(final_url, imgfield)
                            if not is_google_cache_url(img) and validate_image_url(img):
                                print(f"  [JSON-LD画像発見]: {img}")
                                return img
                        elif isinstance(imgfield, dict):
                            urlf = imgfield.get("url")
                            if urlf:
                                img = urljoin(final_url, urlf)
                                if not is_google_cache_url(img) and validate_image_url(img):
                                    print(f"  [JSON-LD画像発見]: {img}")
                                    return img
                        elif isinstance(imgfield, list):
                            for it2 in imgfield:
                                if isinstance(it2, str):
                                    img = urljoin(final_url, it2)
                                    if not is_google_cache_url(img) and validate_image_url(img):
                                        print(f"  [JSON-LD画像発見]: {img}")
                                        return img
            except Exception:
                continue

        # 3) 本文中の画像
        selectors = ["article", "main", "[role='main']", ".main-content", ".post-content", ".article-body", "#content"]
        main_content = None
        for s in selectors:
            main_content = soup.select_one(s)
            if main_content:
                print(f"  [本文コンテナ発見]: {s}")
                break
        if not main_content:
            main_content = soup.body

        if main_content:
            candidates = []
            for img_tag in main_content.find_all("img", src=True):
                src = img_tag["src"]
                if src.startswith("data:"):
                    continue
                abs_img = urljoin(final_url, src)
                if is_google_cache_url(abs_img):
                    print(f"    [本文内画像除外(Googleキャッシュ)]: {abs_img}")
                    continue
                candidates.append(abs_img)
            for c in candidates:
                if validate_image_url(c):
                    print(f"  [本文内画像発見]: {c}")
                    return c
                else:
                    print(f"    [本文内画像は無効]: {c}")

        # 4) その他 meta keys
        extra = soup.find("meta", property="og:image:secure_url")
        if extra and extra.get("content"):
            img = urljoin(final_url, extra["content"])
            if not is_google_cache_url(img) and validate_image_url(img):
                print(f"  [og:image:secure_url発見]: {img}")
                return img

        print("  [画像未発見] このURLでは見つかりませんでした。")
    return None


def extract_original_from_google_description(description_html: str) -> Optional[str]:
    try:
        dsoup = BeautifulSoup(description_html, "html.parser")
        a = dsoup.find("a", href=True)
        if a:
            href = a["href"]
            # 直接外部ならそのまま
            if href.startswith("http") and "google" not in urlparse(href).netloc:
                return href
            # それ以外は返して get_main_image 側でアンラップ/解決を試みる
            return href
    except Exception:
        pass
    return None


# --- フィード処理 ---


def process_feed_once(feed_url: str):
    print(f"\n--- フィード処理: {feed_url}")
    try:
        feed = feedparser.parse(feed_url)
        source_name = getattr(feed.feed, "title", "不明なソース")
        is_google_news = "news.google.com" in feed_url

        for entry in feed.entries:
            article_url = None
            image_url = None

            if is_google_news:
                if hasattr(entry, "description") and entry.description:
                    orig = extract_original_from_google_description(entry.description)
                    if orig:
                        article_url = orig
                        print(f"  [Google News -> 元記事URL抽出]: {article_url}")
                    else:
                        article_url = getattr(entry, "link", None)
                        print(f"  [Google News] description抽出失敗。entry.linkを使用: {article_url}")
                else:
                    article_url = getattr(entry, "link", None)
                    print(f"  [Google News] descriptionなし。entry.linkを使用: {article_url}")

                # RSS内サムネイルがあればフォールバック（ただしgoogle cache排除）
                if hasattr(entry, "description") and entry.description:
                    dsoup = BeautifulSoup(entry.description, "html.parser")
                    img_tag = dsoup.find("img", src=True)
                    if img_tag:
                        cand = img_tag["src"]
                        if not is_google_cache_url(cand) and validate_image_url(cand):
                            image_url = cand
                            print(f"  [Google News サムネイル採用]: {image_url}")
                        else:
                            print(f"  [Google News サムネイル除外または無効]: {cand}")

            else:
                if not hasattr(entry, "link") or not entry.link:
                    print("  [RSS] リンクなし -> スキップ")
                    continue
                article_url = entry.link

                if hasattr(entry, "media_content") and entry.media_content:
                    for m in entry.media_content:
                        urlm = m.get("url")
                        if urlm and not is_google_cache_url(urlm) and validate_image_url(urlm):
                            image_url = urlm
                            print(f"  [RSS内画像発見]: {image_url}")
                            break
                if not image_url and hasattr(entry, "enclosures"):
                    for e in entry.enclosures:
                        href = e.get("href")
                        if href and e.get("type", "").startswith("image/") and not is_google_cache_url(href) and validate_image_url(href):
                            image_url = href
                            print(f"  [Enclosure画像発見]: {image_url}")
                            break

            if not article_url:
                print("  [記事URL不明] -> スキップ")
                continue

            # 重複チェック
            if supabase:
                existing = supabase.table("articles").select("id").eq("article_url", article_url).execute()
                if existing.data:
                    print("  [既存記事] スキップ")
                    continue

            published_dt = datetime(*entry.published_parsed[:6]) if hasattr(entry, "published_parsed") else datetime.now()

            print(f"  メイン画像を取得中: {article_url}")
            scraped = get_main_image(article_url)
            if scraped:
                image_url = scraped
            else:
                print("  [最終フォールバック] RSSサムネ等を使用（存在すれば）")

            article = {
                "title": getattr(entry, "title", "(無題)"),
                "article_url": article_url,
                "published_at": published_dt.isoformat(),
                "source_name": source_name,
                "image_url": image_url,
            }

            print(f"  新規記事追加: {article['title']} （image: {image_url}）")
            if supabase:
                try:
                    supabase.table("articles").insert(article).execute()
                except Exception as e:
                    print(f"    [Supabase挿入エラー]: {e}")

    except Exception as e:
        print(f"  [フィード処理エラー] {feed_url} : {e}")


def main():
    args = sys.argv[1:]
    if args:
        for u in args:
            print(f"\n=== 単発検証: {u}")
            img = get_main_image(u)
            if img:
                print(f"FOUND image: {img}")
            else:
                print("NO image found.")
        return

    print("データ収集バッチ開始")
    for feed in RSS_FEEDS:
        process_feed_once(feed)
    print("データ収集バッチ完了")


if __name__ == "__main__":
    main()
