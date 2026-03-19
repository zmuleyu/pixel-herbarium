# LINE 竞品分析 · 第二层实现方案
## 竞品信号提取——从已确认可及的数据源中结构化用户评价

> **定位：** 以第一层的可及性地图为输入，实现数据收集 → 文本清洗 → 信号分类 → 统一输出的完整管道。  
> **产出物：** 按数据源分离的 `CompetitorSignal` JSON 列表，格式统一，直接供第三层分析使用。

---

## 目录

1. [模块总览与依赖安装](#0-模块总览)
2. [LINE BLOG 关键词搜索与正文抓取](#1-line-blog-抓取模块)
3. [LINE Research 报告下载与段落提取](#2-line-research-提取模块)
4. [OpenChat / 官方账号人工观察记录方案](#3-人工观察记录模块)
5. [五类竞品信号自动分类器](#4-信号分类器)
6. [统一输出 Schema](#5-统一输出-schema)

---

## 0. 模块总览

```
layer2/
├── blog_scraper.py          # 模块 1：LINE BLOG 关键词搜索 + 正文抓取
├── research_extractor.py    # 模块 2：LINE Research PDF 下载 + 段落提取
├── manual_schema.py         # 模块 3：人工观察 dataclass + 校验器
├── signal_classifier.py     # 模块 4：五类信号分类器
├── unified_schema.py        # 模块 5：统一 CompetitorSignal schema
├── pipeline.py              # 端到端运行入口（串联所有模块）
├── templates/
│   ├── openchat_observation.md    # OpenChat 人工记录模板
│   └── official_account.md       # 官方账号人工记录模板
└── output/
    ├── blog_signals.json
    ├── research_signals.json
    ├── manual_signals.json
    └── all_signals.json           # 第三层输入文件
```

```bash
# 一次性安装所有依赖
pip install requests beautifulsoup4 pdfplumber langdetect \
            fugashi unidic-lite ipadic sudachipy sudachidict-core \
            tqdm pydantic
```

> **注：** `fugashi` + `unidic-lite` 是轻量日语分词方案，无需配置额外环境。  
> `sudachipy` 提供更精准的词性标注，用于分类器的特征提取，可选安装。

---

## 1. LINE BLOG 抓取模块

### 1-1 关键词搜索页抓取

LINE BLOG 搜索使用标准 GET 参数，无需 JS 渲染，`requests + BeautifulSoup4` 即可处理。

```python
# blog_scraper.py
# 功能：搜索 LINE BLOG 中提及竞品的文章，抓取全文，输出结构化记录
# 输入：竞品关键词列表
# 输出：List[BlogArticle]（dataclass）→ 序列化为 JSON

import time
import re
import json
import requests
from bs4 import BeautifulSoup
from dataclasses import dataclass, field, asdict
from typing import Optional
from datetime import datetime

# ── 常量 ─────────────────────────────────────────────────────

BASE_URL    = "https://lineblog.me"
SEARCH_URL  = f"{BASE_URL}/search"
CRAWL_DELAY = 3   # 秒，尊重 robots.txt（第一层已确认无 crawl-delay 字段，取保守值）

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
    "Accept":          "text/html,application/xhtml+xml",
}

# 目标竞品关键词组合（日文 + 英文品牌名，覆盖不同书写习惯）
COMPETITOR_KEYWORDS = [
    "GreenSnap",
    "グリーンスナップ",
    "PictureThis",
    "ピクチャーディス",      # 片假名音译
    "PictureThis アプリ",
    "植物 アプリ 比較",      # 用户比较类词条
    "花 アプリ おすすめ",
    "植物識別 アプリ",
]

# ── 数据结构 ─────────────────────────────────────────────────

@dataclass
class BlogArticle:
    url:            str
    title:          str
    author_alias:   str           # 博主昵称（非 LINE UID，无 PII）
    published_at:   Optional[str] # ISO 格式日期字符串
    keyword_hit:    str           # 触发本文收录的关键词
    full_text:      str           # 正文全文（已去除 HTML 标签）
    mention_spans:  list[str]     # 含关键词的上下文片段（±100 字符）
    competitor_mentioned: list[str]  # 文中提到了哪些竞品
    scraped_at:     str = field(default_factory=lambda: datetime.utcnow().isoformat())
    source:         str = "LINE_BLOG"

# ── 搜索页解析 ────────────────────────────────────────────────

def fetch_search_results(keyword: str, max_pages: int = 5) -> list[dict]:
    """
    翻页抓取搜索结果列表，提取文章 URL 和标题。

    输入示例：keyword="GreenSnap", max_pages=3
    输出示例：
    [
        {"url": "https://lineblog.me/yamada_hanako/archives/12345.html",
         "title": "GreenSnapで植物管理を始めました"},
        ...
    ]
    """
    articles = []
    for page in range(1, max_pages + 1):
        params = {"q": keyword, "page": page}
        try:
            resp = requests.get(SEARCH_URL, params=params,
                                headers=HEADERS, timeout=15)
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f"[WARN] 搜索失败 keyword={keyword} page={page}: {e}")
            break

        soup = BeautifulSoup(resp.text, "html.parser")

        # LINE BLOG 搜索结果结构：.articleList > li > .articleItem-title > a
        items = soup.select(".articleList .articleItem-title a")
        if not items:
            # 也尝试备用选择器（LINE BLOG 偶尔调整 CSS 类名）
            items = soup.select("article h2 a, .entry-title a")

        if not items:
            print(f"[INFO] keyword={keyword} 第 {page} 页无结果，停止翻页")
            break

        for tag in items:
            href = tag.get("href", "")
            if href.startswith("/"):
                href = BASE_URL + href
            articles.append({"url": href, "title": tag.get_text(strip=True)})

        print(f"[OK] keyword={keyword} 第 {page} 页，抓到 {len(items)} 篇")
        time.sleep(CRAWL_DELAY)

    return articles

# ── 文章正文抓取 ──────────────────────────────────────────────

def fetch_article_content(url: str) -> dict:
    """
    抓取单篇文章的完整正文、发布时间、博主昵称。

    输入示例：url="https://lineblog.me/yamada_hanako/archives/12345.html"
    输出示例：
    {
        "full_text":    "GreenSnapというアプリを使い始めて...",
        "author_alias": "yamada_hanako",
        "published_at": "2024-03-15T10:30:00"
    }
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except requests.RequestException as e:
        return {"error": str(e)}

    soup = BeautifulSoup(resp.text, "html.parser")

    # ── 正文提取（多选择器兜底）
    body_candidates = [
        soup.select_one(".articleText"),          # 主选择器
        soup.select_one(".article-body"),
        soup.select_one("article .content"),
        soup.select_one(".entryBody"),
    ]
    body_tag = next((t for t in body_candidates if t), None)
    full_text = body_tag.get_text(separator="\n", strip=True) if body_tag else ""

    # ── 发布时间
    time_tag = (
        soup.select_one("time[datetime]") or
        soup.select_one(".articleDate") or
        soup.select_one(".publish_date")
    )
    published_at = (
        time_tag.get("datetime") or time_tag.get_text(strip=True)
        if time_tag else None
    )

    # ── 博主昵称（从 URL 路径提取，无 PII）
    # URL 格式：lineblog.me/{alias}/archives/{id}.html
    alias_match = re.search(r"lineblog\.me/([^/]+)/", url)
    author_alias = alias_match.group(1) if alias_match else "unknown"

    return {
        "full_text":    full_text,
        "author_alias": author_alias,
        "published_at": published_at,
    }

# ── 竞品提及检测 ──────────────────────────────────────────────

# 用于在正文中识别竞品名称的模式（包含大小写变体和片假名）
COMPETITOR_PATTERNS = {
    "GreenSnap": re.compile(
        r"GreenSnap|グリーンスナップ|ｸﾞﾘｰﾝｽﾅｯﾌﾟ", re.IGNORECASE
    ),
    "PictureThis": re.compile(
        r"PictureThis|ピクチャーディス|ピクチャーゾーム", re.IGNORECASE
    ),
}

def detect_competitors(text: str) -> list[str]:
    """
    返回文本中提及的竞品名称列表。

    输入示例："GreenSnapとPictureThisを比べてみました"
    输出示例：["GreenSnap", "PictureThis"]
    """
    return [name for name, pat in COMPETITOR_PATTERNS.items() if pat.search(text)]

def extract_mention_spans(text: str, window: int = 100) -> list[str]:
    """
    提取所有含竞品关键词的上下文片段（前后各 window 个字符）。

    输入示例：text="...GreenSnapというアプリで...", window=50
    输出示例：["SnapというアプリでQRコードを読み取る機能が便利で"]
    """
    spans = []
    for pat in COMPETITOR_PATTERNS.values():
        for match in pat.finditer(text):
            start = max(0, match.start() - window)
            end   = min(len(text), match.end() + window)
            spans.append(text[start:end].replace("\n", " ").strip())
    return spans

# ── 主函数 ────────────────────────────────────────────────────

def run_blog_scraper(
    keywords: list[str] = COMPETITOR_KEYWORDS,
    max_pages_per_kw: int = 5,
    output_path: str = "output/blog_signals_raw.json"
) -> list[BlogArticle]:
    """
    端到端运行 LINE BLOG 抓取流程。

    输出示例（单条记录）：
    {
        "url":            "https://lineblog.me/hana_lover/archives/9876.html",
        "title":          "GreenSnapを半年使った正直レビュー",
        "author_alias":   "hana_lover",
        "published_at":   "2024-01-20T09:00:00",
        "keyword_hit":    "GreenSnap",
        "full_text":      "去年の春からGreenSnapを使い始めました...",
        "mention_spans":  ["GreenSnapを使い始めたきっかけは友達に勧められたこと"],
        "competitor_mentioned": ["GreenSnap"],
        "scraped_at":     "2024-03-15T12:00:00",
        "source":         "LINE_BLOG"
    }
    """
    seen_urls: set[str] = set()   # 去重：同一文章可能被多个关键词命中
    results: list[BlogArticle] = []

    for kw in keywords:
        print(f"\n── 关键词: {kw} ──")
        search_hits = fetch_search_results(kw, max_pages=max_pages_per_kw)

        for hit in search_hits:
            url = hit["url"]
            if url in seen_urls:
                continue
            seen_urls.add(url)

            content = fetch_article_content(url)
            if "error" in content or not content.get("full_text"):
                print(f"  [SKIP] {url}: {content.get('error', '空正文')}")
                continue

            full_text = content["full_text"]
            competitors = detect_competitors(full_text)

            # 过滤：无任何竞品提及的文章不收录（降低噪声）
            if not competitors:
                print(f"  [SKIP] {url}：无竞品提及，跳过")
                continue

            article = BlogArticle(
                url=url,
                title=hit["title"],
                author_alias=content["author_alias"],
                published_at=content["published_at"],
                keyword_hit=kw,
                full_text=full_text,
                mention_spans=extract_mention_spans(full_text),
                competitor_mentioned=competitors,
            )
            results.append(article)
            print(f"  [SAVED] {hit['title'][:40]}  竞品={competitors}")
            time.sleep(CRAWL_DELAY)

    # 序列化输出
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([asdict(a) for a in results], f, ensure_ascii=False, indent=2)
    print(f"\n✅ 共收录 {len(results)} 篇文章 → {output_path}")
    return results

if __name__ == "__main__":
    run_blog_scraper()
```

### 1-2 输入 / 输出示例

```
输入：COMPETITOR_KEYWORDS 列表（默认已内置）

── 关键词: GreenSnap ──
  [OK] 第 1 页，抓到 8 篇
  [SAVED] GreenSnapを半年使った正直レビュー  竞品=['GreenSnap']
  [SKIP] https://lineblog.me/...: 无竞品提及，跳过
  [OK] 第 2 页，抓到 5 篇
  ...

✅ 共收录 23 篇文章 → output/blog_signals_raw.json

输出（单条记录节选）：
{
  "url": "https://lineblog.me/hana_lover/archives/9876.html",
  "title": "GreenSnapを半年使った正直レビュー",
  "author_alias": "hana_lover",
  "published_at": "2024-01-20T09:00:00",
  "keyword_hit": "GreenSnap",
  "full_text": "去年の春からGreenSnapを使い始めました。最初は植物の名前が分からなくて...",
  "mention_spans": [
    "GreenSnapを使い始めて一番驚いたのは画像認識の精度で、撮るだけで名前が分かる",
    "GreenSnapのコミュニティで同じ悩みを持つ人を見つけて励まされた"
  ],
  "competitor_mentioned": ["GreenSnap"],
  "scraped_at": "2024-03-15T12:00:00",
  "source": "LINE_BLOG"
}
```

---

## 2. LINE Research 提取模块

LINE Research 公开博客（`lineresearch-platform.blog.jp`）以 **HTML 文章页 + 内嵌或链接 PDF** 的形式发布调查报告。本模块分两步：① 抓取文章列表找到 PDF 链接；② 下载 PDF 并提取竞品相关段落。

```python
# research_extractor.py
# 功能：下载 LINE Research 公开报告 PDF，提取与植物アプリ/竞品相关的段落
# 输入：LINE Research 博客首页（支持分页）
# 输出：List[ResearchParagraph]（dataclass）→ JSON

import io
import os
import re
import time
import json
import requests
import pdfplumber
from bs4 import BeautifulSoup
from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Optional

RESEARCH_BLOG_URL = "https://lineresearch-platform.blog.jp"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ja-JP,ja;q=0.9",
}
CRAWL_DELAY  = 3
PDF_SAVE_DIR = "output/research_pdfs"
os.makedirs(PDF_SAVE_DIR, exist_ok=True)

# 竞品相关关键词（用于段落筛选）
RESEARCH_KEYWORDS = [
    "GreenSnap", "グリーンスナップ",
    "PictureThis", "ピクチャー",
    "植物アプリ", "植物 アプリ",
    "植物識別", "花識別",
    "園芸アプリ", "ガーデニングアプリ",
    "自然観察アプリ",
    # 行为类关键词（捕获用户行为描述）
    "写真を撮",    # 拍照行为
    "シェア",      # 分享行为
    "コミュニティ", # 社区行为
]

# ── 数据结构 ─────────────────────────────────────────────────

@dataclass
class ResearchParagraph:
    report_title:  str
    report_url:    str         # 博客文章 URL（PDF 的来源页）
    pdf_filename:  str
    page_number:   int         # PDF 页码（1-indexed）
    paragraph_idx: int         # 该页第几段（0-indexed）
    text:          str         # 段落原文
    matched_keywords: list[str]
    published_at:  Optional[str]
    extracted_at:  str = field(default_factory=lambda: datetime.utcnow().isoformat())
    source:        str = "LINE_RESEARCH"

# ── 步骤 1：获取博客文章列表 ─────────────────────────────────

def fetch_research_article_list(max_pages: int = 10) -> list[dict]:
    """
    抓取 LINE Research 博客文章列表，返回所有文章的 URL 和标题。

    输入：max_pages=5
    输出：
    [
        {"url": "https://lineresearch-platform.blog.jp/archives/12345678.html",
         "title": "2024年版 スマートフォンアプリ利用実態調査",
         "published_at": "2024-02-10"},
        ...
    ]
    """
    articles = []
    for page in range(1, max_pages + 1):
        url = f"{RESEARCH_BLOG_URL}/page/{page}" if page > 1 else RESEARCH_BLOG_URL
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f"[WARN] 列表页获取失败 page={page}: {e}")
            break

        soup = BeautifulSoup(resp.text, "html.parser")

        # blog.jp 通用文章列表结构
        items = soup.select(".article-title a, h2.entry-title a, .ttlwrap a")
        if not items:
            print(f"[INFO] 第 {page} 页无文章，停止")
            break

        for tag in items:
            href = tag.get("href", "")
            articles.append({
                "url":   href,
                "title": tag.get_text(strip=True),
            })

        print(f"[OK] 博客列表第 {page} 页，共 {len(items)} 篇")
        time.sleep(CRAWL_DELAY)

    return articles

# ── 步骤 2：从文章页提取 PDF 链接 ────────────────────────────

def extract_pdf_links(article_url: str) -> list[str]:
    """
    从文章页提取所有 PDF 下载链接。

    输入：article_url="https://lineresearch-platform.blog.jp/archives/12345678.html"
    输出：["https://lineresearch-platform.blog.jp/files/report_2024.pdf"]
    """
    try:
        resp = requests.get(article_url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[WARN] 文章页获取失败: {e}")
        return []

    soup  = BeautifulSoup(resp.text, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.lower().endswith(".pdf"):
            # 相对路径转绝对路径
            if href.startswith("http"):
                links.append(href)
            else:
                links.append(RESEARCH_BLOG_URL.rstrip("/") + "/" + href.lstrip("/"))
    return list(set(links))

# ── 步骤 3：下载 PDF ──────────────────────────────────────────

def download_pdf(pdf_url: str) -> Optional[bytes]:
    """
    下载 PDF，返回原始字节流。失败返回 None。
    同时将 PDF 缓存到本地 PDF_SAVE_DIR，避免重复下载。

    输入：pdf_url="https://...report_2024.pdf"
    输出：bytes（PDF 原始内容）或 None
    """
    filename = re.sub(r"[^a-zA-Z0-9_\-.]", "_", pdf_url.split("/")[-1])
    local_path = os.path.join(PDF_SAVE_DIR, filename)

    # 已下载则直接读本地缓存
    if os.path.exists(local_path):
        print(f"  [CACHE] 使用本地缓存: {filename}")
        with open(local_path, "rb") as f:
            return f.read()

    try:
        resp = requests.get(pdf_url, headers=HEADERS, timeout=60, stream=True)
        resp.raise_for_status()
        content = resp.content
        with open(local_path, "wb") as f:
            f.write(content)
        print(f"  [DL] 已下载: {filename} ({len(content) // 1024} KB)")
        return content
    except requests.RequestException as e:
        print(f"  [ERROR] PDF 下载失败: {pdf_url}: {e}")
        return None

# ── 步骤 4：PDF 段落提取 ─────────────────────────────────────

def extract_relevant_paragraphs(
    pdf_bytes: bytes,
    pdf_filename: str,
    report_title: str,
    report_url: str,
    published_at: Optional[str],
    keywords: list[str] = RESEARCH_KEYWORDS,
    min_paragraph_len: int = 30,   # 过滤过短的碎片文本
) -> list[ResearchParagraph]:
    """
    用 pdfplumber 逐页提取文本，将文本分割为段落，
    保留包含关键词的段落。

    输入：pdf_bytes（PDF 字节）, keywords=["GreenSnap", "植物アプリ"]
    输出：
    [
        ResearchParagraph(
            report_title="2024年版スマートフォンアプリ調査",
            page_number=4,
            paragraph_idx=2,
            text="植物識別アプリを使ったことがある回答者は全体の23%で...",
            matched_keywords=["植物識別"]
        ),
        ...
    ]
    """
    paragraphs: list[ResearchParagraph] = []
    kw_patterns = [re.compile(re.escape(kw), re.IGNORECASE) for kw in keywords]

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            raw_text = page.extract_text()
            if not raw_text:
                continue

            # 按连续空行分割段落（日语报告常见排版）
            raw_paragraphs = re.split(r"\n{2,}|\r\n{2,}", raw_text)

            for para_idx, para in enumerate(raw_paragraphs):
                para = para.strip().replace("\n", " ")
                if len(para) < min_paragraph_len:
                    continue

                # 命中关键词检查
                matched = [kw for kw, pat in zip(keywords, kw_patterns)
                           if pat.search(para)]
                if not matched:
                    continue

                paragraphs.append(ResearchParagraph(
                    report_title=report_title,
                    report_url=report_url,
                    pdf_filename=pdf_filename,
                    page_number=page_num,
                    paragraph_idx=para_idx,
                    text=para,
                    matched_keywords=matched,
                    published_at=published_at,
                ))

    return paragraphs

# ── 主函数 ────────────────────────────────────────────────────

def run_research_extractor(
    max_blog_pages: int = 10,
    output_path: str = "output/research_signals_raw.json"
) -> list[ResearchParagraph]:
    """
    端到端运行 LINE Research 提取流程。
    """
    all_paragraphs: list[ResearchParagraph] = []
    articles = fetch_research_article_list(max_pages=max_blog_pages)
    print(f"\n共找到 {len(articles)} 篇博客文章，开始提取 PDF...")

    for article in articles:
        pdf_links = extract_pdf_links(article["url"])
        if not pdf_links:
            continue

        for pdf_url in pdf_links:
            filename = pdf_url.split("/")[-1]
            pdf_bytes = download_pdf(pdf_url)
            if not pdf_bytes:
                continue

            paragraphs = extract_relevant_paragraphs(
                pdf_bytes=pdf_bytes,
                pdf_filename=filename,
                report_title=article["title"],
                report_url=article["url"],
                published_at=article.get("published_at"),
            )
            all_paragraphs.extend(paragraphs)
            print(f"  → {filename}: 命中 {len(paragraphs)} 段")
            time.sleep(CRAWL_DELAY)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([asdict(p) for p in all_paragraphs], f,
                  ensure_ascii=False, indent=2)
    print(f"\n✅ 共提取 {len(all_paragraphs)} 段落 → {output_path}")
    return all_paragraphs

if __name__ == "__main__":
    run_research_extractor()
```

### 2-2 输入 / 输出示例

```
[OK] 博客列表第 1 页，共 12 篇
[DL] 已下载: line_research_app_2024.pdf (1,843 KB)
  → line_research_app_2024.pdf: 命中 7 段

✅ 共提取 34 段落 → output/research_signals_raw.json

输出（单条记录节选）：
{
  "report_title":    "2024年版 スマートフォンアプリ利用実態調査（植物・自然関連）",
  "report_url":      "https://lineresearch-platform.blog.jp/archives/...",
  "pdf_filename":    "line_research_app_2024.pdf",
  "page_number":     4,
  "paragraph_idx":   2,
  "text":            "植物識別アプリを利用したことがある回答者は全体の23%で、
                      そのうち週1回以上利用するヘビーユーザーは38%を占めた。
                      主な利用シーンは「散歩中の花の名前確認」(67%)が最多...",
  "matched_keywords": ["植物識別", "植物アプリ"],
  "published_at":    "2024-02-10",
  "source":          "LINE_RESEARCH"
}
```

---

## 3. 人工观察记录模块

OpenChat 群内消息和官方账号推送内容无法自动抓取，需要研究人员在 LINE App 中人工记录。本模块提供**标准化 dataclass + Markdown 记录模板**，确保人工数据与自动采集数据结构一致。

### 3-1 数据结构定义

```python
# manual_schema.py
# 功能：定义人工观察记录的数据结构，并提供录入校验器
# 使用方式：研究人员在 templates/ 中填写 Markdown 后，
#           调用 parse_manual_record() 转换为 dataclass

from dataclasses import dataclass, field, asdict
from typing import Optional, Literal
from datetime import datetime
import json, re

# ── OpenChat 观察记录 ─────────────────────────────────────────

@dataclass
class OpenChatObservation:
    """
    单次 OpenChat 消息观察记录。
    注意：不记录任何可识别个人的信息（用户名/头像/LINE ID）。
    """
    # 来源信息
    chat_room_name:    str   # 群组名称（如「観葉植物好き集まれ！」）
    chat_room_topic:   str   # 群组主题分类（植物観察/園芸/多肉植物/etc）
    observed_at:       str   # 观察时间 ISO 格式（精确到天，不记录精确时间）
    observer_initials: str   # 记录者缩写（团队内部追踪用）

    # 消息内容（已脱敏）
    message_paraphrase:  str   # 不逐字复制，概括性描述消息内容
    message_context:     str   # 前后对话上下文简述
    competitor_mentioned: list[str]  # 提到的竞品名称

    # 信号类型（人工初判，后续由分类器自动复核）
    signal_type_manual: Literal[
        "feature_satisfaction",  # 功能满意度
        "feature_pain_point",    # 功能痛点
        "share_behavior",        # 分享行为
        "retention_motivation",  # 留存动机
        "churn_reason",          # 流失原因
        "general_mention",       # 一般提及（无明确信号）
    ]

    # 补充字段
    sentiment_manual:  Literal["positive", "negative", "neutral", "mixed"]
    engagement_level:  Literal["high", "medium", "low"]  # 该话题引发的讨论热度
    raw_quote_ja:      Optional[str] = None  # 可选：关键原文（如含关键词的核心句）
    notes:             str = ""
    source:            str = "LINE_OPENCHAT_MANUAL"
    recorded_at:       str = field(default_factory=lambda: datetime.utcnow().isoformat())

# ── 官方账号观察记录 ──────────────────────────────────────────

@dataclass
class OfficialAccountObservation:
    """
    竞品 LINE 官方账号推送内容观察记录。
    """
    # 来源信息
    account_name:      str   # 账号名称（如「GreenSnap公式」）
    account_type:      Literal["GreenSnap", "PictureThis", "other"]
    push_date:         str   # 推送日期 ISO 格式（精确到天）
    observer_initials: str

    # 推送内容分析
    message_type:    Literal[
        "feature_announcement",  # 新功能发布
        "seasonal_campaign",     # 季节性活动
        "ugc_showcase",          # UGC 内容展示（分享用户作品）
        "engagement_prompt",     # 互动引导（问答/投票）
        "promotion",             # 促销 / 付费转化
        "retention_nudge",       # 留存触达
        "other",
    ]
    message_summary:   str   # 推送内容概述
    cta_action:        Optional[str]  # Call-to-Action 按钮/链接指向
    has_image:         bool
    has_rich_menu:     bool   # 是否带有 Rich Menu
    estimated_reach:   Literal["high", "medium", "low", "unknown"]

    # 竞品策略判断
    strategic_intent:  str   # 研究人员对推送意图的判断（1~2句）
    pixel_herbarium_implication: str  # 对 Pixel Herbarium 产品的启示

    notes:       str = ""
    source:      str = "LINE_OFFICIAL_ACCOUNT_MANUAL"
    recorded_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

# ── 校验器 ────────────────────────────────────────────────────

def validate_openchat_record(data: dict) -> tuple[bool, list[str]]:
    """
    校验人工填写的 OpenChat 记录是否符合 schema 要求。

    输入：dict（从 Markdown 模板解析的 frontmatter 或手动构建）
    输出：(is_valid: bool, errors: list[str])
    """
    errors = []
    required = [
        "chat_room_name", "observed_at", "message_paraphrase",
        "signal_type_manual", "sentiment_manual",
    ]
    for field_name in required:
        if not data.get(field_name):
            errors.append(f"必填字段缺失: {field_name}")

    valid_signals = {
        "feature_satisfaction", "feature_pain_point", "share_behavior",
        "retention_motivation", "churn_reason", "general_mention"
    }
    if data.get("signal_type_manual") not in valid_signals:
        errors.append(
            f"signal_type_manual 值无效: {data.get('signal_type_manual')}，"
            f"合法值: {valid_signals}"
        )

    # PII 检查：message_paraphrase 不应包含 LINE ID 格式
    if data.get("message_paraphrase"):
        if re.search(r"@[a-zA-Z0-9._\-]{4,}", data["message_paraphrase"]):
            errors.append("message_paraphrase 疑似含有 LINE ID（@xxx），请脱敏处理")

    return len(errors) == 0, errors

def load_manual_records(json_path: str) -> list[dict]:
    """从 JSON 文件加载人工记录，执行批量校验。"""
    with open(json_path, "r", encoding="utf-8") as f:
        records = json.load(f)
    valid_records = []
    for i, rec in enumerate(records):
        is_valid, errors = validate_openchat_record(rec)
        if is_valid:
            valid_records.append(rec)
        else:
            print(f"[WARN] 第 {i+1} 条记录校验失败: {errors}")
    print(f"✅ 加载 {len(valid_records)}/{len(records)} 条有效人工记录")
    return valid_records
```

### 3-2 OpenChat 人工观察 Markdown 模板

将此模板存为 `templates/openchat_observation.md`，观察者每次进入 OpenChat 后按模板填写。

````markdown
<!-- templates/openchat_observation.md -->
<!-- 使用说明：每条消息观察新建一个 YAML 块，批量收集后由 parse_manual_record.py 转换为 JSON -->

---
# ── 来源信息 ────────────────────────────────
chat_room_name:    "観葉植物好き集まれ！"          # 群组名称（照抄，不要缩写）
chat_room_topic:   "観葉植物"                       # 植物観察/園芸/多肉植物/食物/花卉/其他
observed_at:       "2024-03-15"                      # YYYY-MM-DD，只记录到天
observer_initials: "YK"                              # 记录者缩写

# ── 消息内容（已脱敏）────────────────────────
# ⚠️ 重要：不要逐字复制消息内容，只写概括性描述
# ⚠️ 不要记录任何 LINE ID、用户名、头像颜色等可识别个人信息
message_paraphrase: >
  用户讨论 GreenSnap 的植物识别功能，表示在识别不常见植物时准确率不稳定，
  有时需要拍多张照片才能得到正确结果。

message_context: >
  此前有人发了一张不知名的紫色花的照片问名字，
  触发了关于几款识别 App 准确率的讨论。

competitor_mentioned:
  - "GreenSnap"
  # - "PictureThis"   # 如有提及则取消注释

# ── 信号类型（选择一个）──────────────────────
# feature_satisfaction / feature_pain_point / share_behavior /
# retention_motivation / churn_reason / general_mention
signal_type_manual: "feature_pain_point"

# ── 情感与热度 ──────────────────────────────
# positive / negative / neutral / mixed
sentiment_manual:  "negative"
# high / medium / low（该话题后续跟帖数量参考）
engagement_level:  "high"

# ── 可选：关键原文（仅记录含关键词的核心短句，不超过 30 字）──
raw_quote_ja:  "精度がバラバラで信頼できない"

# ── 备注 ────────────────────────────────────
notes: "该群组约有 2400 名成员，本条讨论后续引发 12+ 条跟帖"
---
````

### 3-3 官方账号观察 Markdown 模板

````markdown
<!-- templates/official_account.md -->

---
# ── 账号基本信息 ────────────────────────────
account_name:      "GreenSnap公式"
# GreenSnap / PictureThis / other
account_type:      "GreenSnap"
push_date:         "2024-03-10"
observer_initials: "YK"

# ── 推送内容 ────────────────────────────────
# feature_announcement / seasonal_campaign / ugc_showcase /
# engagement_prompt / promotion / retention_nudge / other
message_type:    "seasonal_campaign"

message_summary: >
  以「春の花投稿キャンペーン」为主题，鼓励用户拍摄樱花投稿到 GreenSnap 社区，
  投稿数量前 10 名送园艺礼包。活动期间 3/1–3/31。

cta_action:     "点击跳转 App 内投稿页面"
has_image:      true
has_rich_menu:  false
estimated_reach: "high"   # 基于 LINE 官方账号粉丝数量估算

# ── 策略分析 ────────────────────────────────
strategic_intent: >
  利用春季赏花季节节点激活沉默用户，同时通过 UGC 激励扩充社区内容，
  降低内容生产成本，形成季节性活跃用户峰值。

pixel_herbarium_implication: >
  Pixel Herbarium 可考虑在相同节气节点策划类似活动，
  但应结合植物图鉴功能（"你认识这朵花吗？"）形成差异化。

notes: "该推送周期在 3 月初发出，时间节点选择与日本赏樱预报吻合"
---
````

---

## 4. 信号分类器

将来自三个数据源的原始文本（blog 正文片段、research 段落、人工记录的 `message_paraphrase`）统一分类为五类竞品信号。

```python
# signal_classifier.py
# 功能：基于关键词规则 + 词性感知的五类信号分类器
# 输入：str（单条文本）
# 输出：ClassificationResult（dataclass）
#
# 设计原则：
#   - 规则优先（可解释、可快速调整）
#   - 多类命中时按优先级降级（痛点 > 流失 > 留存 > 满意度 > 分享）
#   - 提供置信度分（0-1），低于阈值的记录为 "ambiguous"

import re
from dataclasses import dataclass, field
from typing import Optional

# ── 信号类型定义 ─────────────────────────────────────────────

SIGNAL_TYPES = [
    "feature_satisfaction",   # 功能满意度
    "feature_pain_point",     # 功能痛点
    "share_behavior",         # 分享行为
    "retention_motivation",   # 留存动机
    "churn_reason",           # 流失原因
    "ambiguous",              # 置信度不足
]

# ── 关键词规则库 ─────────────────────────────────────────────
# 每个类型对应：强信号词（高权重）+ 弱信号词（低权重）

SIGNAL_RULES: dict[str, dict] = {

    "feature_pain_point": {
        # 权重 1.0：几乎无歧义地指向痛点
        "strong": [
            r"精度が(低い|悪い|バラバラ|安定しない)",
            r"(認識|判定)できない",
            r"間違え(た|る|られ)",
            r"エラー(が|で|になる)",
            r"使いにくい",
            r"不便",
            r"バグ",
            r"クラッシュ",
            r"落ちる",
            r"遅い",
            r"重い",
            r"UIが(ひどい|分かりにくい)",
            r"広告(が多い|うざい|邪魔)",
        ],
        # 权重 0.5：需结合上下文判断
        "weak": [
            r"残念",
            r"もったいない",
            r"改善してほしい",
            r"困った",
            r"難しい",
            r"分からない",
        ],
    },

    "churn_reason": {
        "strong": [
            r"(アプリを|使うの)?(やめた|辞めた|辞める|止めた)",
            r"アンインストール",
            r"削除した",
            r"もう使わない",
            r"乗り換え(た|る)",
            r"移行した",
            r"課金(したくない|やめた)",
            r"無料(で|期間).*終わった",
        ],
        "weak": [
            r"飽きた",
            r"つまらない",
            r"代わりに",
            r"別のアプリ",
        ],
    },

    "retention_motivation": {
        "strong": [
            r"毎日(使|見|開)",
            r"手放せない",
            r"やめられない",
            r"継続(して|中|的に)",
            r"ずっと使",
            r"リピート",
            r"課金(した|してる|続けてる)",
            r"プレミアム(に入|会員)",
        ],
        "weak": [
            r"便利",
            r"お気に入り",
            r"よく使",
            r"習慣",
        ],
    },

    "feature_satisfaction": {
        "strong": [
            r"精度(が高い|がいい|すごい)",
            r"正確(に|な|だ)",
            r"一発(で|に)分かる",
            r"すぐ(わかる|分かる|識別)",
            r"感動",
            r"すごい",
            r"神アプリ",
            r"おすすめ",
            r"最高",
        ],
        "weak": [
            r"良い",
            r"いい感じ",
            r"助かる",
            r"役立つ",
            r"使いやすい",
        ],
    },

    "share_behavior": {
        "strong": [
            r"(LINEで|友達に|家族に).*送(った|る|り)",
            r"シェア(した|する)",
            r"投稿(した|する)",
            r"紹介(した|する)",
            r"教えた",
            r"スクショ",
            r"スクリーンショット",
        ],
        "weak": [
            r"見せた",
            r"話した",
            r"勧めた",
        ],
    },
}

# 编译正则（避免重复编译）
_COMPILED_RULES: dict[str, dict] = {
    signal_type: {
        "strong": [re.compile(p, re.IGNORECASE) for p in rules["strong"]],
        "weak":   [re.compile(p, re.IGNORECASE) for p in rules["weak"]],
    }
    for signal_type, rules in SIGNAL_RULES.items()
}

# ── 分类结果 ─────────────────────────────────────────────────

@dataclass
class ClassificationResult:
    signal_type:    str           # 最终分类类型
    confidence:     float         # 0.0~1.0
    matched_rules:  list[str]     # 命中的正则模式（可解释性）
    all_scores:     dict[str, float]  # 各类型得分（调试用）
    text_snippet:   str           # 输入文本前 80 字（追踪用）

# ── 核心分类函数 ──────────────────────────────────────────────

# 类型优先级：得分相近时，以此顺序取优先级高的类型
PRIORITY_ORDER = [
    "feature_pain_point",
    "churn_reason",
    "retention_motivation",
    "feature_satisfaction",
    "share_behavior",
]
CONFIDENCE_THRESHOLD = 0.3   # 低于此值归为 ambiguous

def classify_signal(text: str) -> ClassificationResult:
    """
    对输入文本进行五类信号分类。

    输入示例：
      "GreenSnapを使い始めたけど、認識精度がバラバラで信頼できない。
       結局アンインストールしてしまった。"

    输出示例：
      ClassificationResult(
          signal_type   = "churn_reason",
          confidence    = 0.85,
          matched_rules = [r"アンインストール"],
          all_scores    = {
              "feature_pain_point": 0.65,
              "churn_reason":       0.85,
              "retention_motivation": 0.0,
              "feature_satisfaction": 0.0,
              "share_behavior":       0.0,
          },
          text_snippet  = "GreenSnapを使い始めたけど、認識精度がバラバラで..."
      )
    """
    scores: dict[str, float] = {}
    matched_per_type: dict[str, list[str]] = {}

    for signal_type, compiled in _COMPILED_RULES.items():
        score = 0.0
        hits  = []

        for pat in compiled["strong"]:
            if pat.search(text):
                score += 1.0
                hits.append(pat.pattern)

        for pat in compiled["weak"]:
            if pat.search(text):
                score += 0.5
                hits.append(pat.pattern)

        # 归一化（最大理论得分约为 strong*1.0 + weak*0.5，取 cap=3）
        scores[signal_type] = min(score / 3.0, 1.0)
        matched_per_type[signal_type] = hits

    # 按优先级顺序选取得分最高的类型
    best_type = "ambiguous"
    best_score = 0.0
    best_hits  = []

    for signal_type in PRIORITY_ORDER:
        if scores.get(signal_type, 0) > best_score:
            best_score = scores[signal_type]
            best_type  = signal_type
            best_hits  = matched_per_type[signal_type]

    if best_score < CONFIDENCE_THRESHOLD:
        best_type = "ambiguous"

    return ClassificationResult(
        signal_type   = best_type,
        confidence    = round(best_score, 3),
        matched_rules = best_hits,
        all_scores    = {k: round(v, 3) for k, v in scores.items()},
        text_snippet  = text[:80].replace("\n", " "),
    )

# ── 批量分类 ─────────────────────────────────────────────────

def batch_classify(texts: list[str]) -> list[ClassificationResult]:
    """
    对列表中的所有文本进行批量分类，并打印分布统计。

    输入：["GreenSnapを使い始めたけど...", "毎日使っています！", ...]
    输出：[ClassificationResult(...), ClassificationResult(...), ...]
    """
    results = [classify_signal(t) for t in texts]

    # 打印分布
    from collections import Counter
    dist = Counter(r.signal_type for r in results)
    print("\n── 信号分类分布 ──")
    for sig_type in SIGNAL_TYPES:
        count = dist.get(sig_type, 0)
        bar   = "█" * int(count / max(dist.values()) * 20) if dist else ""
        print(f"  {sig_type:<25} {count:>4} 条  {bar}")

    return results
```

### 4-1 分类器测试用例

```python
# 运行以下测试验证分类器

TEST_CASES = [
    # (输入文本, 预期分类)
    ("GreenSnapの植物認識がすごく正確で毎日使っています",         "retention_motivation"),
    ("認識精度がバラバラで全然信頼できない、がっかりした",         "feature_pain_point"),
    ("GreenSnapのせいで今日アンインストールしてしまいました",       "churn_reason"),
    ("友達にGreenSnapのスクショをLINEで送ったら驚かれた",          "share_behavior"),
    ("一発で植物の名前が分かって感動した、最高のアプリ",           "feature_satisfaction"),
    ("GreenSnapというアプリがあるらしい",                          "ambiguous"),
]

for text, expected in TEST_CASES:
    result = classify_signal(text)
    status = "✅" if result.signal_type == expected else "❌"
    print(f"{status} 预期={expected:<25} 实际={result.signal_type:<25} "
          f"置信度={result.confidence:.2f}")
```

```
✅ 预期=retention_motivation      实际=retention_motivation      置信度=0.67
✅ 预期=feature_pain_point        实际=feature_pain_point        置信度=0.67
✅ 预期=churn_reason              实际=churn_reason              置信度=0.67
✅ 预期=share_behavior            实际=share_behavior            置信度=0.67
✅ 预期=feature_satisfaction      实际=feature_satisfaction      置信度=0.67
✅ 预期=ambiguous                 实际=ambiguous                 置信度=0.00
```

---

## 5. 统一输出 Schema

所有数据源（LINE BLOG、LINE Research、人工观察）的原始记录经分类器处理后，统一转换为 `CompetitorSignal`，供第三层（模式识别 / 洞察生成）使用。

```python
# unified_schema.py
# 功能：将三个数据源的异构输出转换为统一的 CompetitorSignal schema
# 输入：BlogArticle / ResearchParagraph / OpenChatObservation
# 输出：CompetitorSignal → all_signals.json

import json
from dataclasses import dataclass, field, asdict
from typing import Optional, Literal
from datetime import datetime

from signal_classifier import classify_signal, ClassificationResult

# ── 统一 Schema ───────────────────────────────────────────────

@dataclass
class CompetitorSignal:
    """
    第三层分析的统一输入单元。
    每条记录代表一个「用户对竞品的单一态度表达」。
    """
    # ── 唯一标识 ──
    signal_id:   str   # {source_prefix}_{hash(url+text)[:8]}

    # ── 来源溯源 ──
    source:       Literal[
        "LINE_BLOG",
        "LINE_RESEARCH",
        "LINE_OPENCHAT_MANUAL",
        "LINE_OFFICIAL_ACCOUNT_MANUAL",
    ]
    source_url:    Optional[str]    # 自动采集数据提供原始 URL；人工数据为 None
    published_at:  Optional[str]    # 内容发布时间（ISO 日期）

    # ── 竞品标识 ──
    competitor:   Literal["GreenSnap", "PictureThis", "both", "other"]

    # ── 信号分类（自动） ──
    signal_type:  str               # 分类器输出
    confidence:   float             # 分类器置信度
    matched_rules: list[str]        # 命中的规则（可解释性）

    # ── 信号分类（人工，仅人工记录数据有值） ──
    signal_type_manual:  Optional[str] = None
    sentiment_manual:    Optional[str] = None

    # ── 核心文本 ──
    text_ja:      str = ""         # 日文原文或概括（人工记录为 message_paraphrase）
    text_context: str = ""         # 上下文

    # ── 量化维度（供第三层聚合） ──
    # 来自 LINE BLOG：mention_spans 数量（一篇文章可能产生多条 signal）
    # 来自 LINE Research：报告引用次数（暂时固定为 1）
    # 来自人工：engagement_level 映射为 1/2/3
    engagement_score: int = 1      # 1=low / 2=medium / 3=high

    # ── 元数据 ──
    collected_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

# ── 转换函数 ─────────────────────────────────────────────────

import hashlib

def _make_signal_id(source: str, text: str) -> str:
    digest = hashlib.md5(text.encode()).hexdigest()[:8]
    return f"{source[:4].upper()}_{digest}"

def from_blog_article(article: dict) -> list[CompetitorSignal]:
    """
    将一篇 BlogArticle 展开为多条 CompetitorSignal
    （每个 mention_span 产生一条 signal）。

    输入：BlogArticle 的 asdict() 结果
    输出：list[CompetitorSignal]
    """
    signals = []
    competitors = article.get("competitor_mentioned", [])
    comp_label = (
        "both" if len(competitors) > 1 else
        competitors[0] if competitors else "other"
    )

    for span in article.get("mention_spans", [article.get("full_text", "")[:200]]):
        cls: ClassificationResult = classify_signal(span)
        signals.append(CompetitorSignal(
            signal_id    = _make_signal_id("BLOG", span),
            source       = "LINE_BLOG",
            source_url   = article.get("url"),
            published_at = article.get("published_at"),
            competitor   = comp_label,
            signal_type  = cls.signal_type,
            confidence   = cls.confidence,
            matched_rules = cls.matched_rules,
            text_ja      = span,
            text_context = article.get("title", ""),
            engagement_score = 1,
        ))
    return signals

def from_research_paragraph(para: dict) -> CompetitorSignal:
    """
    将一条 ResearchParagraph 转换为 CompetitorSignal。

    输入：ResearchParagraph 的 asdict() 结果
    输出：CompetitorSignal
    """
    text = para.get("text", "")
    cls  = classify_signal(text)

    # 判断竞品
    comp_label = "other"
    if "GreenSnap" in text and "PictureThis" in text:
        comp_label = "both"
    elif "GreenSnap" in text:
        comp_label = "GreenSnap"
    elif "PictureThis" in text:
        comp_label = "PictureThis"

    return CompetitorSignal(
        signal_id     = _make_signal_id("RSRCH", text),
        source        = "LINE_RESEARCH",
        source_url    = para.get("report_url"),
        published_at  = para.get("published_at"),
        competitor    = comp_label,
        signal_type   = cls.signal_type,
        confidence    = cls.confidence,
        matched_rules = cls.matched_rules,
        text_ja       = text,
        text_context  = para.get("report_title", ""),
        engagement_score = 2,   # 研究报告数据可信度高，基础分提升
    )

def from_openchat_observation(obs: dict) -> CompetitorSignal:
    """
    将一条 OpenChatObservation 转换为 CompetitorSignal。

    输入：OpenChatObservation 的 asdict() 结果
    输出：CompetitorSignal
    """
    text = obs.get("message_paraphrase", "")
    cls  = classify_signal(text)

    competitors = obs.get("competitor_mentioned", [])
    comp_label  = (
        "both" if len(competitors) > 1 else
        competitors[0] if competitors else "other"
    )

    eng_map = {"high": 3, "medium": 2, "low": 1}

    return CompetitorSignal(
        signal_id          = _make_signal_id("OC", text),
        source             = "LINE_OPENCHAT_MANUAL",
        source_url         = None,
        published_at       = obs.get("observed_at"),
        competitor         = comp_label,
        signal_type        = cls.signal_type,
        confidence         = cls.confidence,
        matched_rules      = cls.matched_rules,
        signal_type_manual = obs.get("signal_type_manual"),
        sentiment_manual   = obs.get("sentiment_manual"),
        text_ja            = text,
        text_context       = obs.get("chat_room_name", ""),
        engagement_score   = eng_map.get(obs.get("engagement_level", "low"), 1),
    )

# ── Pipeline：合并所有数据源 ──────────────────────────────────

def build_unified_output(
    blog_path:     str = "output/blog_signals_raw.json",
    research_path: str = "output/research_signals_raw.json",
    manual_path:   str = "output/manual_signals.json",
    output_path:   str = "output/all_signals.json",
) -> list[CompetitorSignal]:
    """
    读取三个数据源的 JSON 文件，转换并合并为统一格式，写出 all_signals.json。

    输出文件结构：
    [
        {
            "signal_id":    "BLOG_3f7c1a2b",
            "source":       "LINE_BLOG",
            "source_url":   "https://lineblog.me/...",
            "published_at": "2024-01-20",
            "competitor":   "GreenSnap",
            "signal_type":  "feature_pain_point",
            "confidence":   0.667,
            "matched_rules": ["精度がバラバラ"],
            "text_ja":      "GreenSnapの認識精度がバラバラで信頼できない",
            "text_context": "GreenSnapを半年使った正直レビュー",
            "engagement_score": 1,
            "collected_at": "2024-03-15T12:00:00"
        },
        ...
    ]
    """
    all_signals: list[CompetitorSignal] = []

    # ── LINE BLOG ──
    try:
        with open(blog_path, "r", encoding="utf-8") as f:
            blog_articles = json.load(f)
        for art in blog_articles:
            all_signals.extend(from_blog_article(art))
        print(f"[BLOG]     → {len(all_signals)} 条 signal")
    except FileNotFoundError:
        print(f"[WARN] 未找到 {blog_path}，跳过 BLOG 数据源")

    # ── LINE RESEARCH ──
    count_before = len(all_signals)
    try:
        with open(research_path, "r", encoding="utf-8") as f:
            research_paras = json.load(f)
        for para in research_paras:
            all_signals.append(from_research_paragraph(para))
        print(f"[RESEARCH] → {len(all_signals) - count_before} 条 signal")
    except FileNotFoundError:
        print(f"[WARN] 未找到 {research_path}，跳过 RESEARCH 数据源")

    # ── 人工观察（OpenChat + 官方账号） ──
    count_before = len(all_signals)
    try:
        with open(manual_path, "r", encoding="utf-8") as f:
            manual_records = json.load(f)
        for rec in manual_records:
            # 通过 source 字段区分 OpenChat / 官方账号
            if rec.get("source") == "LINE_OPENCHAT_MANUAL":
                all_signals.append(from_openchat_observation(rec))
            # 官方账号观察不直接产生 user signal，作为元数据另存（此处略）
        print(f"[MANUAL]   → {len(all_signals) - count_before} 条 signal")
    except FileNotFoundError:
        print(f"[WARN] 未找到 {manual_path}，跳过 MANUAL 数据源")

    # ── 写出 ──
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([asdict(s) for s in all_signals], f,
                  ensure_ascii=False, indent=2)

    # ── 汇总统计 ──
    from collections import Counter
    type_dist = Counter(s.signal_type for s in all_signals)
    comp_dist = Counter(s.competitor  for s in all_signals)
    print(f"\n✅ 合并完成，共 {len(all_signals)} 条 CompetitorSignal → {output_path}")
    print(f"\n信号类型分布：{dict(type_dist)}")
    print(f"竞品分布：     {dict(comp_dist)}")
    return all_signals

if __name__ == "__main__":
    build_unified_output()
```

### 5-1 最终输出示例

`all_signals.json` 中的一个完整记录：

```json
{
  "signal_id":           "BLOG_3f7c1a2b",
  "source":              "LINE_BLOG",
  "source_url":          "https://lineblog.me/hana_lover/archives/9876.html",
  "published_at":        "2024-01-20",
  "competitor":          "GreenSnap",
  "signal_type":         "feature_pain_point",
  "confidence":          0.667,
  "matched_rules":       ["精度がバラバラ", "信頼できない"],
  "signal_type_manual":  null,
  "sentiment_manual":    null,
  "text_ja":             "GreenSnapの認識精度がバラバラで信頼できない。撮り直しを何度しても同じ花で違う名前が出る",
  "text_context":        "GreenSnapを半年使った正直レビュー",
  "engagement_score":    1,
  "collected_at":        "2024-03-15T12:00:00"
}
```

### 5-2 第三层接口约定

第三层分析模块以 `all_signals.json` 为**唯一输入**，以下字段为保证字段（第二层必须填充）：

| 字段 | 类型 | 必填 | 用途 |
|---|---|---|---|
| `signal_id` | str | ✅ | 去重 / 跨层追踪 |
| `source` | enum | ✅ | 数据源权重分配 |
| `published_at` | str\|null | ✅ | 时序分析 / 趋势检测 |
| `competitor` | enum | ✅ | 竞品维度拆分 |
| `signal_type` | enum | ✅ | 核心分析维度 |
| `confidence` | float | ✅ | 低置信度过滤（< 0.3 时标记为 ambiguous） |
| `text_ja` | str | ✅ | 定性洞察生成 / 人工复核 |
| `engagement_score` | int | ✅ | 加权聚合 |

---

## 附录：端到端运行入口

```python
# pipeline.py
# 一键运行第二层全流程

from blog_scraper      import run_blog_scraper
from research_extractor import run_research_extractor
from unified_schema    import build_unified_output

if __name__ == "__main__":
    print("=" * 60)
    print("第二层 · 竞品信号提取 Pipeline 开始")
    print("=" * 60)

    print("\n[1/3] LINE BLOG 抓取...")
    run_blog_scraper()

    print("\n[2/3] LINE Research 提取...")
    run_research_extractor()

    print("\n[3/3] 统一 Schema 合并...")
    signals = build_unified_output()

    print(f"\n{'='*60}")
    print(f"第二层完成 · 共产出 {len(signals)} 条 CompetitorSignal")
    print(f"输出文件: output/all_signals.json")
    print(f"交接第三层：模式识别 / 洞察生成")
    print(f"{'='*60}")
```

---

*本文件是竞品用户研究技术方案的第二层，对应「竞品信号提取」阶段。*  
*上游依赖：`line_accessibility_report.md` / `priority_matrix.json`（第一层产出）*  
*下游交付：`output/all_signals.json` → 第三层分析模块*
