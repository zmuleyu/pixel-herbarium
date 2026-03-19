# X（Twitter）日本赏花用户研究检索方案

> **适用场景**：面向赏花/赏枫类应用的用户研究、竞品分析、需求挖掘  
> **目标市场**：日本（全球 Twitter/X 最活跃市场之一）  
> **数据窗口**：季节性高峰期 + 全年长尾讨论  
> **文档版本**：v1.0 · 2024

---

## 目录

1. [平台背景与研究价值](#1-平台背景与研究价值)
2. [核心检索语法参考](#2-核心检索语法参考)
   - 2.1 实时开花讨论
   - 2.2 用户推荐与痛点
   - 2.3 真实行为描述
   - 2.4 竞品 App 舆情
   - 2.5 话题标签矩阵
3. [高级检索策略](#3-高级检索策略)
4. [数据采集方式](#4-数据采集方式)
   - 4.1 X API v2
   - 4.2 Nitter 镜像站
   - 4.3 本土 SNS 聚合工具
5. [分析框架](#5-分析框架)
6. [季节性采集日历](#6-季节性采集日历)
7. [数据清洗与标注建议](#7-数据清洗与标注建议)
8. [输出模板](#8-输出模板)
9. [工具与资源汇总](#9-工具与资源汇总)
10. [注意事项与合规提示](#10-注意事项与合规提示)

---

## 1. 平台背景与研究价值

### 为什么选择 X（Twitter）

日本是 Twitter/X 全球最活跃市场之一，具备以下独特研究价值：

| 维度 | 说明 |
|------|------|
| **用户规模** | 日本月活约 6,700 万（截至 2023），人均发推频次全球领先 |
| **文化契合** | 日本用户习惯在 Twitter 分享日常"碎碎念"，赏花体验天然适配 |
| **季节驱动** | 每年 3–5 月樱花季、10–12 月红叶季产生巨量讨论，数据密度极高 |
| **真实性** | 相比 Instagram 的精修内容，Twitter 更多反映未经加工的真实体验 |
| **开放索引** | 推文默认公开，历史数据可通过 API 回溯采集 |

### 研究目标定位

```
用户研究目标树
├── 需求挖掘
│   ├── 用户最关心的赏花信息维度（开花进度、天气、人流）
│   └── 现有工具未能满足的使用场景
├── 竞品分析
│   ├── 竞品 App 的真实口碑
│   └── 用户切换/放弃某工具的原因
└── 用户画像
    ├── 核心重度用户识别（高互动 + 话题参与者）
    └── 地域分布与行为模式
```

---

## 2. 核心检索语法参考

> **说明**：以下语法适用于 X 高级搜索（twitter.com/search-advanced）及 API v2 `query` 参数。

---

### 2.1 实时开花讨论

**目标**：捕捉花期内的高频实时讨论，了解用户关注点与情绪走向。

```
# 基础樱花开花讨论（限日语、限时间窗口）
桜 開花 lang:ja since:2024-03-15 until:2024-04-10

# 加入天气维度（恶劣天气对赏花的影响）
桜 開花 (雨 OR 風 OR 嵐) lang:ja since:2024-03-15 until:2024-04-10

# 红叶季对应语法
紅葉 見頃 lang:ja since:2024-10-15 until:2024-12-10

# 花期预测讨论（预测 vs 实际的落差是重要痛点）
桜 開花予想 OR 満開予想 lang:ja

# 地域限定讨论（以东京为例）
桜 開花 東京 OR 上野 OR 新宿御苑 lang:ja
```

---

### 2.2 用户推荐与痛点

**目标**：挖掘用户自发的工具推荐行为，以及对现有解决方案的不满。

```
# 寻找 App 推荐行为
桜 アプリ おすすめ lang:ja
紅葉 アプリ 便利 lang:ja

# 寻找景点推荐（穴場 = 小众/不拥挤的好地方）
桜 スポット 穴場 lang:ja
紅葉 スポット 穴場 lang:ja
お花見 穴場 (2024 OR 今年) lang:ja

# 挖掘痛点与失败体验
お花見 残念 OR 失敗 OR がっかり lang:ja
桜 (もう散った OR 散ってた OR 終わってた) lang:ja
桜 (混みすぎ OR 人多すぎ OR 渋滞) lang:ja
紅葉 ピーク外した lang:ja

# 期待落差相关
桜 思ったより OR 意外と OR 全然 lang:ja -is:retweet

# 工具/情报不足的抱怨
桜 情報 (なかった OR 少ない OR 不正確) lang:ja
開花情報 (遅い OR 間違い OR 更新されない) lang:ja
```

---

### 2.3 真实行为描述

**目标**：找到描述实际出行行为的推文，理解用户决策路径。

```
# 去赏花了（行动后发推）
桜 見に行った lang:ja -is:retweet min_faves:10
お花見 行ってきた lang:ja -is:retweet min_faves:5
紅葉 見てきた lang:ja -is:retweet min_faves:10

# 正在赏花（实时推文，情境最真实）
桜 今 見てる lang:ja -is:retweet
お花見 中 lang:ja -is:retweet has:images

# 计划阶段的讨论（决策前的信息需求）
お花見 どこ OR どこか lang:ja since:2024-03-01
桜 おすすめ 教えて lang:ja

# 独自行动 vs 集体行动
お花見 一人 lang:ja -is:retweet min_faves:20
お花見 職場 OR 会社 lang:ja

# 拍照行为相关（与拍花类 App 高度相关）
桜 写真 撮った lang:ja has:images -is:retweet min_faves:15
桜 映え OR フォトスポット lang:ja
```

---

### 2.4 竞品 App 舆情

**目标**：收集主要竞品的真实用户反馈。

```
# GreenSnap（植物识别 SNS）
GreenSnap 桜 lang:ja
GreenSnap (使い方 OR おすすめ OR 不具合) lang:ja

# ハナノナ（花朵识别 App）
ハナノナ lang:ja
ハナノナ (精度 OR 使える OR 使えない) lang:ja

# ウェザーニュース（天气 App，附带花期预报）
ウェザーニュース 桜 開花 lang:ja
ウェザーニュース (桜レーダー OR さくら開花予想) lang:ja

# 组合查询（多竞品同时出现的讨论）
(GreenSnap OR ハナノナ OR ウェザーニュース) 桜 lang:ja

# 扩展竞品列表
(みんなの花図鑑 OR PictureThis OR iNaturalist) 桜 lang:ja

# 开放式竞品发现
桜 (アプリ OR app) (使った OR 使ってる OR 使えた) lang:ja -is:retweet min_faves:5
```

---

### 2.5 话题标签矩阵

**目标**：通过话题标签定位核心参与用户群。

```
# 官方 / 高频话题标签
#桜前線 lang:ja
#お花見 lang:ja
#桜 lang:ja has:images min_faves:50
#紅葉 lang:ja has:images min_faves:50

# 地域话题标签（可按城市替换）
#東京桜 OR #京都桜 OR #大阪桜 OR #北海道桜 lang:ja

# UGC 创作型话题标签
#桜フォト lang:ja
#桜撮影 lang:ja
#花見スポット lang:ja

# 红叶季对应
#紅葉前線 OR #紅葉狩り OR #秋の紅葉 lang:ja
```

---

## 3. 高级检索策略

### 3.1 分层信号过滤

根据研究目的，用不同的互动量阈值筛选推文：

| 层级 | 过滤条件 | 代表内容 |
|------|----------|----------|
| **信号层（高质量）** | `min_faves:100` | KOL 观点、广泛认可的攻略 |
| **行为层（中等质量）** | `min_faves:10 -is:retweet` | 普通用户真实原创体验 |
| **噪声层（原始声音）** | 无互动过滤 | 最即时的碎片化情绪 |

### 3.2 情绪极性查询模板

```
# 正向情绪（用于了解用户满意点）
桜 (最高 OR 綺麗 OR 感動 OR よかった OR 最高すぎ) lang:ja -is:retweet min_faves:20

# 负向情绪（用于挖掘痛点）
桜 (残念 OR がっかり OR 失敗 OR 後悔 OR 最悪) lang:ja -is:retweet

# 问句型（用于发现信息需求）
桜 (どこ OR いつ OR どうやって OR おすすめ) ? lang:ja
```

### 3.3 时间维度分层策略

```
# 赏花前（信息决策期）：距花期 2-4 周前
桜 開花 いつ OR 予想 lang:ja since:2024-02-15 until:2024-03-14

# 赏花中（情境体验期）：花期高峰
桜 今 OR 今日 lang:ja since:2024-03-25 until:2024-04-07

# 赏花后（回顾评价期）：花期结束后 2 周
お花見 振り返り OR また来年 OR 来年こそ lang:ja since:2024-04-08 until:2024-04-30
```

### 3.4 用户类型识别查询

```
# 摄影爱好者（与拍花 App 高度重叠）
桜 カメラ OR レンズ OR 一眼 has:images lang:ja min_faves:30

# 本地达人（频繁提及地标的用户）
桜 (毎年 OR 恒例 OR お気に入りの場所) lang:ja min_faves:15

# 家庭用户
お花見 子供 OR 家族 OR ベビーカー lang:ja

# 外国游客视角（可对比本地视角）
桜 (tourist OR travel OR 외국인) lang:en OR lang:ko
```

---

## 4. 数据采集方式

### 4.1 X API v2

**适合**：结构化批量采集、周期性监控、历史回溯

#### 免费层（Free Tier）限制

| 指标 | 限制 |
|------|------|
| 月读取量 | 500,000 tokens（约 1 万条推文/月） |
| 回溯深度 | 最近 7 天 |
| 查询并发 | 1 个连接 |

#### 基础版（$100/月）

| 指标 | 限制 |
|------|------|
| 月读取量 | 1,000,000 tokens |
| 回溯深度 | 全历史（Full Archive） |
| 查询并发 | 最多 2 个 App |

#### Python 采集示例（tweepy）

```python
import tweepy
import pandas as pd
import json
from datetime import datetime

# 初始化客户端
client = tweepy.Client(bearer_token="YOUR_BEARER_TOKEN", wait_on_rate_limit=True)

def search_hanami_tweets(query: str, max_results: int = 100, save_path: str = None):
    """
    采集赏花相关推文
    
    Args:
        query: X 搜索语法字符串
        max_results: 最大采集数量（每次请求 10-100）
        save_path: 保存路径（None 则仅返回数据）
    """
    tweets_data = []
    
    paginator = tweepy.Paginator(
        client.search_recent_tweets,
        query=query,
        tweet_fields=["created_at", "author_id", "public_metrics", "lang", "geo"],
        user_fields=["name", "username", "public_metrics", "location"],
        expansions=["author_id"],
        max_results=100
    )
    
    for page in paginator:
        if page.data:
            users = {u.id: u for u in (page.includes.get("users") or [])}
            for tweet in page.data:
                user = users.get(tweet.author_id, {})
                tweets_data.append({
                    "id": tweet.id,
                    "text": tweet.text,
                    "created_at": tweet.created_at,
                    "author_id": tweet.author_id,
                    "author_name": getattr(user, "name", ""),
                    "author_username": getattr(user, "username", ""),
                    "author_location": getattr(user, "location", ""),
                    "like_count": tweet.public_metrics.get("like_count", 0),
                    "retweet_count": tweet.public_metrics.get("retweet_count", 0),
                    "reply_count": tweet.public_metrics.get("reply_count", 0),
                    "query_label": query[:50]  # 记录来源查询
                })
        
        if len(tweets_data) >= max_results:
            break
    
    df = pd.DataFrame(tweets_data)
    
    if save_path:
        df.to_csv(save_path, index=False, encoding="utf-8-sig")
        print(f"已保存 {len(df)} 条推文到 {save_path}")
    
    return df


# 示例：批量执行多个查询
QUERIES = [
    ('桜 見に行った lang:ja -is:retweet min_faves:10', 'behavior_went'),
    ('お花見 残念 OR 失敗 lang:ja', 'pain_points'),
    ('桜 アプリ おすすめ lang:ja', 'app_recommendations'),
    ('(GreenSnap OR ハナノナ OR ウェザーニュース) 桜 lang:ja', 'competitor_mentions'),
]

all_results = []
for query, label in QUERIES:
    print(f"采集中: {label}")
    df = search_hanami_tweets(query, max_results=200)
    df["category"] = label
    all_results.append(df)

final_df = pd.concat(all_results, ignore_index=True)
final_df.drop_duplicates(subset="id", inplace=True)
final_df.to_csv(f"hanami_tweets_{datetime.now().strftime('%Y%m%d')}.csv",
                index=False, encoding="utf-8-sig")
print(f"总计采集 {len(final_df)} 条去重推文")
```

---

### 4.2 Nitter 镜像站

**适合**：API 配额耗尽时的补充手段、无需注册的快速验证

> ⚠️ **稳定性警告**：Nitter 公共实例可能随时失效，建议优先使用官方 API。  
> ⚠️ **法律灰色地带**：使用前请确认当前 ToS 状态。

#### 可用实例列表

```
https://nitter.net          # 主站（最常用，稳定性一般）
https://nitter.privacydev.net
https://nitter.poast.org
```

#### 基础爬取示例（BeautifulSoup）

```python
import requests
from bs4 import BeautifulSoup
import time

def nitter_search(query: str, lang: str = "ja", pages: int = 3):
    """通过 Nitter 采集推文（备用方案）"""
    results = []
    base_url = "https://nitter.net/search"
    
    for page in range(1, pages + 1):
        params = {"q": query, "f": "tweets", "p": page}
        headers = {"User-Agent": "Mozilla/5.0 (research bot)"}
        
        try:
            resp = requests.get(base_url, params=params, headers=headers, timeout=10)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            for tweet_div in soup.select(".timeline-item"):
                text_el = tweet_div.select_one(".tweet-content")
                date_el = tweet_div.select_one(".tweet-date a")
                stats = tweet_div.select(".icon-container")
                
                if text_el:
                    results.append({
                        "text": text_el.get_text(strip=True),
                        "date": date_el["title"] if date_el else "",
                        "url": "https://nitter.net" + (date_el["href"] if date_el else ""),
                    })
            
            time.sleep(2)  # 礼貌爬取间隔
            
        except Exception as e:
            print(f"第 {page} 页采集失败: {e}")
    
    return results
```

---

### 4.3 本土 SNS 聚合工具

**适合**：无代码快速探索、跨平台初步验证

#### Social Search（sns-search.com）

- **定位**：日本本土 SNS 搜索聚合，支持 Twitter/X、Instagram、TikTok 等
- **特点**：界面日语，结果日语优先，适合非技术背景研究员使用
- **使用方式**：直接在网页输入关键词，可按平台筛选
- **适合场景**：快速验证某个关键词的热度、发现意料外的讨论角度

#### 补充工具参考

| 工具 | 特点 | 适用场景 |
|------|------|----------|
| **Keywordmap** | 日本 SEO/SNS 分析平台 | 关键词量化趋势 |
| **Brandwatch**（日本版） | 商业级舆情监控 | 竞品品牌监控 |
| **Yahoo! リアルタイム検索** | 日本本土 Twitter 实时搜索 | 快速实时监控 |
| **TweetDeck** | X 官方多列管理工具 | 多关键词并行监控 |

---

## 5. 分析框架

### 5.1 高转发攻略贴分析

**目标**：理解用户最看重的信息维度

```
分析步骤：
1. 筛选 retweet_count > 50 且含 #桜 / #お花見 的原创推文
2. 提取内容模式：
   - 信息类型（时间预报 / 地点推荐 / 实景照片 / 注意事项）
   - 包含的信息维度（开花进度 / 天气 / 交通 / 人流 / 停车）
   - 是否包含外部链接（App / 网站 / 地图）
3. 统计高频信息维度 → 对应 App 功能优先级
```

**分析模板（Excel 可用）**

| 推文 ID | 转发数 | 核心信息维度 | 有无外链 | App 提及 | 情绪极性 |
|---------|--------|-------------|---------|---------|---------|
| ... | ... | 开花进度 + 天气 | 有（ウェザーニュース）| 是 | 正向 |

---

### 5.2 痛点推文分析

**目标**：提炼现有工具的核心缺陷

```
痛点归类标签体系：

[信息准确性]
  - P01: 开花预测不准
  - P02: 景点状态信息过时
  - P03: 人流信息缺失

[使用体验]
  - P04: App 崩溃 / 加载慢
  - P05: UI 难用 / 找不到功能
  - P06: 需要注册才能查看

[信息覆盖]
  - P07: 小众景点缺失
  - P08: 地方城市数据薄弱
  - P09: 红叶 / 梅花等非樱花覆盖差

[社区互动]
  - P10: 无法分享自己的观察
  - P11: 评论区不活跃
```

---

### 5.3 核心重度用户识别

**目标**：找到最具研究价值的用户进行深度访谈或行为分析

```python
def identify_power_users(df: pd.DataFrame) -> pd.DataFrame:
    """
    识别核心重度用户
    标准：话题参与频次高 + 互动量高 + 发布原创内容
    """
    user_stats = df.groupby("author_id").agg(
        tweet_count=("id", "count"),
        total_likes=("like_count", "sum"),
        total_retweets=("retweet_count", "sum"),
        avg_likes=("like_count", "mean"),
        unique_queries=("query_label", "nunique"),  # 参与话题广度
    ).reset_index()
    
    # 综合评分（可调权重）
    user_stats["power_score"] = (
        user_stats["tweet_count"] * 0.3 +
        user_stats["avg_likes"] * 0.4 +
        user_stats["unique_queries"] * 10 * 0.3
    )
    
    return user_stats.sort_values("power_score", ascending=False).head(50)
```

**重度用户特征标志**

- 每年花期内发推 5+ 条关于赏花的内容
- 参与 `#桜前線` 话题讨论
- 推文中出现多个景点名（说明有规律出行习惯）
- 粉丝数 1,000–50,000（去除机构账号和明星）

---

## 6. 季节性采集日历

### 樱花季（主力季节）

| 时间段 | 关键词重点 | 采集目标 |
|--------|-----------|---------|
| **1 月下旬 – 2 月** | `桜 開花予想` `河津桜` | 花期预测信息需求 |
| **3 月上旬** | `桜前線 北上` `関東 開花` | 信息焦虑期，工具搜索高峰 |
| **3 月下旬 – 4 月上旬** | `お花見 行った` `桜 満開` | 体验高峰，实时行为数据最密集 |
| **4 月中旬** | `桜 散った` `来年こそ` | 遗憾情绪，失败体验总结 |
| **4 月下旬 – 5 月** | `桜 終わり` `振り返り` | 长尾讨论，理性回顾 |

### 红叶季（次要季节）

| 时间段 | 关键词重点 | 采集目标 |
|--------|-----------|---------|
| **9 月** | `紅葉 予想` `今年の秋` | 预测信息需求 |
| **10 月中旬 – 11 月** | `紅葉 見頃` `紅葉狩り` | 体验高峰 |
| **12 月上旬** | `紅葉 終わった` | 遗憾与总结 |

### 全年持续监控（低频）

```
# 每月执行一次，跟踪品牌口碑变化
(GreenSnap OR ハナノナ) (口コミ OR レビュー OR 使ってみた) lang:ja
```

---

## 7. 数据清洗与标注建议

### 7.1 基础清洗规则

```python
import re

def clean_tweet_text(text: str) -> str:
    """推文文本基础清洗"""
    # 去除 URL
    text = re.sub(r'https?://\S+', '', text)
    # 去除 @mention
    text = re.sub(r'@\w+', '', text)
    # 保留话题标签文字（去除#符号）
    text = re.sub(r'#(\S+)', r'\1', text)
    # 去除多余空白
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def is_likely_spam(text: str) -> bool:
    """简单垃圾推文过滤"""
    spam_patterns = [
        r'(フォロー|リツイート)で.*(当たる|プレゼント)',  # 抽奖推文
        r'無料.*登録',  # 广告
        r'(副業|稼ぐ|収入)',  # 赚钱相关
    ]
    return any(re.search(p, text) for p in spam_patterns)
```

### 7.2 人工标注维度

对筛选后的样本（建议每类 50–100 条）进行人工标注：

```
标注维度表：

[内容类型]
  A = 个人体验分享
  B = 信息/攻略分享
  C = 情绪宣泄（无具体信息）
  D = 提问/求助
  E = App/工具提及

[情绪极性]
  1 = 明确正向
  0 = 中性/混合
  -1 = 明确负向

[信息维度]（多选）
  □ 开花进度
  □ 景点推荐
  □ 天气影响
  □ 人流/拥挤
  □ 交通/停车
  □ 拍照技巧
  □ App 使用反馈
  □ 其他

[行为阶段]
  PRE = 计划阶段
  DURING = 进行中
  POST = 事后回顾
```

---

## 8. 输出模板

### 8.1 用户需求洞察报告框架

```markdown
## 赏花用户 Twitter 需求洞察报告

### 执行摘要
- 采集时间：____
- 总推文数量：____ 条（清洗后：____ 条）
- 覆盖查询类别：____

### 核心发现

#### 用户最关注的信息维度（按提及频次排序）
1. ____
2. ____

#### 现有工具主要痛点 TOP5
| 痛点 | 代表推文（脱敏）| 出现频次 |
|------|--------------|---------|
| ... | ... | ... |

#### 竞品口碑对比
| App | 正面提及 | 负面提及 | 核心评价关键词 |
|-----|---------|---------|--------------|
| ... | ... | ... | ... |

### 重度用户画像
- 典型用户描述
- 高频行为模式

### 机会点建议
1. ____
2. ____
```

---

## 9. 工具与资源汇总

| 类型 | 工具 | 链接 | 用途 |
|------|------|------|------|
| **API 采集** | tweepy | pypi.org/project/tweepy | Python X API 封装 |
| **API 采集** | twikit | github.com/d60/twikit | 免 API Key 采集（非官方） |
| **文本分析** | fugashi | pypi.org/project/fugashi | 日语形态素分析 |
| **文本分析** | janome | pypi.org/project/janome | 轻量级日语分词 |
| **情感分析** | oseti | pypi.org/project/oseti | 日语情感极性词典 |
| **可视化** | wordcloud | pypi.org/project/wordcloud | 词频可视化 |
| **搜索验证** | sns-search.com | sns-search.com | 日本 SNS 聚合搜索 |
| **实时监控** | Yahoo!リアルタイム | search.yahoo.co.jp/realtime | 免费实时 Twitter 搜索 |
| **高级搜索** | X Advanced Search | twitter.com/search-advanced | 官方高级搜索 UI |

---

## 10. 注意事项与合规提示

### 数据使用合规

> ⚠️ 以下为一般性提示，具体合规要求请咨询法律顾问。

1. **个人信息保护**：推文文本可用于研究，但不得以可识别个人身份的方式公开发布原始推文内容。引用时应脱敏（隐去用户名）。

2. **X 服务条款**：X API 使用须遵守 [Developer Agreement](https://developer.twitter.com/en/developer-terms/agreement)，禁止将数据出售或用于与申请用途不符的商业目的。

3. **学术 / 商业区分**：学术研究用途在 ToS 中享有更宽松的政策；若用于商业产品开发，建议购买官方商业授权。

4. **数据存储**：X ToS 要求不得在第三方数据库中长期存储推文全文，建议仅保存推文 ID（可通过 ID 回溯），在使用时再 hydrate 完整数据。

### 方法论局限性

- Twitter/X 用户不代表全体赏花人群（存在年龄、技术素养偏差）
- 高互动推文可能被算法放大，不一定反映大多数用户意见
- 季节性数据具有较强时效性，需每年更新采集

---

*本文档最后更新：2024 年 · 如需更新 API 配额或平台政策相关内容，请以 X 官方文档为准。*
