# Pixel Herbarium — LINE プラットフォーム データ収集・分析 技術方案

> **スコープ：** 元方案 PART 3「LINE プラットフォーム専用検索方案」の実装レベル技術仕様  
> **バージョン：** v1.0｜2026-03-14  
> **前提ドキュメント：** `pixel-herbarium-japan-research-plan.md`

---

## 技術アーキテクチャ概観

LINE プラットフォームは公開 API を持たないため、データ収集は **3 つの技術レイヤー** に分かれる。

```
┌─────────────────────────────────────────────────────────────┐
│  Layer A：間接収集（スクレイピング・手動観察）               │
│  対象：LINE BLOG / LINE Creators Market / Applion           │
├─────────────────────────────────────────────────────────────┤
│  Layer B：公式レポート取得（PDF ダウンロード + 構造化）     │
│  対象：LINE Research 公式ブログ・LINEヤフー Business サイト │
├─────────────────────────────────────────────────────────────┤
│  Layer C：一次調査（LINE Research Platform 委託）           │
│  対象：植物アプリ利用者 / 花見シーン行動 の定量調査         │
└─────────────────────────────────────────────────────────────┘
         ↓ 全レイヤーのアウトプットを統合
┌─────────────────────────────────────────────────────────────┐
│  分析パイプライン：MeCab + 感情分析 + クロス集計            │
└─────────────────────────────────────────────────────────────┘
```

---

## モジュール 1｜App Store / Google Play レビュー収集

LINE シェア機能を評価する前提として、競合アプリ（GreenSnap / PictureThis JP）の日本語レビューを定量的に収集する。

### 1-1 ツールチェーン

```
App Store（JP）    → app-store-scraper（Python）
Google Play（JP） → google-play-scraper（Python）
集約               → pandas DataFrame → CSV/Parquet
```

### 1-2 実装コード（App Store — JP リージョン）

```python
# pip install app-store-scraper pandas
from app_store_scraper import AppStore
import pandas as pd, json

# 競合アプリ設定（JP App Store のアプリ ID は URL から取得）
TARGETS = [
    {"name": "GreenSnap",   "app_id": "912031081"},
    {"name": "PictureThis", "app_id": "1252497129"},
]

results = []
for t in TARGETS:
    app = AppStore(country="jp", app_name=t["name"], app_id=t["app_id"])
    app.review(how_many=500)   # JP ストアは最大 500 件まで取得可
    for r in app.reviews:
        results.append({
            "source":    "AppStore_JP",
            "app":       t["name"],
            "score":     r["rating"],
            "title":     r.get("title", ""),
            "body":      r["review"],
            "date":      r["date"],
            "version":   r.get("appVersion", ""),
        })

df = pd.DataFrame(results)
df.to_csv("data/appstore_jp_reviews.csv", index=False, encoding="utf-8-sig")
print(f"収集件数: {len(df)}")
```

> **制限事項：** Apple の非公式 RSS エンドポイント経由のため最大 500 件。2024年以降のレビューのみを対象にする場合は `df[df["date"] >= "2024-01-01"]` でフィルタ。

### 1-3 実装コード（Google Play — JP）

```python
# pip install google-play-scraper
from google_play_scraper import reviews, Sort
import pandas as pd

TARGETS_GP = [
    {"name": "GreenSnap",   "pkg": "jp.co.greensnap.greensnap"},
    {"name": "PictureThis", "pkg": "com.glority.picturethis"},
]

results_gp = []
for t in TARGETS_GP:
    result, _ = reviews(
        t["pkg"],
        lang="ja",
        country="jp",
        sort=Sort.NEWEST,
        count=1000,
        filter_score_with=None,   # 全星評価を収集
    )
    for r in result:
        results_gp.append({
            "source":  "GooglePlay_JP",
            "app":     t["name"],
            "score":   r["score"],
            "title":   r.get("title", ""),
            "body":    r["content"],
            "date":    r["at"],
            "thumbs":  r["thumbsUpCount"],
        })

df_gp = pd.DataFrame(results_gp)
df_gp.to_csv("data/googleplay_jp_reviews.csv", index=False, encoding="utf-8-sig")
```

### 1-4 Applion からの補完収集（Web スクレイピング）

Applion（https://applion.jp）は Apple の公式 RSS に載らない古いレビューも集約している。

```python
import requests
from bs4 import BeautifulSoup
import time, csv

BASE_URL = "https://applion.jp/iphone/app/{app_id}/?order=new&page={page}"
APP_IDS = {
    "GreenSnap":   "912031081",
    "PictureThis": "1252497129",
}

def scrape_applion(app_id, app_name, max_pages=10):
    rows = []
    for page in range(1, max_pages + 1):
        url = BASE_URL.format(app_id=app_id, page=page)
        res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(res.text, "html.parser")
        items = soup.select(".reviewBlock")
        if not items:
            break
        for item in items:
            rows.append({
                "app":   app_name,
                "score": item.select_one(".star")["class"][-1],  # star5 等
                "title": item.select_one(".reviewTitle").get_text(strip=True),
                "body":  item.select_one(".reviewText").get_text(strip=True),
                "date":  item.select_one(".reviewDate").get_text(strip=True),
            })
        time.sleep(2)   # 過負荷回避
    return rows
```

> **倫理メモ：** robots.txt を遵守し、リクエスト間隔は 2 秒以上を維持すること。

---

## モジュール 2｜LINE BLOG テキスト収集

### 2-1 収集フロー

```
1. https://lineblog.me/search?q={keyword} にアクセス
2. 検索結果ページから記事 URL リストを収集
3. 各記事の本文・日付・いいね数を取得
4. キーワード × 記事の対応関係をメタデータとして保存
```

### 2-2 実装コード

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd, time

KEYWORDS = [
    "花 アプリ 調べた",
    "植物 名前 アプリ",
    "お花見 スマホ 撮影",
    "コレクション 達成感",
    "写真 LINEで送った",
    "アプリ 課金 した",
    "桜 毎年 楽しみ",
]

SEARCH_URL = "https://lineblog.me/search"

def fetch_lineblog(keyword, max_pages=5):
    articles = []
    for page in range(1, max_pages + 1):
        params = {"q": keyword, "page": page}
        res = requests.get(SEARCH_URL, params=params,
                           headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(res.text, "html.parser")
        items = soup.select(".c-blog-item")
        if not items:
            break
        for item in items:
            link_tag = item.select_one("a.c-blog-item__link")
            if not link_tag:
                continue
            url = link_tag["href"]
            title = link_tag.get_text(strip=True)
            # 本文取得
            art = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
            art_soup = BeautifulSoup(art.text, "html.parser")
            body_tag = art_soup.select_one(".article-body-inner")
            body = body_tag.get_text("\n", strip=True) if body_tag else ""
            date_tag = art_soup.select_one("time")
            date = date_tag["datetime"] if date_tag else ""
            articles.append({
                "keyword": keyword,
                "title":   title,
                "url":     url,
                "date":    date,
                "body":    body,
            })
            time.sleep(1.5)
        time.sleep(2)
    return articles

all_articles = []
for kw in KEYWORDS:
    all_articles.extend(fetch_lineblog(kw))

df_blog = pd.DataFrame(all_articles)
df_blog.to_csv("data/lineblog_articles.csv", index=False, encoding="utf-8-sig")
print(f"記事数: {len(df_blog)}")
```

### 2-3 行動連鎖パターンの抽出

LINE BLOG 収集後、以下の正規表現で「行動連鎖」を検出する。

```python
import re

# [トリガー] → [アプリ使用] → [結果] → [シェア] パターンを検出
TRIGGER_PATTERNS = [
    r"(見つけた|気になった|変な花|知らない花|何の花)",
    r"(アプリで調べ|名前を調べ|検索した|識別した)",
    r"(だった！|合ってた|違ってた|かわいい|びっくり)",
    r"(LINEで送った|グループに投稿|インスタに|シェアした)",
]

def detect_behavior_chain(text):
    """行動連鎖の有無と段階数を返す"""
    matched_stages = 0
    for pattern in TRIGGER_PATTERNS:
        if re.search(pattern, text):
            matched_stages += 1
    return matched_stages

df_blog["chain_score"] = df_blog["body"].apply(detect_behavior_chain)
# chain_score >= 3 を完全な行動連鎖記事として優先分析
high_value = df_blog[df_blog["chain_score"] >= 3]
print(f"高価値記事数: {len(high_value)}")
```

---

## モジュール 3｜LINE OpenChat サイレント観察ログ

LINE OpenChat は自動スクレイピングが技術的・規約的に不可能なため、**構造化された手動ログ** として管理する。

### 3-1 観察ログスキーマ（YAML 定義）

```yaml
# docs/market-research/openchat-observation-log.yaml
observations:
  - group_name: "草花・野草好きの集い"
    member_count: 2340
    joined_date: "2026-03-15"
    observation_window_days: 28
    entries:
      - date: "2026-03-16"
        message_count_approx: 45
        signals:
          location_tag_attached: false    # 位置情報付き画像投稿の有無
          where_question_asked: true      # 「どこで撮ったの？」質問の有無
          app_screenshot_shared: true     # アプリスクショのシェア有無
          pain_keywords_found:
            - "名前わかる？"
            - "アプリ教えて"
          positive_keywords_found:
            - "かわいい"
            - "きれい"
        top_plant_names_mentioned:
          - "カタクリ"
          - "菜の花"
          - "桜"
        notes: "GreenSnapのスクショを貼ってアプリ名を共有する行動を確認"
```

### 3-2 集計スクリプト（YAML → DataFrame）

```python
import yaml, pandas as pd
from pathlib import Path

logs = []
for f in Path("docs/market-research/openchat").glob("*.yaml"):
    with open(f) as fh:
        data = yaml.safe_load(fh)
    for obs in data.get("observations", []):
        for entry in obs.get("entries", []):
            logs.append({
                "group":          obs["group_name"],
                "members":        obs["member_count"],
                "date":           entry["date"],
                "location_tag":   entry["signals"]["location_tag_attached"],
                "where_asked":    entry["signals"]["where_question_asked"],
                "app_screenshot": entry["signals"]["app_screenshot_shared"],
                "pain_count":     len(entry["signals"].get("pain_keywords_found", [])),
                "positive_count": len(entry["signals"].get("positive_keywords_found", [])),
            })

df_oc = pd.DataFrame(logs)
# 位置情報付き投稿率
location_rate = df_oc["location_tag"].mean()
print(f"位置情報タグ添付率: {location_rate:.1%}")
```

### 3-3 観察グループ優先度マトリクス

| グループタイプ | 想定メンバー規模 | 優先度 | 観察開始時期 |
|--------------|--------------|-------|------------|
| 「花好き」「草花好き」系 | 500〜5,000 名 | ★★★ | Week 1 即時 |
| 「お花見 2026」「桜スポット」 | 1,000〜10,000 名 | ★★★ | Week 1 即時 |
| 「スマホ写真部」「カメラ好き」 | 200〜2,000 名 | ★★☆ | Week 1 |
| 「アプリ好き・紹介」系 | 100〜1,000 名 | ★★☆ | Week 1 |
| 地域名 +「散歩」系 | 50〜500 名 | ★☆☆ | Week 2 |

---

## モジュール 4｜LINE Research 公式レポート取得

### 4-1 無料レポートの系統的ダウンロード

```python
# LINE Research 公式ブログからレポートリンクを収集
import requests
from bs4 import BeautifulSoup
import urllib.request, os

BLOG_URL = "https://lineresearch-platform.blog.jp/"

def collect_report_links(base_url):
    """PDF / ダウンロードリンクを収集"""
    res = requests.get(base_url)
    soup = BeautifulSoup(res.text, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if ".pdf" in href or "download" in href.lower():
            links.append({"text": a.get_text(strip=True), "url": href})
    return links

# キーワード別検索 URL
SEARCH_KEYWORDS = [
    "アプリ 利用時間",
    "写真 シェア 行動",
    "課金 意識",
    "位置情報 プライバシー",
    "SNS 利用動向 20代 女性",
    "春 行動変容",
]
```

### 4-2 PDF からテキスト抽出

```python
# pip install pdfplumber
import pdfplumber, json

def extract_pdf_data(pdf_path):
    """PDF から数値データ・表を抽出"""
    results = {"text": [], "tables": []}
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                results["text"].append(text)
            tables = page.extract_tables()
            results["tables"].extend(tables)
    return results

# 抽出したデータから Pixel Herbarium 関連指標を検索
TARGET_METRICS = [
    "写真.*シェア.*頻度",
    "アプリ.*月額.*課金",
    "位置情報.*許可",
    "20代.*女性.*アプリ",
    "花見.*記録",
]

import re
def find_target_data(text_list, patterns):
    findings = []
    for text in text_list:
        for pattern in patterns:
            matches = re.findall(f".{{0,50}}{pattern}.{{0,50}}", text)
            findings.extend(matches)
    return findings
```

### 4-3 取得優先レポートリスト

```
検索キーワード → 期待データポイント
────────────────────────────────────────────────────────────
「スマートフォン アプリ 利用実態」 → 日次起動回数・1回あたり使用時間ベンチマーク
「SNS 写真 シェア 行動調査」      → LINE/Instagram 別シェア頻度・動機
「アプリ課金 意識調査」           → 月額許容額分布・IAP 経験率
「位置情報 プライバシー 意識」     → 位置共有への抵抗感の年代分布
「花見 行動 調査」                → 花見中のスマホ使用シーン・写真記録率
「20代 30代 女性 アプリ 利用」    → コアターゲット属性の行動ベンチマーク
```

---

## モジュール 5｜LINE Research Platform 一次調査設計

予算に余裕がある場合、LINE Research Platform の「Quick アンケート」を利用して **Pixel Herbarium 向けの一次定量調査** を実施する。

### 5-1 調査仕様

```yaml
survey_spec:
  platform: "LINE Research Platform（Quick アンケート）"
  target:
    age: "20〜35歳"
    gender: "女性"
    condition: "直近3ヶ月以内に植物・自然・散歩関連アプリを使用したことがある"
  sample_size: 300
  estimated_cost: "約15〜20万円（300サンプル想定）"
  collection_period: "3〜5営業日"
```

### 5-2 設問設計テンプレート

```markdown
## Pixel Herbarium 向け LINE Research 設問案

### Q1 [単一選択] 植物・花の写真を撮ったあと、まずどうしますか？
1. アプリで名前を調べる
2. Google で画像検索する
3. 友人・家族に聞く
4. そのままにしておく

### Q2 [複数選択] 写真をシェアする場合、どこに投稿しますか？
1. LINE（個人トーク）
2. LINE（グループトーク）
3. Instagram
4. X（旧 Twitter）
5. シェアしない

### Q3 [単一選択] 位置情報の共有について、どの範囲なら許容できますか？
1. 正確な住所まで公開 OK
2. 最寄り駅・地区名まで OK
3. 市区町村レベルまで OK
4. 位置情報は一切共有したくない

### Q4 [単一選択] 植物図鑑アプリの月額料金として支払える上限はいくらですか？
1. 無料でなければ使わない
2. 250円まで
3. 480円まで
4. 980円まで
5. 1,500円以上でも OK

### Q5 [自由回答] 植物・自然系アプリを使っていて「ここが不満」と感じた点を教えてください。
```

### 5-3 分析後のデータ出力形式

LINE Research からダウンロードできる CSV を以下の形式で正規化する。

```python
import pandas as pd

df_survey = pd.read_csv("data/line_research_result.csv", encoding="utf-8-sig")

# クロス集計：位置情報許容度 × 年代
cross_location = pd.crosstab(
    df_survey["Q3_location_tolerance"],
    df_survey["age_group"],
    normalize="columns"
)

# 月額許容額の分布
price_dist = df_survey["Q4_price_cap"].value_counts(normalize=True)

# 自由回答のキーワード頻度（→ モジュール 6 の NLP パイプラインに渡す）
open_answers = df_survey["Q5_pain_points"].dropna().tolist()
```

---

## モジュール 6｜LINE 公式アカウント 競合観察ログ

### 6-1 観察スキーマ（JSON Lines 形式）

競合の LINE 公式アカウント（GreenSnap / PictureThis）を 4 週間フォローし、配信内容を記録する。

```jsonl
{"account": "GreenSnap", "date": "2026-03-15", "time": "20:00", "type": "image+text", "cta": "アプリを開く", "seasonal": false, "ugc_campaign": false, "notes": "春の植物コレクション紹介"}
{"account": "GreenSnap", "date": "2026-03-22", "time": "12:00", "type": "text_only", "cta": "今すぐ撮影", "seasonal": true, "ugc_campaign": true, "notes": "桜チャレンジキャンペーン開始。写真投稿を募集"}
```

### 6-2 集計分析

```python
import pandas as pd

df_oa = pd.read_json("data/official_account_log.jsonl", lines=True)

# 配信時間帯分布
df_oa["hour"] = pd.to_datetime(df_oa["time"], format="%H:%M").dt.hour
hour_dist = df_oa.groupby("account")["hour"].value_counts()

# CTA 文言の頻度
cta_freq = df_oa.groupby(["account", "cta"]).size().reset_index(name="count")

# 季節コンテンツの比率
seasonal_rate = df_oa.groupby("account")["seasonal"].mean()

print("最多 CTA 文言:")
print(cta_freq.sort_values("count", ascending=False).head(10))
print("\n季節コンテンツ比率:")
print(seasonal_rate)
```

---

## モジュール 7｜LINE Creators Market データ収集

### 7-1 検索 URL とデータ取得

```
https://creator.line.me/ja/search/?q={keyword}&type=sticker
```

取得対象データポイント：
- スタンプタイトル・制作者名
- 販売数インジケーター（ランキング順位）
- 主要カラー（視覚的スキャン）
- スタンプスタイル分類（ピクセル / イラスト / 写真風）

### 7-2 手動集計テンプレート

```csv
rank,title,creator,style,main_colors,plant_theme,pixel_style,seasonal
1,ゆるい草花スタンプ,hanako_art,illustration,"green,pink,yellow",true,false,false
2,ドット絵の花シリーズ,pixel_creator,pixel,"pastel,white,green",true,true,false
3,お花見スタンプ2025,spring_sticker,illustration,"pink,brown,cream",true,false,true
```

### 7-3 植物・ピクセル系スタンプの美学指標

| 指標 | 収集方法 | Pixel Herbarium への示唆 |
|------|---------|------------------------|
| 売上 Top20 の配色 | 主要色を RGB 値で記録 | Adult Kawaii カラーパレットの補正 |
| ピクセル風スタンプのランキング位置 | 順位帯を観察 | ピクセル美学の市場受容度 |
| 植物テーマのフォント種類 | 丸体 / 手書き / ゴシック | Maru-Gothic 選択の妥当性検証 |
| 季節限定スタンプの発売タイミング | 発売日を記録 | 花まつりイベントのローンチ窓 |

---

## モジュール 8｜日本語 NLP 分析パイプライン

全収集テキスト（App Store レビュー・LINE BLOG・OpenChat ログ・LINE Research 自由回答）を統一パイプラインで分析する。

### 8-1 環境セットアップ

```bash
# MeCab のインストール（macOS）
brew install mecab mecab-ipadic

# Python パッケージ
pip install mecab-python3 unidic-lite pandas matplotlib wordcloud
pip install transformers torch  # 感情分析（BERT 系）
```

### 8-2 形態素解析・頻出語抽出

```python
import MeCab
import pandas as pd
from collections import Counter

tagger = MeCab.Tagger()

def tokenize_japanese(text, pos_filter=None):
    """
    日本語テキストを形態素解析し、指定品詞のトークンリストを返す
    pos_filter: ["名詞", "動詞", "形容詞"] 等
    """
    node = tagger.parseToNode(text)
    tokens = []
    while node:
        feature = node.feature.split(",")
        pos = feature[0]
        if pos_filter is None or pos in pos_filter:
            surface = node.surface
            if len(surface) > 1:  # 1文字は除外
                tokens.append(surface)
        node = node.next
    return tokens

def extract_top_keywords(texts, top_n=50, pos_filter=["名詞", "形容詞"]):
    counter = Counter()
    for text in texts:
        tokens = tokenize_japanese(str(text), pos_filter)
        counter.update(tokens)
    # ストップワード除外
    STOPWORDS = {"こと", "もの", "ため", "これ", "それ", "あれ", "さん",
                 "ない", "する", "いる", "ある", "なる", "いう", "よう"}
    for sw in STOPWORDS:
        counter.pop(sw, None)
    return counter.most_common(top_n)

# 競合レビュー分析
df_reviews = pd.read_csv("data/appstore_jp_reviews.csv")
pain_reviews = df_reviews[df_reviews["score"] <= 2]["body"].tolist()
positive_reviews = df_reviews[df_reviews["score"] >= 4]["body"].tolist()

print("=== 低評価レビューの頻出語（痛点シグナル）===")
for word, freq in extract_top_keywords(pain_reviews):
    print(f"  {word}: {freq}")

print("\n=== 高評価レビューの頻出語（リテンションフック）===")
for word, freq in extract_top_keywords(positive_reviews):
    print(f"  {word}: {freq}")
```

### 8-3 感情分析（BERT 系モデル）

```python
from transformers import pipeline

# 日本語感情分析モデル（Hugging Face）
# 軽量版: koheiduck/bert-japanese-finetuned-sentiment
sentiment = pipeline(
    "sentiment-analysis",
    model="koheiduck/bert-japanese-finetuned-sentiment"
)

def analyze_sentiment_batch(texts, batch_size=32):
    results = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        outputs = sentiment(batch, truncation=True, max_length=512)
        results.extend(outputs)
    return results

df_reviews["sentiment"] = [
    r["label"] for r in analyze_sentiment_batch(df_reviews["body"].tolist())
]
df_reviews["sentiment_score"] = [
    r["score"] for r in analyze_sentiment_batch(df_reviews["body"].tolist())
]

# アプリ別・感情別の集計
sentiment_summary = df_reviews.groupby(["app", "sentiment"]).size().unstack(fill_value=0)
print(sentiment_summary)
```

### 8-4 Pixel Herbarium 特定テーマのキーワード分類

```python
# プロジェクト調査軸に対応するキーワード辞書
THEME_KEYWORDS = {
    "位置情報プライバシー":  ["位置情報", "GPS", "位置バレ", "場所", "現在地", "怖い"],
    "課金抵抗":            ["高い", "課金", "月額", "無料", "サブスク", "解約", "払えない"],
    "コレクション動機":     ["コンプリート", "集め", "達成感", "コレクション", "図鑑", "全部"],
    "シェア行動":          ["LINEで送", "インスタ", "シェア", "友達", "グループ", "投稿"],
    "UI痛点":             ["重い", "落ちる", "使いにくい", "わかりにくい", "邪魔", "通知"],
    "継続利用フック":       ["毎日", "習慣", "続けて", "いつも", "ルーティン", "お気に入り"],
}

def classify_by_theme(text, theme_dict):
    matched = []
    for theme, keywords in theme_dict.items():
        for kw in keywords:
            if kw in text:
                matched.append(theme)
                break
    return matched if matched else ["未分類"]

df_blog = pd.read_csv("data/lineblog_articles.csv")
df_blog["themes"] = df_blog["body"].apply(
    lambda t: classify_by_theme(str(t), THEME_KEYWORDS)
)

# テーマ別記事数
from collections import Counter
theme_counter = Counter()
for themes in df_blog["themes"]:
    theme_counter.update(themes)
print("LINE BLOG テーマ別記事数:", theme_counter.most_common())
```

---

## モジュール 9｜クロスプラットフォーム統合分析

### 9-1 シグナルクロス検証マトリクス

元方案のクロス検証テーブルを**コード化**する。

```python
# LINE OpenChat で発見したシグナルを他プラットフォームで検証するマッピング
CROSS_VALIDATION_MAP = {
    "位置バレが嫌": {
        "note_com_query":    "位置情報 アプリ 怖い",
        "appstore_filter":   lambda df: df[df["body"].str.contains("位置情報|GPS|場所バレ")],
        "line_research_q":   "Q3_location_tolerance",
        "expected_finding":  "拒否率 > 40%"
    },
    "課金したくない": {
        "sensor_tower_check": "競合アプリの IAP 転換率",
        "appstore_filter":    lambda df: df[df["body"].str.contains("高い|課金|月額|サブスク")],
        "line_research_q":    "Q4_price_cap",
        "expected_finding":   "月額480円超の拒否率 > 50%"
    },
    "毎日使ってる": {
        "app_ape_check":     "同類アプリの日均起動数",
        "appstore_filter":   lambda df: df[(df["body"].str.contains("毎日|習慣")) & (df["score"] >= 4)],
        "expected_finding":  "高評価レビューの30%以上に習慣化言及"
    },
    "桜の時期だけ使う": {
        "app_ape_check":     "3〜5月の MAU 変動係数",
        "appstore_filter":   lambda df: df[df["body"].str.contains("桜|花見|春")],
        "expected_finding":  "季節キーワード含有レビューの月別分布でQ1-Q2ピーク"
    },
}

def run_cross_validation(signal_name, df_reviews, df_survey, df_blog):
    mapping = CROSS_VALIDATION_MAP[signal_name]
    results = {}
    if "appstore_filter" in mapping:
        filtered = mapping["appstore_filter"](df_reviews)
        results["appstore_hit_rate"] = len(filtered) / len(df_reviews)
    # ... 他プラットフォームの結果も統合
    return results
```

### 9-2 最終アウトプット生成スクリプト

```python
def generate_insight_report(df_reviews, df_blog, df_survey, df_oc):
    """全データソースを統合したインサイトレポートを生成"""
    report = {}

    # 1. 位置情報プライバシー
    location_concern_rate = df_reviews["body"].str.contains(
        "位置情報|GPS|場所バレ"
    ).mean()
    report["location_privacy_concern"] = {
        "appstore_mention_rate": f"{location_concern_rate:.1%}",
        "lineblog_articles": len(df_blog[df_blog["themes"].apply(
            lambda t: "位置情報プライバシー" in t)]),
        "survey_rejection_rate": df_survey[
            df_survey["Q3_location_tolerance"] == "一切共有したくない"
        ]["Q3_location_tolerance"].count() / len(df_survey)
        if df_survey is not None else "未実施",
    }

    # 2. 月額課金許容度
    price_dist = df_survey["Q4_price_cap"].value_counts(normalize=True) \
        if df_survey is not None else "未実施"
    report["price_tolerance"] = {
        "survey_distribution": price_dist,
        "negative_review_mention": df_reviews["body"].str.contains(
            "高い|月額|サブスク|課金").mean(),
    }

    return report
```

---

## 実行スケジュール（技術実装版）

```
Week 1｜データ収集インフラ構築
├── Day 1-2:  Python 環境構築・app-store-scraper / google-play-scraper インストール
├── Day 3:    競合 2 アプリのレビュー収集実行（AppStore + GooglePlay）
├── Day 4:    LINE OpenChat 5 グループ参加・観察ログ YAML テンプレート準備
└── Day 5-7:  LINE Research 無料レポート PDF 全件収集・pdfplumber でテキスト化

Week 2｜定量データ収集
├── Day 8-10: LINE BLOG スクレイパー実装・キーワード 7 本で記事収集
├── Day 11:   LINE Research Platform Quick アンケート設計・申込（承認待ち）
└── Day 12-14: LINE 公式アカウント（GreenSnap/PictureThis）フォロー・配信ログ記録開始

Week 3｜NLP 分析パイプライン稼働
├── Day 15-17: MeCab / BERT 環境構築・形態素解析パイプライン実装・テスト
├── Day 18-20: 全テキストデータに感情分析 + テーマ分類を適用
└── Day 21:   LINE Creators Market トップ 20 スタンプの手動記録・CSV 化

Week 4｜統合・レポート生成
├── Day 22-24: クロス検証マトリクス実行・矛盾点のフラグ化
├── Day 25-26: LINE Research アンケート結果受領・DataFrame 統合
└── Day 27-28: generate_insight_report() 実行 → japan-user-insights.md 出力
                                              → line-insights.md 出力
```

---

## ディレクトリ構造

```
docs/market-research/
├── data/
│   ├── appstore_jp_reviews.csv         # App Store JP レビュー（競合2アプリ）
│   ├── googleplay_jp_reviews.csv       # Google Play JP レビュー
│   ├── lineblog_articles.csv           # LINE BLOG 収集記事
│   ├── line_research_result.csv        # LINE Research アンケート結果
│   └── official_account_log.jsonl      # LINE 公式アカウント観察ログ
├── openchat/
│   ├── group_hanazuki.yaml             # OpenChat 観察ログ（グループ別）
│   └── group_ohanami2026.yaml
├── reports/
│   └── line_research_pdfs/            # 公式レポート PDF 格納
├── analysis/
│   ├── keyword_frequency.csv          # 頻出語分析結果
│   ├── sentiment_summary.csv          # 感情分析集計
│   └── cross_validation_results.json  # クロス検証結果
├── japan-user-insights.md             # 最終統合レポート
└── line-insights.md                   # LINE 専用インサイトレポート
```

---

## 制約事項・リスク管理

| リスク | 対応策 |
|--------|-------|
| LINE BLOG の robots.txt 変更 | 収集前に毎回 `/robots.txt` を確認。禁止の場合は手動収集に切替 |
| App Store RSS の仕様変更 | 収集失敗時は Applion の手動記録で補完 |
| LINE Research アンケートの審査通過 | 「アプリのインストール誘導」に見えないよう設問文を中立的に設計 |
| OpenChat の公開チャット終了 | 観察期間中のスクリーンショットをローカルに保存（個人情報は除去） |
| BERT モデルの日本語精度 | 低信頼スコア（< 0.7）の予測はラベルを "不確定" として別管理 |

---

*本技術方案は `pixel-herbarium-japan-research-plan.md` の PART 3 実装仕様。収集データは `docs/market-research/competitive-analysis.md (v1.2)` と統合管理すること。*
