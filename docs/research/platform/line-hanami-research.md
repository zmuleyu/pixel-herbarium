# LINE 平台日本赏花用户研究检索方案

> **适用场景**：面向赏花/赏枫类应用的用户研究、竞品分析、需求挖掘  
> **目标平台**：LINE（日本月活超 9,600 万，渗透率约 78%）  
> **核心差异**：LINE 以封闭式通讯为主，可公开检索的表面有限但质量极高  
> **文档版本**：v1.0 · 2024

---

## 目录

1. [平台背景与研究价值](#1-平台背景与研究价值)
2. [LINE 可研究表面总览](#2-line-可研究表面总览)
3. [LINE OpenChat 检索方案](#3-line-openchat-检索方案)
4. [LINE VOOM 检索方案](#4-line-voom-检索方案)
5. [LINE Blog 检索方案](#5-line-blog-检索方案)
6. [LINE News 评论检索方案](#6-line-news-评论检索方案)
7. [LINE Creators Market 检索方案](#7-line-creators-market-检索方案)
8. [跨表面综合检索策略](#8-跨表面综合检索策略)
9. [数据采集方式](#9-数据采集方式)
10. [分析框架](#10-分析框架)
11. [季节性采集日历](#11-季节性采集日历)
12. [与 X 平台的互补关系](#12-与-x-平台的互补关系)
13. [数据清洗与标注建议](#13-数据清洗与标注建议)
14. [输出模板](#14-输出模板)
15. [工具与资源汇总](#15-工具与资源汇总)
16. [注意事项与合规提示](#16-注意事项与合规提示)

---

## 1. 平台背景与研究价值

### LINE 在日本的独特地位

LINE 不是日本版 Twitter，它是日本的"基础设施级"通讯平台，与 X 形成完全不同的研究互补。

| 维度 | X（Twitter） | LINE |
|------|-------------|------|
| **定位** | 公开广播式社交 | 私密通讯 + 生活服务 |
| **日本月活** | ~6,700 万 | ~9,600 万 |
| **年龄分布** | 18–40 岁偏重 | 10–70 岁全年龄覆盖 |
| **内容形态** | 短推文、实时舆情 | 对话、日记、新闻评论 |
| **数据开放性** | 推文默认公开 | 绝大多数对话私密 |
| **可检索表面** | 全推文 | OpenChat / VOOM / Blog / News |
| **研究价值** | 实时情绪、KOL观点 | 日常真实对话、中老年用户声音 |

### 为什么 LINE 对赏花研究不可或缺

```
LINE 独有的研究价值：

1. 覆盖 X 无法触达的用户群
   → 50岁以上日本用户LINE渗透率远高于Twitter
   → 家庭群组中的亲子赏花计划讨论

2. 更真实的日常口语表达
   → 非展示性内容，减少"表演给粉丝看"的滤镜
   → OpenChat 中陌生人之间的真实信息交换

3. 本地社区网络
   → 地域性 OpenChat 群组（"京都桜情報"等）
   → 地方特有的赏花信息流通渠道

4. 赏花前的计划阶段数据
   → 用户更倾向在 LINE 而非 Twitter 询问朋友推荐
   → 家庭日程协调发生在 LINE，X 看不到
```

---

## 2. LINE 可研究表面总览

LINE 的数据架构决定了可研究的表面是有限的几个开放区域：

```
LINE 平台结构

├── 【私密区域 - 不可研究】
│   ├── 个人聊天（1对1）
│   ├── 群组聊天（Group Chat）
│   ├── LINE Keep（个人收藏）
│   └── LINE Pay 交易记录
│
└── 【公开区域 - 可研究】
    ├── OpenChat（オープンチャット）★★★ 最重要
    ├── LINE VOOM（Vlog 式公开动态）★★
    ├── LINE Blog（博客平台）★★
    ├── LINE News 评论区 ★★
    ├── LINE Creators Market（贴纸/表情商店）★
    └── LINE 公式账号（官方账号公开内容）★
```

> **研究价值星级说明**：★★★ 高价值 / ★★ 中等价值 / ★ 参考价值

---

## 3. LINE OpenChat 检索方案

### 3.1 OpenChat 平台特性

OpenChat（オープンチャット）是 LINE 内的公开群聊功能，任何人可加入，对话历史在组内可见，是 LINE 平台**最接近公开论坛**的数据源。

**关键特点：**
- 群组规模：最多 5,000 人
- 加入方式：通过链接或搜索加入，无需对方同意
- 数据形态：实时对话流，有时间戳
- 匿名程度：成员可设置 OpenChat 专属昵称，与主账号分离

### 3.2 搜索入口

**方式一：LINE App 内搜索（最直接）**

```
操作路径：
LINE App → 右上角"搜索" → 切换到"オープンチャット"标签

推荐搜索关键词：
桜
お花見
桜前線
紅葉
花見スポット
GreenSnap
ウェザーニュース 桜
花見 [城市名，如：京都 / 東京 / 大阪]
```

**方式二：OpenChat 网页入口**

```
URL: https://openchat.line.me/

网页搜索支持关键词检索群组
适合批量发现群组，无需在手机端操作
```

### 3.3 目标群组类型矩阵

| 群组类型 | 搜索关键词示例 | 研究价值 |
|---------|--------------|---------|
| **全国赏花情报群** | `桜前線 2024`、`お花見情報` | 开花进度信息流通模式 |
| **地域赏花群** | `東京桜`、`京都 桜 2024`、`大阪お花見` | 地域性景点推荐、本地用户行为 |
| **摄影爱好者群** | `桜 写真`、`花撮影`、`カメラ 桜` | 拍花 App 使用讨论、设备推荐 |
| **家庭 / 育儿群** | `子供とお花見`、`ベビーカー 花見` | 亲子赏花需求、家庭用户痛点 |
| **植物识别群** | `花の名前`、`植物 識別`、`GreenSnap` | 竞品口碑、识别 App 使用场景 |
| **旅行计划群** | `春旅行 桜`、`花見ツアー` | 外地游客的信息需求 |

### 3.4 群组内观察重点

加入目标群组后，重点记录以下信息模式：

```
观察维度清单：

【信息需求类型】
□ "〇〇はまだ咲いてますか？" → 开花状态查询
□ "おすすめの場所教えてください" → 地点推荐请求
□ "何時頃行くといいですか？" → 时间规划需求
□ "アプリで確認できますか？" → 工具使用需求

【信息提供模式】
□ 附带照片的实地报告（最高价值）
□ 附带链接的情报分享（链接指向哪些工具/网站？）
□ 经验性建议（"毎年〇〇へ行ってます"）

【工具提及追踪】
□ 主动推荐某 App 的发言
□ 抱怨某工具不准确的发言
□ 询问"何かいいアプリ"的发言 → 记录回复中推荐的工具

【社群动态信号】
□ 群组成员数（>500人 = 活跃度高）
□ 最近发言时间（确认群组是否活跃）
□ 花期内发言密度 vs 非花期密度
```

### 3.5 OpenChat 关键词查询矩阵

```
# 信息需求类（用于搜索群内历史发言）
桜 どこ おすすめ
桜 開花 いつ
花見 スポット 教えて
桜 アプリ 何使ってる

# 痛点类
桜 情報 ない
開花 はずれ
アプリ 使えない
予報 外れた

# 工具讨论类
GreenSnap どう思う
ウェザーニュース 桜情報
ハナノナ 精度
アプリ 比較

# 行为类（含具体时间的真实记录）
桜 見てきた 写真
今日 満開 行ってきた
お花見 レポート
```

---

## 4. LINE VOOM 检索方案

### 4.1 VOOM 平台特性

LINE VOOM（旧称 LINE タイムライン）是 LINE 内的短视频/动态发布功能，公开帖子可被搜索和发现。

**关键特点：**
- 内容形态：图文动态 + 短视频（类 TikTok/Reels 风格）
- 公开设置：用户可选择"全体公開"使帖子可被搜索
- 互动形式：点赞 / 评论 / 转发
- 算法分发：热门内容会进入推荐流

### 4.2 搜索入口

```
操作路径：
LINE App → 底部"VOOM"标签 → 右上角搜索图标

网页版（有限支持）：
https://timeline.line.me/
```

### 4.3 VOOM 检索关键词

**赏花体验类**

```
桜 お花見
満開 桜
桜 絶景
花見スポット
桜前線
紅葉 見頃
```

**App 使用场景类**

```
桜 アプリ 使ってみた
花の名前 調べた
GreenSnap 投稿
植物 識別 アプリ
```

**摄影分享类（VOOM 强项）**

```
桜 写真
桜 撮影
お花見 動画
桜 タイムラプス
```

### 4.4 VOOM 分析重点

| 分析维度 | 具体观察点 |
|---------|-----------|
| **高赞内容模式** | 哪类赏花内容获得最多点赞（风景 vs 人物 vs 情报） |
| **评论区信息** | 评论中是否有用户询问地点、App、具体信息 |
| **外链引用** | 内容创作者链接到哪些外部工具或网站 |
| **发布频次** | KOL 级用户的发布节奏，对应花期高峰 |

---

## 5. LINE Blog 检索方案

### 5.1 Blog 平台特性

LINE Blog 是 LINE 旗下的博客平台，日本艺人、KOL 和普通用户广泛使用，内容长度远超推文，可被 Google 索引。

**研究价值：**
- 详细的赏花游记（含行程、景点、体验细节）
- KOL 的 App 使用评测（有商业合作标注）
- 普通用户深度体验描述

### 5.2 检索入口

```
LINE Blog 官网：https://lineblog.me/

支持站内搜索，同时可通过 Google 进行站内搜索：
site:lineblog.me 桜 お花見
site:lineblog.me 桜 アプリ おすすめ
site:lineblog.me 花見 スポット 2024
```

### 5.3 Google 站内检索语法

```
# 基础赏花游记
site:lineblog.me お花見 レポート

# App 使用评测
site:lineblog.me 桜 アプリ レビュー
site:lineblog.me GreenSnap 使い方
site:lineblog.me ハナノナ 感想

# 景点攻略
site:lineblog.me 桜 穴場 おすすめ
site:lineblog.me お花見 スポット 東京

# 含痛点的体验
site:lineblog.me 桜 残念 OR がっかり

# 红叶季
site:lineblog.me 紅葉 見頃 レポート

# 家庭赏花
site:lineblog.me お花見 子供 家族
```

### 5.4 Blog 内容分析框架

```
高价值 Blog 帖子判断标准：
✓ 字数 500 字以上（有足够信息密度）
✓ 发布时间在花期内或花期后 2 周内
✓ 包含具体景点名称或 App 名称
✓ 评论数 > 5（表明有读者互动）

分析提取维度：
1. 作者使用了哪些工具做花期判断？
2. 出行决策流程是什么？（看天气 → 查开花情况 → ...）
3. 遇到了哪些问题？
4. 文章中推荐了哪些资源？（App / 网站 / 账号）
5. 评论区读者的追问是什么？（反映信息缺口）
```

---

## 6. LINE News 评论检索方案

### 6.1 News 平台特性

LINE News 是日本用户量极大的新闻聚合平台，每篇文章下的评论区（コメント欄）是高度活跃的公开讨论空间，且覆盖年龄层比 Twitter 更广。

**研究价值：**
- 覆盖 40–60 岁等 Twitter 较难触达的年龄段
- 对新闻事件（开花预测、天气灾害影响等）的即时反应
- 真实的信息需求和情绪表达

### 6.2 检索入口

```
LINE News 网页版：https://news.line.me/

App 内路径：
LINE App → 底部"ニュース"标签

Google 站内搜索：
site:news.line.me 桜 開花 2024
site:news.line.me お花見 天気
site:news.line.me 桜前線
```

### 6.3 目标文章类型

| 文章类型 | 关键词 | 评论区研究价值 |
|---------|--------|--------------|
| **开花预测报道** | `桜 開花予想 2024` | 用户对预测准确性的期待与抱怨 |
| **赏花景点特辑** | `桜 名所 おすすめ` | 用户补充推荐、质疑信息准确性 |
| **天气影响报道** | `桜 開花 天気` | 天气信息与赏花计划的关联需求 |
| **App / 服务评测** | `桜 アプリ 2024` | 直接的工具使用口碑 |
| **人流拥挤相关** | `お花見 混雑 マナー` | 赏花痛点（排队、人多）讨论 |
| **红叶季报道** | `紅葉 2024 見頃` | 同类用户群的秋季行为 |

### 6.4 评论区关键词追踪

在目标文章评论区内，重点追踪以下发言模式：

```
【信息补充型】（用户提供额外情报）
"〇〇公園は昨日行きましたが..."  → 实地情报价值
"去年は〇〇だったので..."         → 历史比较

【工具提及型】
"ウェザーニュースで確認して..."  → 工具使用行为
"アプリで見たら..."               → 工具名识别
"何かいいアプリないかな"          → 工具需求表达

【痛点型】
"情報が古い"         → 信息时效痛点
"行ったのに散ってた" → 预测落差痛点
"人が多すぎ"         → 体验质量痛点
"駐車場が..."        → 基础设施痛点
```

---

## 7. LINE Creators Market 检索方案

### 7.1 平台特性与研究价值

LINE Creators Market 是用户自制表情包 / 贴图的销售平台，通过分析热门赏花题材贴纸，可以：
- 了解用户对赏花场景的**情感符号化表达**
- 识别哪些赏花相关情绪被高度共鸣
- 发现竞品 App / 服务的品牌贴纸（了解其品牌渗透度）

### 7.2 检索入口

```
LINE Store（贴纸商店）：https://store.line.me/stickershop/

搜索关键词：
桜          → 樱花主题贴纸
お花見      → 赏花活动贴纸
花見         → 同上
紅葉        → 红叶贴纸
春          → 春季相关

竞品品牌搜索：
GreenSnap        → 是否有官方贴纸（反映品牌 LINE 化程度）
ウェザーニュース → 官方贴纸活跃度
```

### 7.3 分析维度

```
热销贴纸分析维度：

1. 情感类型分布
   → 哪类赏花情绪被贴纸化？（期待、喜悦、遗憾、搞笑）

2. 使用场景推断
   → 贴纸配套文字是什么？（"お花見行こう！"vs "もう散った..."）

3. 角色/视觉偏好
   → 拟人化花卉 / 真实摄影 / Q版卡通 → 对应 App UI 设计方向

4. 竞品品牌渗透
   → 官方贴纸下载量 → 品牌 LINE 化程度
   → 用户自制竞品同人贴纸 → 粉丝粘性信号
```

---

## 8. 跨表面综合检索策略

### 8.1 用户旅程对应的平台分布

```
用户赏花决策旅程 × LINE 平台表面映射：

[阶段一：萌发兴趣 / 信息获取]
主要发生在 → LINE News（浏览开花报道）
检索重点   → News 评论区：用户如何回应开花信息

[阶段二：计划制定 / 工具选择]
主要发生在 → LINE OpenChat（问群友推荐）
检索重点   → OpenChat：工具推荐讨论、景点询问

[阶段三：实地体验 / 实时分享]
主要发生在 → LINE VOOM（发布实时动态）
检索重点   → VOOM：实地体验内容、照片分享

[阶段四：事后回顾 / 深度分享]
主要发生在 → LINE Blog（长篇游记）
检索重点   → Blog：详细体验描述、工具使用反思
```

### 8.2 跨平台关键词一致性矩阵

同一关键词在不同 LINE 表面的检索预期：

| 关键词 | OpenChat | VOOM | Blog | News评论 |
|--------|---------|------|------|---------|
| `桜 アプリ` | ★★★ | ★★ | ★★★ | ★ |
| `お花見 スポット` | ★★★ | ★★★ | ★★ | ★★ |
| `桜 情報 ない` | ★★ | ★ | ★ | ★★★ |
| `花の名前 調べる` | ★★ | ★★ | ★ | ★ |
| `開花 予想 外れた` | ★★ | ★ | ★ | ★★★ |

> ★★★ 该表面最容易找到此类内容 / ★ 较少出现

### 8.3 竞品全平台追踪模板

```
竞品：[App名称]
检索时间：____

LINE OpenChat
  提及数量：____
  典型正面评价：
  典型负面评价：
  推荐场景描述：

LINE VOOM
  相关帖子数量（估算）：____
  内容类型（使用教程/分享截图/吐槽）：

LINE Blog
  相关文章数量（Google site: 检索）：____
  高权重文章标题：

LINE News 评论
  出现的文章类型：____
  评论情感倾向：正向 / 负向 / 中性 = __ / __ / __

综合口碑评分（主观）：★___/5
核心差异化感知：
```

---

## 9. 数据采集方式

### 9.1 手动采集（推荐优先）

LINE 的数据封闭性决定了**手动田野调查是核心方法**，技术采集为辅助。

**OpenChat 田野调查流程**

```
Step 1：发现与筛选
  → App 内搜索目标关键词，列出候选群组
  → 筛选标准：成员数 > 200、最近 7 天有发言、主题明确

Step 2：加入与潜伏（Lurking）
  → 加入前设置 OpenChat 专属昵称（保护主账号隐私）
  → 建议每类群组加入 3–5 个，覆盖不同地域和规模

Step 3：系统化记录
  → 截图 + 手动记录关键发言（含时间戳）
  → 重点记录：工具提及、痛点表达、信息请求与回复

Step 4：访谈机会识别
  → 发现"信息提供者型"活跃用户 → 可私信寻求访谈意愿
  → 发现典型重度用户行为 → 记录用户画像特征
```

**时间成本估算**

| 活动 | 时间投入 | 产出 |
|------|---------|------|
| 群组发现与筛选 | 2–3 小时 | 10–15 个目标群组 |
| 加入并初步观察 | 1 小时/群 × 5 | 5 个深度追踪群组 |
| 花期内持续观察 | 30 分钟/天 × 30 天 | 完整花期数据 |
| Blog / News 检索 | 4–6 小时 | 50–80 篇有价值内容 |

---

### 9.2 技术采集方案

> ⚠️ LINE 没有公开研究用 API。以下技术方案均针对**可公开访问的网页内容**，请严格遵守 LINE ToS 及相关法律。

**LINE Blog 采集（Google 索引页面）**

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from datetime import datetime

def search_lineblog(keyword: str, max_results: int = 30) -> list:
    """通过 Google 搜索 LINE Blog 相关内容"""
    from googlesearch import search  # pip install googlesearch-python
    
    results = []
    query = f"site:lineblog.me {keyword}"
    
    for url in search(query, num_results=max_results, lang="ja"):
        if "lineblog.me" in url:
            results.append(url)
        time.sleep(1)
    
    return results


def fetch_lineblog_post(url: str) -> dict:
    """提取单篇 LINE Blog 文章内容"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "Accept-Language": "ja-JP,ja;q=0.9"
    }
    
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")
        
        title   = soup.select_one("h1.article-title, .blog-article-title")
        body    = soup.select_one(".article-body, .blog-article-body")
        date    = soup.select_one("time, .date, .article-date")
        author  = soup.select_one(".author-name, .blog-author")
        comments = soup.select(".comment-body, .comment-content")
        
        return {
            "url": url,
            "title": title.get_text(strip=True) if title else "",
            "body": body.get_text(strip=True) if body else "",
            "date": date.get_text(strip=True) if date else "",
            "author": author.get_text(strip=True) if author else "",
            "comment_count": len(comments),
            "comments": [c.get_text(strip=True) for c in comments[:10]],
            "fetched_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        print(f"采集失败 {url}: {e}")
        return {}


# 批量采集入口
KEYWORDS = [
    "桜 アプリ おすすめ",
    "お花見 スポット レポート",
    "GreenSnap 使い方",
    "桜 開花情報 アプリ",
]

all_posts = []
for kw in KEYWORDS:
    print(f"搜索: {kw}")
    urls = search_lineblog(kw)
    for url in urls:
        post = fetch_lineblog_post(url)
        if post.get("body") and len(post["body"]) > 200:
            post["search_keyword"] = kw
            all_posts.append(post)
        time.sleep(2)

df = pd.DataFrame(all_posts)
df.drop_duplicates(subset="url", inplace=True)
df.to_csv(f"lineblog_{datetime.now().strftime('%Y%m%d')}.csv",
          index=False, encoding="utf-8-sig")
print(f"采集完成，共 {len(df)} 篇文章")
```

---

**LINE News 评论采集**

```python
def fetch_linenews_comments(article_url: str) -> list:
    """采集 LINE News 文章评论（网页版可访问部分）"""
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
                      "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                      "Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "ja-JP,ja;q=0.9",
    }
    
    comments = []
    try:
        resp = requests.get(article_url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")
        # LINE News 评论选择器（随版本变化，需定期验证）
        for el in soup.select(".comment, [class*='Comment']"):
            text = el.get_text(strip=True)
            if len(text) > 10:
                comments.append({"text": text, "article_url": article_url})
    except Exception as e:
        print(f"评论采集失败: {e}")
    
    return comments


def find_linenews_articles(keyword: str, num: int = 20) -> list:
    """通过 Google 发现 LINE News 目标文章"""
    from googlesearch import search
    query = f"site:news.line.me {keyword}"
    return [url for url in search(query, num_results=num, lang="ja")
            if "news.line.me" in url]
```

---

**OpenChat 结构化记录工具（手动观察辅助）**

```python
import json
from datetime import datetime

class OpenChatObservation:
    """OpenChat 手动观察记录（OpenChat 无 API，此为记录辅助工具）"""
    
    def __init__(self, group_name: str, group_url: str, member_count: int):
        self.group_name   = group_name
        self.group_url    = group_url
        self.member_count = member_count
        self.observations = []
    
    def add_observation(self,
                        content: str,        # 发言摘要（非原文，隐私保护）
                        category: str,       # tool_mention / pain_point / recommendation / behavior
                        sentiment: str,      # positive / negative / neutral
                        tool_mentioned: str = "",
                        notes: str = ""):
        self.observations.append({
            "timestamp": datetime.now().isoformat(),
            "content_summary": content,
            "category": category,
            "sentiment": sentiment,
            "tool_mentioned": tool_mentioned,
            "notes": notes
        })
    
    def export(self, path: str):
        data = {
            "group_name": self.group_name,
            "group_url": self.group_url,
            "member_count": self.member_count,
            "total_observations": len(self.observations),
            "observations": self.observations
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"已导出 {len(self.observations)} 条观察记录 → {path}")


# 使用示例
obs = OpenChatObservation(
    group_name="桜前線2024情報共有",
    group_url="https://line.me/ti/g2/xxxx",
    member_count=1240
)
obs.add_observation(
    content="用户询问推荐的开花预测App，3个回复均提到ウェザーニュース",
    category="tool_mention",
    sentiment="positive",
    tool_mentioned="ウェザーニュース",
    notes="工具推荐场景：出行前信息获取"
)
obs.export("openchat_observation_20240330.json")
```

---

## 10. 分析框架

### 10.1 LINE vs X 用户声音对比

```
同一痛点在两平台的表达差异：

维度               LINE 表达特征                X 表达特征
-----------------------------------------------------------------
语气               口语、随意                   精炼、有展示意识
情绪表达           直接（私密/半私密环境）       情绪化但有自我审查
信息密度           OpenChat 高密度问答           单向广播
年龄层信号         40–60 岁用户声音更多          18–35 岁为主
工具提及方式       "〇〇使った？"（询问式）      "〇〇おすすめ"（推荐式）
内容深度           Blog 层可获得最深度叙述        普遍较浅
```

### 10.2 工具使用场景识别矩阵

```
[场景 A：出行前决策]
  触发：想去赏花但不确定时机
  平台：OpenChat（询问）/ News（被动获知）
  工具需求：开花进度 + 天气预测组合

[场景 B：实地判断]
  触发：到了现场想确认最佳拍照地点
  平台：VOOM（实时分享）/ OpenChat（实时询问）
  工具需求：实时人流 + 景点内导览

[场景 C：花卉识别]
  触发：看到不认识的花想知道名字
  平台：OpenChat（发图问问）/ Blog（游记中查阅）
  工具需求：拍照识别 + 花卉知识

[场景 D：分享留念]
  触发：想把赏花体验分享给家人/朋友
  平台：VOOM / LINE 私人聊天（不可研究）
  工具需求：修图 + 地点标注 + 一键分享

[场景 E：规划准备]
  触发：花期前 2–4 周规划出行
  平台：Blog（看攻略）/ OpenChat（问建议）
  工具需求：开花预测 + 景点攻略聚合
```

### 10.3 竞品口碑跨表面评分模型

```python
def calculate_brand_score(mentions: list) -> dict:
    """
    基于 LINE 各表面提及数据计算竞品口碑评分
    
    mentions: list of dict
      - platform: openchat / voom / blog / news_comment
      - sentiment: positive / negative / neutral
      - context: recommendation / complaint / question / mention
    """
    weights = {
        "openchat": 1.5,   # 对话中主动推荐权重最高
        "blog": 1.3,       # 长篇评测可信度高
        "news_comment": 1.0,
        "voom": 0.8
    }
    sentiment_scores   = {"positive": 1, "neutral": 0, "negative": -1}
    context_multipliers = {
        "recommendation": 1.5,
        "complaint": 1.3,  # 负面放大
        "question": 0.8,
        "mention": 1.0
    }
    
    total_score, total_weight = 0, 0
    for m in mentions:
        w = weights.get(m["platform"], 1.0)
        s = sentiment_scores.get(m["sentiment"], 0)
        c = context_multipliers.get(m["context"], 1.0)
        total_score  += w * s * c
        total_weight += w
    
    return {
        "normalized_score": round(total_score / total_weight, 3) if total_weight > 0 else 0,
        "total_mentions": len(mentions),
        "positive_rate": round(sum(1 for m in mentions if m["sentiment"] == "positive") / len(mentions), 2),
        "platform_distribution": {p: sum(1 for m in mentions if m["platform"] == p) for p in weights}
    }
```

---

## 11. 季节性采集日历

### 樱花季完整日历

| 时间段 | 主要采集表面 | 关键词重点 | 预期数据量 |
|--------|------------|-----------|-----------|
| **2 月上旬** | News | `桜 開花予想 早い` | 低 |
| **2 月下旬** | News + Blog | `桜前線 2024 予測` | 低→中 |
| **3 月上旬** | OpenChat + News | `桜 東京 いつ` `開花 アプリ` | 中 |
| **3 月中旬** | OpenChat + VOOM | `桜 咲いた` `お花見 計画` | 中→高 |
| **3 月下旬** ⭐ | **全表面** | `桜 満開` `お花見 行ってきた` | **峰值** |
| **4 月上旬** ⭐ | **全表面** | `桜 見頃` `花見 レポート` | **峰值** |
| **4 月中旬** | VOOM + Blog | `桜 散り始め` `お花見 振り返り` | 高→中 |
| **4 月下旬** | Blog + News | `来年こそ` `アプリ 感想` | 中→低 |

> ⭐ 重点采集时间窗口，建议增加至每日采集

### 全年监控计划

```
常态监控（每月 1 次）：
  → OpenChat：花卉识别 / 植物 App 相关群组
  → Blog：site:lineblog.me GreenSnap OR ハナノナ

季前预热（花期前 6 周起）：
  → News：每周采集开花预测相关报道评论
  → OpenChat：加入地域赏花群，开始潜伏观察

花期高峰（3 周）：
  → 每日记录 OpenChat 核心群组动态
  → VOOM：每日采集高互动赏花内容
  → 追踪竞品相关讨论

花期后复盘（2 周）：
  → Blog：采集游记和评测
  → 整理 OpenChat 观察记录
  → 完成竞品口碑报告
```

---

## 12. 与 X 平台的互补关系

### 研究方法互补矩阵

| 研究问题 | 首选平台 | 原因 |
|---------|---------|------|
| 实时开花进度舆情 | **X** | 推文实时性更强，量更大 |
| 40 岁以上用户需求 | **LINE** | 该年龄段 LINE 使用频率远高于 X |
| 工具使用真实场景 | **LINE OpenChat** | 对话式询问更反映真实决策 |
| KOL 观点与传播 | **X** | 转发机制让 KOL 内容可量化 |
| 深度用户游记 | **LINE Blog** | 篇幅更长，体验描述更详细 |
| 竞品即时口碑 | **X** | 实时监控更敏捷 |
| 竞品深度评测 | **LINE Blog** | 内容深度更强 |
| 全年龄层覆盖最广 | **LINE News 评论** | 全年龄层最均衡 |
| 视觉内容分析 | **LINE VOOM** | 图片/视频内容丰富 |
| 情感贴纸符号研究 | **LINE Creators** | X 无等价数据源 |

### 双平台联合研究工作流

```
Phase 1：用 X 快速发现高频主题（3 天）
  → 抓取花期推文，提炼 Top 20 讨论主题
  → 识别竞品名称、痛点关键词

Phase 2：用 LINE 深度验证（2–3 周）
  → 将 X 发现的主题带入 OpenChat 观察
  → 验证：这些主题在私密对话中是否同样高频？
  → 补充：X 看不到的 40+ 用户需求、家庭决策场景

Phase 3：综合交叉分析（1 周）
  → 整合两平台发现，识别一致信号（高置信度）
  → 标注差异信号（不同平台/年龄层的需求差异）
  → 输出用户研究报告
```

---

## 13. 数据清洗与标注建议

### 13.1 LINE 数据特有清洗规则

```python
import re

def clean_line_text(text: str, source: str = "openchat") -> str:
    """LINE 平台文本清洗（针对日语口语特征）"""
    
    # 去除 LINE 特有媒体占位符
    text = re.sub(r'\[スタンプ\]|\[写真\]|\[動画\]|\[ボイスメッセージ\]', '', text)
    # 去除 URL
    text = re.sub(r'https?://\S+', '', text)
    # 全角数字转半角
    text = text.translate(str.maketrans('０１２３４５６７８９', '0123456789'))
    # 压缩多余换行
    text = re.sub(r'\n{3,}', '\n\n', text)
    # OpenChat 系统提示去除
    if source == "openchat":
        text = re.sub(r'.+(さんが参加しました|さんが退出しました)', '', text)
    
    return text.strip()


def is_meaningful(text: str, min_chars: int = 15) -> bool:
    """过滤过短或无信息量内容"""
    clean = re.sub(r'[！？!?。、…・\s\n]', '', text)
    return len(clean) >= min_chars
```

### 13.2 标注维度表

```
LINE 平台内容标注维度：

[来源平台]
  OC = OpenChat
  VM = VOOM
  BL = Blog
  NC = News Comment

[内容类型]
  Q = 提问/信息请求
  A = 回答/信息提供
  E = 体验分享（主动）
  R = 评测/推荐
  C = 抱怨/痛点

[信息维度]（多选）
  □ 开花时机（いつ系）
  □ 地点选择（どこ系）
  □ 工具/App
  □ 天气因素
  □ 人流/拥挤
  □ 交通/停车
  □ 同行者（家族/友人/一人）

[竞品提及]
  GS = GreenSnap
  HN = ハナノナ
  WN = ウェザーニュース
  PT = PictureThis
  OT = その他（记录具体名称）
  NA = 无竞品提及

[情感极性]
  +1 = 正向  /  0 = 中性  /  -1 = 负向
```

---

## 14. 输出模板

```markdown
## LINE 平台赏花用户研究报告

**研究周期**：____
**覆盖表面**：OpenChat / VOOM / Blog / News评论
**有效数据量**：
  - OpenChat 观察记录：____ 条
  - Blog 文章：____ 篇
  - News 评论：____ 条
  - VOOM 内容：____ 条

---

### 一、OpenChat 核心发现

**追踪群组列表**

| 群组名称 | 成员数 | 活跃度 | 核心用户类型 |
|---------|-------|--------|------------|

**高频信息需求 TOP5**
1. ____
2. ____

**工具提及频次排名**

| 工具 | 提及次数 | 情感倾向 | 核心使用场景 |
|------|---------|---------|------------|

---

### 二、LINE Blog 深度洞察

**高价值文章摘要**

| 标题 | 发布日期 | 评论数 | 核心观点 |
|------|---------|-------|---------|

**用户决策路径重建**（基于游记内容）
1. ____

---

### 三、LINE News 评论舆情

| 话题类型 | 正向% | 负向% | 核心痛点 |
|---------|------|------|---------|

---

### 四、X vs LINE 对比洞察

| 维度 | X 发现 | LINE 发现 | 结论 |
|------|-------|----------|------|

---

### 五、产品机会建议
1. ____
2. ____
```

---

## 15. 工具与资源汇总

| 类型 | 工具 | 链接 | 用途 |
|------|------|------|------|
| **OpenChat 入口** | LINE OpenChat 官网 | openchat.line.me | 群组发现与加入 |
| **Blog 搜索** | LINE Blog | lineblog.me | 直接站内搜索 |
| **News 搜索** | LINE News | news.line.me | 新闻评论采集 |
| **贴纸商店** | LINE Store | store.line.me | 情感符号研究 |
| **站内搜索增强** | Google `site:` 语法 | google.com | Blog/News 站内检索 |
| **跨平台聚合** | Social Search | sns-search.com | LINE + X 关键词验证 |
| **日语分词** | fugashi | pypi.org/project/fugashi | 形态素分析 |
| **情感分析** | oseti | pypi.org/project/oseti | 极性词典 |
| **HTTP 采集** | httpx | pypi.org/project/httpx | 异步请求 |
| **HTML 解析** | BeautifulSoup4 | pypi.org/project/beautifulsoup4 | 网页解析 |
| **数据整理** | pandas | pypi.org/project/pandas | 清洗与统计 |
| **Blog 文章发现** | googlesearch-python | pypi.org/project/googlesearch-python | Google 搜索封装 |

---

## 16. 注意事项与合规提示

### LINE ToS 关键约束

> ⚠️ 以下为研究性提示，正式商业项目请咨询法律顾问。

1. **OpenChat 内容**：允许公开加入，但成员发言属于用户生成内容，引用时须脱敏，不得以可识别个人的方式公开原文。

2. **LINE API 限制**：LINE Messaging API 仅用于机器人与用户通讯，**不提供内容检索或用户数据采集接口**。任何宣称能获取 LINE 私聊内容的第三方工具均违反 ToS。

3. **Blog / News 采集**：遵守 `robots.txt`，采集频率不超过每 2 秒一次请求，不进行大规模并发爬取。

4. **个人情報保護法（2022 年修订）**：处理日本用户数据时需特别注意匿名化要求。

### 研究伦理建议

```
✓ 以"观察者"而非"参与者"身份进入 OpenChat 群组
✓ 引用具体发言时在文档中进行匿名化处理
✓ 不在群组内进行诱导性提问影响自然讨论
✓ 访谈潜在受访者时，明确告知研究目的
✗ 不采集、存储任何用户的个人识别信息
✗ 不将采集数据用于训练 AI 模型（除非有明确授权）
```

### 方法论局限性

- LINE 私聊（平台最大用量）完全不可研究，存在系统性盲区
- OpenChat 用户有一定技术主动性偏差，不代表所有 LINE 赏花用户
- Blog 内容存在 KOL 商业合作（`#PR` 标注）干扰，需识别并剔除
- 手动田野观察受研究者主观判断影响，建议 2 人以上交叉标注

---

*本文档最后更新：2024 年 · LINE 平台功能及隐私政策更新频繁，使用前请以 LINE 官方文档为准。*  
*配套文档：《X（Twitter）日本赏花用户研究检索方案》*
