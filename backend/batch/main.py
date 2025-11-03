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

# --- グローバル Session を使う（Cookie を保持してブラウザっぽくアクセス） ---
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "ja,en-US;q=0.9,en;q=0.8"})


# --- ヘルパー関数 ---
def is_google_cache_url(u: Optional[str]) -> bool:
    if not u:
        return False
    u = u.lower()
    return any(x in u for x in ("lh3.googleusercontent.com", "googleusercontent", "gstatic.com"))


def fetch_html(url: str, referer: Optional[str] = None, timeout: int = HTTP_TIMEOUT) -> Optional[Tuple[str, BeautifulSoup, requests.Response]]:
    """
    Session を使って GET。最終 URL, BeautifulSoup, 元の Response を返す。
    referer が与えられればヘッダにセットしてアクセス（Google 経由の遷移対策）
    """
    try:
        headers = {}
        if referer:
            headers["Referer"] = referer
        resp = SESSION.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()
        final = resp.url
        soup = BeautifulSoup(resp.text, "html.parser")
        return final, soup, resp
    except requests.RequestException as e:
        print(f"  [fetch_html エラー] {url} : {e}")
        return None


def validate_image_url(img_url: str, timeout: int = 6) -> bool:
    try:
        parsed = urlparse(img_url)
        if not parsed.scheme:
            return False
        headers = {"User-Agent": USER_AGENT}
        # HEAD
        try:
            head = SESSION.head(img_url, timeout=timeout, headers=headers, allow_redirects=True)
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
        g = SESSION.get(img_url, timeout=timeout, headers=headers, stream=True)
        if g.status_code >= 400:
            g.close()
            return False
        ct = g.headers.get("Content-Type", "") or ""
        if not ct.startswith("image/"):
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
        # read little chunk to ensure content
        first_chunk = next(g.iter_content(1024), b"")
        if len(first_chunk) < 16:
            g.close()
            return False
        g.close()
        return True
    except Exception as e:
        print(f"    [validate] 例外: {img_url} : {e}")
        return False


# --- Google リダイレクト・アンラップ ---


def unwrap_google_redirect(href: str) -> Optional[str]:
    if not href:
        return None
    parsed = urlparse(href)
    qs = parse_qs(parsed.query)
    # google.com/url?q=...
    if parsed.netloc.endswith("google.com") and "q" in qs:
        return unquote(qs.get("q")[0])
    if parsed.netloc.endswith("google.com") and "url" in qs:
        return unquote(qs.get("url")[0])
    # AMP proxy patterns: /amp/s/ or /amp/
    m = re.search(r"/amp/(?:s/)?(https?://[^/]+/?.*)", href)
    if m:
        return m.group(1)
    if "/__amp/s/" in href:
        idx = href.find("/__amp/s/")
        candidate = href[idx + len("/__amp/s/") :]
        if candidate.startswith("http"):
            return candidate
        return "https://" + candidate
    # query param containing url=
    if "url=" in parsed.query:
        q = parse_qs(parsed.query).get("url")
        if q:
            return unquote(q[0])
    return None


def extract_urls_from_soup(soup: BeautifulSoup, base_url: str) -> List[str]:
    urls = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href:
            urls.add(urljoin(base_url, href))
    for tag in soup.find_all(src=True):
        src = tag["src"]
        if src:
            urls.add(urljoin(base_url, src))
    # data-* attributes
    for tag in soup.find_all():
        for attr, val in tag.attrs.items():
            if isinstance(val, str) and ("http://" in val or "https://" in val):
                urls.add(urljoin(base_url, val))
    # script/text URL extraction
    text = soup.get_text(separator=" ")
    for u in re.findall(r"https?://[^\s'\"<>]+", text):
        urls.add(u)
    return list(urls)


def score_candidate_url(u: str, base_netloc: str) -> int:
    net = urlparse(u).netloc.lower()
    if not u.startswith("http"):
        return 0
    if "google" in net:
        return 0
    score = 0
    if net != base_netloc:
        score += 10
    if any(x in net for x in ("lh3.", "googleusercontent", "gstatic", "akamai", "cdn")):
        score -= 50
    path = urlparse(u).path or ""
    score += min(len(path), 100)
    if re.search(r"/news/|/article|/articles/|/202\d/|/20\d{2}/|/topics/|/topics/", path):
        score += 20
    return score


def resolve_google_news_original(final_url: str, soup: BeautifulSoup) -> Optional[str]:
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
        unwrapped = unwrap_google_redirect(cand) or cand
        if unwrapped and "google" not in urlparse(unwrapped).netloc:
            print(f"  [解決候補] amphtml -> {unwrapped}")
            return unwrapped
        else:
            print(f"  [amphtml候補(googleプロキシ)]: {unwrapped}")

    # 4) try to unwrap many <a> and other urls
    candidates = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not href:
            continue
        abs_href = urljoin(final_url, href)
        maybe = unwrap_google_redirect(abs_href) or abs_href
        candidates.append(maybe)

    extra_urls = extract_urls_from_soup(soup, final_url)
    candidates.extend(extra_urls)

    # dedupe/norm
    normed = []
    seen = set()
    for u in candidates:
        if not u or not isinstance(u, str):
            continue
        u = u.split("#")[0]
        if u in seen:
            continue
        seen.add(u)
        normed.append(u)

    scored = []
    for u in normed:
        if not u.startswith("http"):
            continue
        net = urlparse(u).netloc.lower()
        if "google" in net and "news.google.com" in base_netloc:
            unwrapped = unwrap_google_redirect(u)
            if unwrapped and "google" not in urlparse(unwrapped).netloc:
                scored.append((unwrapped, score_candidate_url(unwrapped, base_netloc)))
            continue
        if any(x in net for x in ("lh3.googleusercontent.com", "gstatic", "googleusercontent", "akamai", "cdn")):
            continue
        sc = score_candidate_url(u, base_netloc)
        if sc > 0:
            scored.append((u, sc))

    if scored:
        scored.sort(key=lambda t: t[1], reverse=True)
        best, best_score = scored[0]
        print(f"  [解決候補選出] {best} (score={best_score})")
        return best

    # last fallback: extract non-google url from page text
    text_urls = re.findall(r"https?://[^\s'\"<>]+", soup.get_text()[:20000])
    for u in text_urls:
        net = urlparse(u).netloc.lower()
        if "google" in net:
            continue
        print(f"  [テキスト内URL採用] {u}")
        return u

    return None


# --- 画像抽出ロジック ---


def get_main_image(start_url: str) -> Optional[str]:
    tried = set()
    queue = [(start_url, True, None)]  # (url, allow_resolve_google_news, referer)
    while queue:
        cur_url, allow_resolve, referer = queue.pop(0)
        if cur_url in tried:
            continue
        tried.add(cur_url)

        print(f"  [fetch] {cur_url} (referer={referer})")
        fetched = fetch_html(cur_url, referer=referer)
        if not fetched:
            continue
        final_url, soup, resp = fetched
        netloc = urlparse(final_url).netloc.lower()

        # meta refresh detection (自動追従)
        meta_refresh = soup.find("meta", attrs={"http-equiv": re.compile("^refresh$", re.I)})
        if meta_refresh and meta_refresh.get("content"):
            # content="0; url=https://example.com/..."
            m = re.search(r"url=(.+)", meta_refresh["content"], flags=re.I)
            if m:
                next_url = urljoin(final_url, m.group(1).strip().strip("'\""))
                if next_url not in tried:
                    print(f"  [meta refresh -> follow] {next_url}")
                    queue.insert(0, (next_url, False, final_url))
                    continue

        # iframe redirect (よくあるパターン)
        iframe = soup.find("iframe", src=True)
        if iframe:
            src = urljoin(final_url, iframe["src"])
            if src not in tried:
                print(f"  [iframe src -> follow] {src}")
                queue.insert(0, (src, False, final_url))
                continue

        # JS-based redirect patterns in script text (simple heuristics)
        script_text = " ".join([s.string or "" for s in soup.find_all("script") if s.string])
        m = re.search(r"(?:location\.href|window\.location\.href|location\.replace|window\.location|location\.assign)\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", script_text)
        if m:
            jsurl = urljoin(final_url, m.group(1))
            if jsurl not in tried:
                print(f"  [JS redirect -> follow] {jsurl}")
                queue.insert(0, (jsurl, False, final_url))
                continue

        # If it's a Google middle page, try to resolve original
        if allow_resolve and ("news.google.com" in netloc or ("google" in netloc and "news" in final_url)):
            orig = resolve_google_news_original(final_url, soup)
            if orig and orig not in tried:
                orig_abs = urljoin(final_url, orig)
                print(f"  [中間ページ解決 -> 元記事へ再取得]: {orig_abs}")
                queue.insert(0, (orig_abs, False, final_url))  # set referer to final_url (google)
                continue
            else:
                print("  [中間ページ] 元記事解決できず、そのページでOGP探索を継続します")

        # 1) OGP/Twitter/link rel=image_src
        meta_candidates = []
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            meta_candidates.append(og["content"])
        og_secure = soup.find("meta", property="og:image:secure_url")
        if og_secure and og_secure.get("content"):
            meta_candidates.append(og_secure["content"])
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"):
            meta_candidates.append(tw["content"])
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

        # 2) JSON-LD
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
            if href.startswith("http") and "google" not in urlparse(href).netloc:
                return href
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
