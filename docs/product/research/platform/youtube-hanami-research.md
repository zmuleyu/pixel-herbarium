# YouTube 用户评论挖掘指南
## 面向出海日本「赏花 App」的用户洞察研究

> **研究背景**：以《织梦森林》"种植+创作+社交"模型为参照，通过系统采集 YouTube 日本赏花相关视频评论，提炼出海产品的用户需求与情感图谱。

---

## 一、检索策略：找到高价值视频池

### 1.1 关键词矩阵

YouTube 评论质量与视频类型高度相关。建议按以下三个维度构建关键词池：

#### 🌸 核心主题词（日语）

| 类型 | 关键词 | 说明 |
|------|--------|------|
| 赏花场景 | `花見 2024` / `お花見スポット` | 高评论量，含地点推荐讨论 |
| 开花预测 | `桜の開花予想` / `満開情報` | 季节性强，含焦虑/期待情绪 |
| 品种鑑赏 | `桜の種類` / `ソメイヨシノ以外` | 植物知识型，评论质量高 |
| App 相关 | `桜アプリ` / `花の記録アプリ` | 直接竞品用户反馈 |
| 拍照打卡 | `桜フォトスポット` / `インスタ映え桜` | 含分享动机讨论 |
| 梅花/紫藤 | `梅まつり` / `藤の花スポット` | 延伸花卉，扩大用户圈 |

#### 🌸 英语检索词（在日外国人视角）

```
cherry blossom Japan 2024
hanami Japan tips
cherry blossom app Japan
sakura spots Tokyo/Kyoto/Osaka
cherry blossom forecast Japan
```

#### 🌸 中文检索词（中国赴日游客）

```
日本赏樱攻略
日本樱花开放时间
东京赏樱打卡
```

---

### 1.2 视频筛选标准

| 筛选维度 | 推荐标准 | 原因 |
|----------|----------|------|
| 发布时间 | 近 2 年（2023–2025） | 反映当前用户心智 |
| 播放量 | ≥ 5 万次 | 评论样本量充足 |
| 评论数 | ≥ 200 条 | 保证分析有效性 |
| 视频类型 | Vlog、攻略、预测解说 | 情感表达丰富 |
| 语言 | 日语优先，英语补充 | 匹配目标市场 |

#### 推荐目标频道类型

- **旅行 Vlog 类**：评论含真实花见体验与情感表达
- **园艺/植物知识类**：评论含深度植物爱好者需求
- **气象/预测解说类**：评论含"开花焦虑""等待感"等情绪
- **摄影教程类**：评论含拍照工具与分享动机

---

## 二、数据采集方案

### 2.1 方案 A：YouTube Data API v3（推荐）

**适用场景**：需要批量采集、结构化存储、持续追踪。

#### 前置准备

1. 前往 [Google Cloud Console](https://console.cloud.google.com/) 创建项目
2. 启用 **YouTube Data API v3**
3. 创建 API Key（免费配额：每日 10,000 单位）

#### 核心 API 端点

```
# Step 1：搜索视频
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &q=花見 おすすめスポット
  &type=video
  &maxResults=50
  &relevanceLanguage=ja
  &key={YOUR_API_KEY}

# Step 2：获取视频详情（播放量、评论数）
GET https://www.googleapis.com/youtube/v3/videos
  ?part=statistics,snippet
  &id={VIDEO_ID_LIST}
  &key={YOUR_API_KEY}

# Step 3：采集评论
GET https://www.googleapis.com/youtube/v3/commentThreads
  ?part=snippet,replies
  &videoId={VIDEO_ID}
  &maxResults=100
  &order=relevance
  &key={YOUR_API_KEY}
```

#### Python 采集脚本（可直接使用）

```python
import requests
import pandas as pd
import time
import json

API_KEY = "YOUR_API_KEY"

def search_videos(query, max_results=20, language="ja"):
    """搜索相关视频"""
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "relevanceLanguage": language,
        "key": API_KEY
    }
    r = requests.get(url, params=params)
    items = r.json().get("items", [])
    return [item["id"]["videoId"] for item in items]


def get_comments(video_id, max_pages=5):
    """采集单个视频评论（支持翻页）"""
    url = "https://www.googleapis.com/youtube/v3/commentThreads"
    comments = []
    next_page_token = None
    page = 0

    while page < max_pages:
        params = {
            "part": "snippet",
            "videoId": video_id,
            "maxResults": 100,
            "order": "relevance",
            "key": API_KEY
        }
        if next_page_token:
            params["pageToken"] = next_page_token

        r = requests.get(url, params=params)
        data = r.json()

        for item in data.get("items", []):
            top = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "video_id": video_id,
                "author": top["authorDisplayName"],
                "text": top["textDisplay"],
                "likes": top["likeCount"],
                "published_at": top["publishedAt"],
                "reply_count": item["snippet"]["totalReplyCount"]
            })

        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break
        page += 1
        time.sleep(0.5)  # 避免频率限制

    return comments


def batch_collect(queries, output_file="hanami_comments.csv"):
    """批量采集并保存"""
    all_comments = []

    for query in queries:
        print(f"搜索: {query}")
        video_ids = search_videos(query, max_results=10)

        for vid in video_ids:
            print(f"  采集视频: {vid}")
            comments = get_comments(vid, max_pages=3)
            all_comments.extend(comments)
            time.sleep(1)

    df = pd.DataFrame(all_comments)
    df.drop_duplicates(subset=["video_id", "text"], inplace=True)
    df.to_csv(output_file, index=False, encoding="utf-8-sig")
    print(f"完成！共采集 {len(df)} 条评论，已保存至 {output_file}")
    return df


# 执行采集
queries = [
    "花見 おすすめスポット 2024",
    "桜 開花予想",
    "お花見 持ち物",
    "桜アプリ おすすめ",
    "cherry blossom Japan tips"
]

df = batch_collect(queries)
```

#### API 配额说明

| 操作 | 消耗单位 | 每日免费上限 |
|------|----------|-------------|
| search.list | 100 单位/次 | 100 次搜索 |
| commentThreads.list | 1 单位/次 | 10,000 次翻页 |
| videos.list | 1 单位/次 | 10,000 次 |

> 💡 **建议**：优先用 search 找到高质量视频 ID，再集中采集这些视频的评论，节省配额。

---

### 2.2 方案 B：yt-dlp 轻量抓取（无需 API Key）

**适用场景**：快速原型验证，小批量采集。

```bash
# 安装
pip install yt-dlp

# 提取单个视频评论（JSON 格式）
yt-dlp --skip-download --write-comments \
       --output "%(id)s" \
       "https://www.youtube.com/watch?v=VIDEO_ID"

# 批量处理视频列表
yt-dlp --skip-download --write-comments \
       --batch-file video_ids.txt \
       --output "data/%(id)s"
```

> ⚠️ **注意**：yt-dlp 不属于官方 API，使用时注意 YouTube 服务条款限制，建议仅用于研究目的，限制抓取频率。

---

### 2.3 方案对比

| 维度 | YouTube Data API | yt-dlp |
|------|-----------------|--------|
| 稳定性 | ✅ 高 | ⚠️ 依赖逆向工程 |
| 数据完整性 | ✅ 结构化 JSON | ⚠️ 部分字段不全 |
| 配额限制 | 每日 10,000 单位 | 无硬性限制 |
| 上手难度 | 需要 Google 账号 | 零配置 |
| 合规性 | ✅ 官方支持 | ⚠️ 灰色地带 |
| **推荐场景** | **正式研究、持续追踪** | **快速验证** |

---

## 三、数据清洗与预处理

### 3.1 清洗流程

```python
import re
import pandas as pd

def clean_comments(df):
    """评论数据清洗"""

    # 1. 去除 HTML 标签（YouTube 评论含 <br> 等）
    df["text_clean"] = df["text"].str.replace(r'<[^>]+>', '', regex=True)

    # 2. 去除纯 emoji 评论（信息量低）
    df = df[df["text_clean"].str.len() > 5]

    # 3. 去除广告/垃圾评论（含链接）
    df = df[~df["text_clean"].str.contains(r'http|www\.|\.com', regex=True)]

    # 4. 语言标记（简单判断）
    def detect_lang(text):
        if re.search(r'[ぁ-ん]', text):
            return "ja"
        elif re.search(r'[^\x00-\x7F]', text):
            return "zh_or_other"
        else:
            return "en"

    df["lang"] = df["text_clean"].apply(detect_lang)

    # 5. 按点赞数排序（优先分析高赞评论）
    df = df.sort_values("likes", ascending=False)

    return df

df_clean = clean_comments(df)
print(df_clean["lang"].value_counts())
```

---

## 四、分析框架

### 4.1 主题聚类维度

针对赏花 App 产品研究，建议围绕以下六个主题维度进行编码：

| 维度 | 核心问题 | 示例评论关键词 |
|------|----------|---------------|
| **① 信息需求** | 用户在找什么信息？ | 「いつ満開になる？」「混雑状況」「駐車場」 |
| **② 情感表达** | 什么让他们感动？ | 「毎年来てる」「泣きそう」「また来年も」 |
| **③ 社交动机** | 为什么要分享/拍照？ | 「彼氏と行きたい」「家族で」「SNSに投稿」 |
| **④ 痛点抱怨** | 什么让他们失望？ | 「混みすぎ」「写真スポット人だらけ」「情報古い」 |
| **⑤ 工具需求** | 他们用了什么工具/App？ | 「アプリで確認した」「Google Maps」「天気予報」 |
| **⑥ 仪式感表达** | 有哪些固定行为/传统？ | 「お弁当持参」「夜桜」「一人花見」 |

---

### 4.2 使用 Claude API 进行批量语义分析

以下代码通过 Claude API 对评论进行自动主题分类和情感分析：

```python
import anthropic
import json
import pandas as pd

client = anthropic.Anthropic()

SYSTEM_PROMPT = """你是一名专注于日本市场的产品研究员。
请对用户提供的 YouTube 评论进行分析，返回 JSON 格式结果。

每条评论请输出以下字段：
- sentiment: positive / negative / neutral
- theme: 从[信息需求, 情感共鸣, 社交动机, 痛点抱怨, 工具需求, 仪式感]中选一个
- key_insight: 15字以内的核心洞察（中文）
- app_opportunity: 该评论对赏花App产品设计的启发（可为null）

只返回 JSON 数组，不要其他文字。"""


def analyze_batch(comments_batch):
    """批量分析评论（每次最多20条）"""
    content = "\n".join([f"{i+1}. {c}" for i, c in enumerate(comments_batch)])

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}]
    )

    text = message.content[0].text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # 清理可能的 markdown 格式
        text = text.strip().lstrip("```json").rstrip("```").strip()
        return json.loads(text)


def analyze_all_comments(df, text_col="text_clean", batch_size=20):
    """对所有评论进行批量语义分析"""
    texts = df[text_col].tolist()
    results = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        print(f"分析第 {i+1}–{min(i+batch_size, len(texts))} 条...")
        try:
            batch_results = analyze_batch(batch)
            results.extend(batch_results)
        except Exception as e:
            print(f"  批次出错: {e}")
            results.extend([{"sentiment": "unknown", "theme": "unknown",
                             "key_insight": "", "app_opportunity": None}] * len(batch))

    result_df = pd.DataFrame(results)
    return pd.concat([df.reset_index(drop=True), result_df], axis=1)


# 执行分析（建议先用前 100 条验证效果）
df_sample = df_clean[df_clean["lang"] == "ja"].head(100)
df_analyzed = analyze_all_comments(df_sample)
df_analyzed.to_csv("hanami_analyzed.csv", index=False, encoding="utf-8-sig")
```

---

### 4.3 关键词频率分析（日语适配）

```python
# 安装日语分词库
# pip install janome

from janome.tokenizer import Tokenizer
from collections import Counter
import pandas as pd

def extract_keywords_ja(texts, top_n=50):
    """日语评论关键词提取"""
    t = Tokenizer()
    keywords = []

    # 停用词（过滤无意义词）
    stopwords = {"の", "は", "が", "に", "を", "と", "で", "も", "た",
                 "て", "い", "な", "か", "ね", "よ", "し", "です", "ます",
                 "こと", "ある", "いる", "する", "なる", "れる", "これ"}

    for text in texts:
        tokens = t.tokenize(text)
        for token in tokens:
            # 只保留名词、动词、形容词
            pos = token.part_of_speech.split(',')[0]
            if pos in ["名詞", "動詞", "形容詞"]:
                surface = token.surface
                if len(surface) > 1 and surface not in stopwords:
                    keywords.append(surface)

    counter = Counter(keywords)
    return pd.DataFrame(counter.most_common(top_n), columns=["词汇", "频次"])

df_ja = df_clean[df_clean["lang"] == "ja"]
keyword_df = extract_keywords_ja(df_ja["text_clean"].tolist())
print(keyword_df.head(20))
```

---

### 4.4 情感时序分析

```python
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

# 转换时间格式
df_analyzed["month"] = pd.to_datetime(
    df_analyzed["published_at"]).dt.to_period("M")

# 按月统计情感分布
sentiment_trend = df_analyzed.groupby(
    ["month", "sentiment"]).size().unstack(fill_value=0)

# 绘图（需要日文字体支持）
sentiment_trend.plot(kind="bar", stacked=True, figsize=(12, 5),
                     color={"positive": "#f9a8d4",
                            "neutral": "#d1d5db",
                            "negative": "#fca5a5"})
plt.title("评论情感时序分布（按月）")
plt.xlabel("月份")
plt.ylabel("评论数量")
plt.tight_layout()
plt.savefig("sentiment_trend.png", dpi=150)
```

---

## 五、产品洞察提炼框架

在完成数据分析后，建议按以下模板整理输出产品洞察，直接对接设计决策：

### 5.1 洞察卡片模板

```
【洞察 #N】
评论原文：[日文原文]
情感：[positive/negative/neutral]
主题维度：[六维之一]
核心行为模式：[用户在做什么]
未被满足的需求：[当前工具/App 没解决什么]
App 设计机会：[具体功能方向]
优先级：[High/Medium/Low]
```

### 5.2 典型洞察示例（基于常见评论模式）

---

**【洞察 #1】开花时机焦虑**

- **模式**：大量评论询问"今年いつ満開ですか？""うちの近くの桜はどこで確認できる？"
- **未满足需求**：日本气象厅预测数据缺乏本地化/社区化
- **App 机会**：UGC 开花实况地图——用户上传实拍照片标记开花状态，类似"赏花版 Waze"

---

**【洞察 #2】独自花見的情感需求**

- **模式**：「一人で花見するの好き」「一人花見最高」——一人赏花评论带有积极情绪
- **未满足需求**：一人赏花缺少记录仪式感与分享出口
- **App 机会**：单人赏花"日记模式"，强调个人仪式感记录而非社交炫耀，符合"温暖社交"设计原则

---

**【洞察 #3】年年回归的情感锚点**

- **模式**：「毎年この場所に来る」「5年連続」「子供の頃から」
- **未满足需求**：缺少跨年份的赏花记录与对比功能
- **App 机会**：「开花日历」功能——同一地点多年开花照片叠加对比，强化情感连接与回归动机

---

**【洞察 #4】花朵鉴别需求**

- **模式**：「これはソメイヨシノ？河津桜？」「違いがわからない」
- **未满足需求**：现有赏花 App 缺乏轻量的品种识别功能
- **App 机会**：拍照识别花种（AI 植物识别），结合《织梦森林》"种植 + 知识"循环，增加知识层积累感

---

**【洞察 #5】混杂体验抱怨**

- **模式**：「混みすぎて写真撮れない」「ゴミが多い」「インスタ映えスポット人だらけ」
- **未满足需求**：主流景点信息过于集中，用户渴望"秘密スポット"
- **App 机会**：隐秘赏花地点共享社区，类似小红书但专注赏花——对出海日本的产品是差异化机会

---

## 六、完整执行 Checklist

### 阶段一：数据采集（第 1–3 天）

- [ ] 申请 YouTube Data API Key
- [ ] 确定目标关键词列表（日语 × 英语 × 中文各 5–10 个）
- [ ] 用 `search_videos()` 筛选出 50–100 个高质量视频
- [ ] 手动浏览确认视频质量，剔除无关内容
- [ ] 批量采集评论，目标样本量：**5,000–10,000 条**
- [ ] 保存原始数据备份

### 阶段二：清洗与分类（第 3–5 天）

- [ ] 运行清洗脚本，过滤垃圾评论
- [ ] 语言分类（日语为主，英语补充）
- [ ] 抽取高赞评论（点赞数 top 10%）作为重点分析样本
- [ ] 用 Claude API 批量分析 500–1,000 条核心评论

### 阶段三：洞察提炼（第 5–7 天）

- [ ] 按六维主题统计分布
- [ ] 识别频次最高的 10–15 个痛点/需求
- [ ] 撰写洞察卡片（每个洞察对应一个 App 功能机会）
- [ ] 与《织梦森林》分析框架对照，识别可借鉴的设计模式

### 阶段四：产品转化（第 7–10 天）

- [ ] 将洞察映射到功能优先级矩阵
- [ ] 输出「出海日本赏花 App 功能需求文档 V1」
- [ ] 识别与 GrowFlow SDK "植物成长反馈"模块的复用机会

---

## 七、工具与资源汇总

| 工具 | 用途 | 链接/命令 |
|------|------|-----------|
| YouTube Data API v3 | 官方评论采集 | console.cloud.google.com |
| yt-dlp | 轻量评论抓取 | `pip install yt-dlp` |
| Janome | 日语分词 | `pip install janome` |
| pandas | 数据处理 | `pip install pandas` |
| Claude API (Sonnet) | 语义分析 | api.anthropic.com |
| TapTap 日本版 | 竞品评论参照 | taptap.io |
| App Annie / data.ai | App 下载数据 | data.ai |

---

## 附录：日本赏花 App 竞品关键词（用于定向搜索）

用以下关键词在 YouTube 搜索可直接找到竞品用户反馈视频：

```
「さくらアプリ」おすすめ
「日本気象協会 桜開花予想」アプリ
「Hanami」app review
「PictureThis」桜 識別
「GardenAnswers」Japan cherry blossom
お花見アプリ 比較
```

---

*本文档基于《织梦森林》设计拆解分析的研究框架延伸生成。*
*建议与「种花游戏竞品分析」及「GrowFlow SDK 规格文档」结合使用。*
*最后更新：2026 年 3 月*
