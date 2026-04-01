# 平台数据检索与爬取策略
## 通过分析各平台真实发帖与图片，优化 APP 水印分享功能

> **文档定位**：围绕 6.2「不同平台的水印传播策略」，系统梳理如何检索、采集、分析各平台的真实用户发帖与图片，将洞察转化为 APP 分享功能的具体优化方向。  
> **覆盖平台**：X（Twitter）/ Instagram / LINE / 小红书 / TikTok  
> **核心问题**：用户在每个平台上真正怎么分享赏樱照片？我们的水印和分享流程与他们的习惯匹配吗？  
> **更新日期**：2026 年 3 月

---

## 目录

1. [研究框架：从数据到功能优化的完整链路](#一研究框架从数据到功能优化的完整链路)
2. [X（Twitter）：检索真实行为与痛点](#二x-twitter检索真实行为与痛点)
3. [Instagram：分析视觉内容与构图习惯](#三instagram分析视觉内容与构图习惯)
4. [LINE：挖掘封闭生态中的分享模式](#四line挖掘封闭生态中的分享模式)
5. [小红书：解析图文结构与水印接受度](#五小红书解析图文结构与水印接受度)
6. [TikTok / 抖音海外版：短视频帧与水印叠加分析](#六tiktok--抖音海外版短视频帧与水印叠加分析)
7. [跨平台图像分析：水印视觉习惯研究](#七跨平台图像分析水印视觉习惯研究)
8. [数据到功能：洞察转化为具体优化项](#八数据到功能洞察转化为具体优化项)
9. [采集工具速查与合规提示](#九采集工具速查与合规提示)
10. [执行日历：花期内的滚动研究节奏](#十执行日历花期内的滚动研究节奏)

---

## 一、研究框架：从数据到功能优化的完整链路

### 1.1 研究的核心命题

每个平台有自己的内容语法、视觉美学和分享习惯。**水印的样式、位置、信息密度**必须与用户在该平台上的原生发帖习惯匹配，否则会产生「格格不入」感，让用户主动去掉水印再分享。

```
研究目标树
├── 用户在每个平台上发赏樱照片的内容形态是什么？
│   ├── 图片比例（1:1 / 4:5 / 9:16 / 横版）
│   ├── 有无叠加文字 / 贴纸 / 地理标签
│   └── 水印 / 签名 / LOGO 的接受程度
│
├── 分享时的情感动机是什么？
│   ├── 炫耀收集成果 vs 纯粹分享美景
│   ├── 即时发帖 vs 事后整理
│   └── 面向熟人圈 vs 面向陌生人
│
└── 现有分享流程的摩擦点在哪里？
    ├── 导出尺寸与平台要求不符
    ├── 水印位置遮挡主体
    └── 分享步骤过多，用户中途放弃
```

### 1.2 研究层次与数据类型

| 层次 | 数据类型 | 采集方式 | 产出 |
|------|---------|---------|------|
| **表层** | 发帖量、互动数、热门标签 | API / 爬虫 | 内容趋势与热度地图 |
| **中层** | 图片构图、水印样式、Caption 结构 | 图像分析 + 文本分析 | 平台视觉语法 |
| **深层** | 用户分享动机、工具提及、痛点描述 | 人工标注 + 质性分析 | 功能优化方向 |

---

## 二、X（Twitter）：检索真实行为与痛点

### 2.1 为什么 X 是首选研究平台

日本是 X 全球最活跃市场之一，月活约 6,700 万，用户习惯在 X 上记录日常"碎碎念"——包括刚从树下回来的实时感受。相比 Instagram 的精修内容，X 更多反映未经过滤的真实体验，是挖掘**分享行为原始动机**的最佳入口。

### 2.2 核心检索语法

**① 找到真实分享行为（含图片的打卡帖）**

```
# 有图的即时打卡（最接近真实分享动机）
桜 撮った lang:ja has:images -is:retweet min_faves:15
お花見 今日 lang:ja has:images -is:retweet
桜 写真 撮影 lang:ja has:images min_faves:20

# 找到「分享」行为本身的讨论
桜 シェア OR 投稿 OR 載せた lang:ja has:images
桜 インスタ OR Twitter OR LINE 投稿した lang:ja

# 找带有地点水印/照片水印的帖子
桜 写真 (スタンプ OR 印 OR ロゴ OR watermark) lang:ja
桜 アプリ 写真 加工 lang:ja
```

**② 挖掘水印接受度讨论**

```
# 水印相关讨论（正负向都要）
写真 透かし lang:ja
写真 ロゴ 邪魔 lang:ja          # 「水印很烦」的负面反馈
写真 スタンプ かわいい lang:ja   # 「贴纸/印记好看」的正面反馈
(打刻 OR 記録 OR スタンプ) 桜 写真 lang:ja
```

**③ 找分享平台选择的线索**

```
# 用户自述发哪里
桜 写真 (Instagram OR インスタ OR LINE) lang:ja
お花見 (どこに投稿 OR 何に上げた) lang:ja

# 找到「嫌いな写真加工」类讨论
写真 (加工 OR フィルター OR 編集) 好き OR 嫌い lang:ja
```

### 2.3 Python 批量采集（tweepy）

```python
import tweepy
import pandas as pd
from datetime import datetime

client = tweepy.Client(bearer_token="YOUR_BEARER_TOKEN", wait_on_rate_limit=True)

QUERIES = [
    # (查询语法, 分析标签)
    ("桜 写真 撮った lang:ja has:images -is:retweet min_faves:15", "photo_sharing"),
    ("桜 インスタ OR LINE 投稿 lang:ja -is:retweet", "platform_choice"),
    ("写真 透かし lang:ja", "watermark_discussion"),
    ("桜 アプリ 写真 加工 lang:ja -is:retweet", "app_photo_edit"),
    ("お花見 残念 OR 失敗 lang:ja -is:retweet", "pain_points"),
]

results = []
for query, label in QUERIES:
    paginator = tweepy.Paginator(
        client.search_recent_tweets,
        query=query,
        tweet_fields=["created_at", "public_metrics", "attachments"],
        media_fields=["url", "type"],
        expansions=["attachments.media_keys"],
        max_results=100
    )
    for page in paginator:
        if not page.data:
            continue
        media_map = {m.media_key: m for m in (page.includes.get("media") or [])}
        for tweet in page.data:
            # 提取图片 URL
            media_urls = []
            if tweet.attachments:
                for key in (tweet.attachments.get("media_keys") or []):
                    m = media_map.get(key)
                    if m and m.type == "photo":
                        media_urls.append(getattr(m, "url", ""))
            results.append({
                "id": tweet.id,
                "text": tweet.text,
                "created_at": tweet.created_at,
                "like_count": tweet.public_metrics["like_count"],
                "image_count": len(media_urls),
                "image_urls": "|".join(media_urls),
                "category": label,
            })

df = pd.DataFrame(results).drop_duplicates("id")
df.to_csv(f"x_sakura_sharing_{datetime.now().strftime('%Y%m%d')}.csv",
          index=False, encoding="utf-8-sig")
print(f"采集完成，共 {len(df)} 条")
```

### 2.4 分析维度与功能映射

| 分析发现 | 对应优化方向 |
|---------|------------|
| 用户发帖时大量使用横版截图 | 增加 16:9 导出尺寸预设 |
| 大量帖子含「スタンプかわいい」等正向表达 | 验证哪种水印风格最受欢迎，作为新用户默认值 |
| 「写真 透かし 邪魔」出现频率高 | 水印透明度默认值是否需要下调 |
| 用户自述「インスタにも上げた」 | 说明多平台同步需求强，需要一键多平台分享 |
| 即时发帖（"今日""今"）占比高 | 缩短从打卡到分享的操作步骤 |

---

## 三、Instagram：分析视觉内容与构图习惯

### 3.1 三级标签检索矩阵

Instagram 的研究重点是**视觉语法**——用户发赏樱照片时的构图、比例、叠加元素，以及这些习惯如何影响水印的接受方式。

```
一级标签（宏观扫描）：
  #桜 / #お花見 / #sakura / #満開
  → 用途：了解整体内容形态，观察有无水印/贴纸叠加

二级标签（场景细分）：
  #桜フォトスポット / #桜記録 / #桜コレクション
  → 用途：找到有强烈记录意识的用户，分析其照片格式偏好

三级标签（深度用户）：
  #桜パトロール / #花日記 / #桜ポートレート
  → 用途：找到摄影创作型用户，分析水印 vs 无水印的选择逻辑
```

**重要操作**：切换至「最近」标签页而非「热门」，热门页有算法偏差，最近页才是普通用户的真实发帖。

### 3.2 Instaloader 批量采集

```bash
# 安装
pip install instaloader

# 采集指定 hashtag（仅 metadata，不下载图片，节省配额）
instaloader "#桜パトロール" --no-pictures --no-videos \
  --no-video-thumbnails --max-connection-attempts 3

# 采集含图片的帖子（分析水印样式需要）
instaloader "#桜フォトスポット" --no-videos --post-filter "is_video == False"
```

```python
# 用 Instaloader 批量下载并分析图片元数据
import instaloader
import json, os

L = instaloader.Instaloader(
    download_pictures=True,
    download_videos=False,
    save_metadata=True,
    compress_json=False,
)

# 采集 hashtag 下的帖子（建议每次不超过 200 条，避免触发限流）
hashtags = ["桜パトロール", "桜コレクション", "桜フォトスポット"]

for tag in hashtags:
    posts = instaloader.Hashtag.from_name(L.context, tag).get_posts()
    count = 0
    for post in posts:
        if count >= 100:
            break
        try:
            L.download_post(post, target=f"ig_data/{tag}")
            count += 1
        except Exception as e:
            print(f"跳过: {e}")
```

### 3.3 图片视觉结构人工标注维度

对采集到的图片，按以下维度进行人工标注（每个标签各标注 50 张）：

```
【图片比例】
  □ 1:1（正方形）
  □ 4:5（竖版，Instagram Feed 标准）
  □ 9:16（Story 标准）
  □ 3:2 / 横版
  □ 其他

【叠加元素】
  □ 无任何叠加
  □ 仅地理标签（Instagram 原生位置贴纸）
  □ 文字水印 / 地点印记（第三方 APP）
  □ 品牌 Logo 水印
  □ 手绘/手写式贴纸
  □ 日期戳

【水印位置（如有）】
  □ 右下角
  □ 左下角
  □ 左上角
  □ 右上角
  □ 居中
  □ 贯穿式（斜对角）

【水印信息内容（如有）】
  □ 仅地点名
  □ 地点名 + 日期
  □ 地点名 + 品种
  □ 品牌名 + 地点
  □ 纯品牌 Logo

【照片主体类型】
  □ 纯景（无人）
  □ 人像（背影 / 正面）
  □ 特写（单朵花 / 枝条）
  □ 俯拍 / 广角全景
```

### 3.4 Story Highlights 分析（高价值信号）

Story Highlights 是用户对长期兴趣的主动归档，是判断年度仪式感的核心信号：

```
检查维度：
□ 是否有「桜」「花日記」专题 Highlight（→ 年度仪式感强）
□ 是否有多年度记录（2024桜、2025桜 → 跨年重复使用动机）
□ Highlight 封面是否使用了水印照片（→ 水印被认为有展示价值）
□ Highlights 封面的图片比例（→ 用户心目中的「代表性分享格式」）
```

### 3.5 核心洞察转化

| 分析发现 | 功能优化方向 |
|---------|------------|
| 4:5 竖版为 Feed 最主流比例 | 优先适配 1080×1350，提升导出预设的排序 |
| 地点贴纸（Instagram 原生）使用率高 | 在水印中强化地点名的视觉权重，与原生标签竞争 |
| 右下角水印占绝大多数（行业惯例） | 验证默认位置设置，无需改动 |
| 有 Highlights 的用户更可能用跨年水印 | 在 Story 格式导出时，自动加入年份字段 |
| 摄影创作型用户（#桜ポートレート）普遍不加水印 | 简约（Minimal）风格满足「不打扰画面」的需求 |

---

## 四、LINE：挖掘封闭生态中的分享模式

### 4.1 LINE 的特殊性：封闭但关键

LINE 是日本渗透率最高的通讯平台（月活 9,600 万，渗透率约 78%），但其大部分内容是私密聊天，不可爬取。研究重点集中在**四个可公开访问的区域**：

```
可研究区域优先级：

★★★  OpenChat（公开群聊）
      → 最接近论坛的数据源，可见真实的工具讨论与分享行为
      
★★   LINE VOOM（公开动态）
      → 含图片分享帖，可分析 LINE 内的视觉内容格式
      
★★   LINE Blog（公开博客）
      → 可 Google 检索，含详细游记和 APP 使用评测
      
★    LINE Creators Market（贴纸商店）
      → 分析贴纸内容可了解「LINE 用户偏好哪类视觉元素」
```

### 4.2 OpenChat 观察与检索

**入口**：LINE App → 搜索 → 切换「オープンチャット」标签 / 网页：`openchat.line.me`

**目标群组类型**：

| 搜索关键词 | 群组类型 | 研究目标 |
|----------|---------|---------|
| `桜 写真 シェア` | 摄影分享群 | 用户如何在 LINE 内分享赏樱照片 |
| `桜 アプリ 何使ってる` | 工具讨论群 | 竞品 APP 真实口碑 |
| `お花見 スポット 情報` | 赏花情报群 | 信息分享行为模式 |
| `桜 打卡 OR チェックイン` | 打卡用户群 | 打卡行为的工具使用情况 |

**群组内重点观察项**：

```
□ 成员分享照片时是否附带水印 / 地点标注
□ 照片格式：是否经过裁切或比例调整
□ 工具提及：「〇〇アプリで撮った」「〇〇で加工した」
□ 互动模式：成员看到水印后的反应（好奇 / 询问 / 忽略）
□ 分享动机描述：「記念に」「来年の参考に」「見てほしくて」
```

### 4.3 LINE Blog 系统检索（可爬取）

LINE Blog 内容可被 Google 索引，通过以下语法进行系统检索：

```
Google 搜索语法：
site:lineblog.me 桜 お花見 アプリ
site:lineblog.me "桜" "写真" "加工" 2025 OR 2026
site:lineblog.me "お花見" "スタンプ" OR "印" OR "ロゴ"

找到游记后重点提取：
□ 作者使用了哪些 APP（含赏花地图、照片编辑、识别 APP）
□ 分享照片时有无叠加水印 / 地点信息
□ 分享到哪些平台（LINE / Instagram / Twitter）
□ 照片的视觉风格与格式
```

```python
import requests
from bs4 import BeautifulSoup
import time

def search_lineblog(keyword: str, pages: int = 5):
    """通过 Google 搜索抓取 LINE Blog 相关文章 URL"""
    from googlesearch import search  # pip install googlesearch-python
    query = f"site:lineblog.me {keyword}"
    urls = list(search(query, num_results=pages * 10, lang="ja"))
    return urls

def extract_lineblog_content(url: str):
    """提取单篇 LINE Blog 文章的正文"""
    headers = {"User-Agent": "Mozilla/5.0"}
    resp = requests.get(url, headers=headers, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")
    content = soup.select_one(".article-body") or soup.select_one(".entry-content")
    return content.get_text(strip=True) if content else ""

# 采集
keywords = ["桜 お花見 アプリ 写真", "桜 スタンプ 打刻 写真", "お花見 記録 アプリ"]
for kw in keywords:
    urls = search_lineblog(kw, pages=3)
    for url in urls:
        text = extract_lineblog_content(url)
        print(url, text[:200])
        time.sleep(2)
```

### 4.4 LINE Creators Market 贴纸分析

**入口**：`store.line.me` → 搜索「桜」「花見」「お花見」

这是一个**零爬取成本的视觉偏好研究来源**：热销贴纸的设计直接反映了 LINE 用户对视觉元素的审美偏好。

```
分析维度：
□ 销量 Top 20 赏樱贴纸的视觉风格（写实 / 卡通 / 像素 / 极简）
□ 贴纸中地点信息的呈现方式（有无地名文字叠加）
□ 颜色主调（粉色系、白色系、复古色系等分布）
□ 文字内容（是否含日期 / 地点 / 花言葉）

→ 高销量贴纸的视觉特征 = LINE 用户审美的最大公约数
→ 水印设计应与之匹配而非对立
```

---

## 五、小红书：解析图文结构与水印接受度

### 5.1 检索策略

小红书面向的主要是关注日本旅行的中文用户，搜索逻辑与 Instagram 不同，**关键词 + 笔记结构**是核心分析对象。

**核心搜索词矩阵**：

```
基础搜索词（在小红书 APP 内）：
  日本赏樱打卡 / 京都樱花攻略 / 东京赏樱地图
  日本赏花 app 推荐 / 赏樱照片 技巧
  日本旅行水印 / 旅行照片打卡印记
  樱花照片 好看 / 旅拍水印 分享

进阶搜索（发现有水印的笔记）：
  赏樱 打卡 水印
  日本旅行 照片印记
  旅行记录 app 推荐 日本
```

### 5.2 笔记结构分析框架

对每篇高赞笔记（点赞数 > 500）进行结构化拆解：

```
【标题结构】
□ 是否含「打卡」「攻略」「推荐」等高流量词
□ 是否包含具体地点名（上野公园 / 哲学之道）

【图片分析（每篇前 9 张）】
□ 图片比例（小红书 Feed 默认 3:4，主图常用 1:1）
□ 是否有水印：类型（地点名 / 日期 / 品牌 / 无）
□ 水印位置分布
□ 水印风格（手写字 / 印章 / 简洁文字 / 像素）
□ 有无添加小红书原生地点贴纸

【正文分析】
□ 是否提及所用的照片编辑 APP
□ 是否提及打卡 APP
□ 用户自述分享到哪些平台

【评论区分析（Top 30 条）】
□ 是否有人询问水印是哪个 APP 做的 → 高关注度信号
□ 是否有人求攻略 / 求 APP 名称
□ 是否有「好看」「在哪加的」类评论 → 水印有传播价值
```

### 5.3 Python 爬取方案（基于公开接口）

> ⚠️ 小红书无官方 API，以下为基于公开网页的数据采集方案。采集前请确认符合平台使用条款，数据仅用于产品研究。

```python
import requests
import time
import json
from urllib.parse import quote

def search_xiaohongshu_web(keyword: str, page: int = 1):
    """
    通过小红书网页搜索获取笔记列表
    注：实际使用中可能需要处理登录态和反爬机制
    """
    url = "https://www.xiaohongshu.com/api/sns/web/v1/search/notes"
    params = {
        "keyword": keyword,
        "page": page,
        "page_size": 20,
        "sort": "hot",  # 按热度排序，也可用 time 按时间
        "note_type": 0,  # 0=全部，1=视频，2=普通
    }
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": f"https://www.xiaohongshu.com/search_result?keyword={quote(keyword)}",
    }
    # 注意：正式使用需要处理 cookie 和 sign 参数
    resp = requests.get(url, params=params, headers=headers, timeout=10)
    return resp.json() if resp.status_code == 200 else {}

# 推荐使用 Apify 的小红书爬虫（有商业授权方案）
# https://apify.com/xiaohongshu-scraper
```

**替代方案（零代码）**：使用 Apify 平台的 `xiaohongshu-scraper` 工具，输入关键词，直接导出结构化数据（标题、封面图、点赞数、评论数、用户信息）。

### 5.4 功能优化映射

| 分析发现 | 优化方向 |
|---------|---------|
| 小红书笔记封面普遍使用 3:4 竖版 | 新增 1080×1440（3:4）导出预设 |
| 评论区频繁出现「水印在哪加的」 | 水印本身加入「下载来源」提示，引流到 APP |
| 笔记中「打卡 × 攻略」组合标题的赞数最高 | 分享预设文案模板应包含地点名和攻略词 |
| 用户愿意在封面图上加大字地点名 | 「地点名」字体在水印中可适度加大 |
| 中文用户对带中文地名的水印接受度更高 | 地点数据库需同时存储日文和中文名称 |

---

## 六、TikTok / 抖音海外版：短视频帧与水印叠加分析

### 6.1 视频内容的水印分析方法

TikTok 的研究目标不同于图文平台——重点在于**封面帧的视觉结构**和**发帖文案格式**，而非全视频分析。

```
检索关键词（TikTok 搜索框）：
  sakura japan 2026
  お花見 スポット（切换日语界面）
  cherry blossom spot japan
  桜 打卡（日语用户帖）
  
搜索完成后，分析每条视频的：
□ 封面帧：是否有地点水印 / APP Logo 叠加
□ 视频左下角或右侧：是否有品牌角标
□ Caption 文字：格式模板（如「地点名 ✿ 日期 ✿ 品种」）
□ 评论区：是否有用户问「用什么 APP 拍的」
```

### 6.2 视频封面帧批量下载分析

```python
import yt_dlp  # pip install yt-dlp
import os

def download_tiktok_thumbnails(urls: list, save_dir: str = "tiktok_thumbs"):
    """批量下载 TikTok 视频封面帧"""
    os.makedirs(save_dir, exist_ok=True)
    ydl_opts = {
        "skip_download": True,
        "writethumbnail": True,
        "outtmpl": f"{save_dir}/%(id)s",
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for url in urls:
            try:
                ydl.download([url])
            except Exception as e:
                print(f"跳过 {url}: {e}")

# 使用场景：手动收集 50 条赏樱视频 URL 后批量下载封面，
# 再用图像分析工具（下方第七章）检测水印位置和样式
```

### 6.3 Caption 结构分析

TikTok 用户的 Caption 格式有很强的规律性，分析高互动帖子的 Caption 结构，可以提炼出**分享预设文案的模板**：

```
观察到的高频 Caption 格式：

日语用户：
  「📍 [地点名] 🌸 [日期] | #桜 #お花見 #桜スポット」
  「[地点名] の桜 満開です🌸 #満開 #花見 #Japan」

中文用户（日本旅行）：
  「📍 [地点名] | [日期] 赏樱打卡 | #日本旅行 #樱花季」
  「去 [地点名] 看樱花🌸 花期剩最后 3 天！」

外语用户：
  「Cherry blossoms at [Location] 🌸 Full bloom! #sakura #japan」

规律总结：
□ 地点名 + 日期 是核心必要元素（与水印高度匹配）
□ Emoji 在日语用户中使用频率极高
□ 倒计时感（"あと N 日"）的帖子互动率更高
```

---

## 七、跨平台图像分析：水印视觉习惯研究

### 7.1 建立「水印图像样本库」

从各平台采集带水印的赏樱图片，建立统一样本库用于视觉分析：

**采集目标**：每个平台各 100 张，共 500 张，时间范围限定在近 2 个花季（2025–2026）。

**筛选标准**：
- 图片包含可见的地点水印 / 印记（非平台原生贴纸）
- 照片主体为赏樱场景
- 非商业广告、非网红机构账号（聚焦普通用户）

### 7.2 自动化水印区域检测

```python
from PIL import Image
import numpy as np
import cv2
import os
from pathlib import Path

def detect_watermark_region(image_path: str, threshold: float = 0.85):
    """
    简单检测图片中高对比度的水印区域
    返回：水印可能所在的图像角落
    """
    img = cv2.imread(image_path)
    if img is None:
        return None
    
    h, w = img.shape[:2]
    
    # 将图片分为 9 个区域（3x3 宫格）
    regions = {
        "top_left":     img[0:h//3, 0:w//3],
        "top_center":   img[0:h//3, w//3:2*w//3],
        "top_right":    img[0:h//3, 2*w//3:w],
        "mid_left":     img[h//3:2*h//3, 0:w//3],
        "center":       img[h//3:2*h//3, w//3:2*w//3],
        "mid_right":    img[h//3:2*h//3, 2*w//3:w],
        "bot_left":     img[2*h//3:h, 0:w//3],
        "bot_center":   img[2*h//3:h, w//3:2*w//3],
        "bot_right":    img[2*h//3:h, 2*w//3:w],
    }
    
    # 检测各区域的边缘密度（水印区域边缘线条更密集）
    edge_density = {}
    for name, region in regions.items():
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density[name] = np.sum(edges > 0) / edges.size
    
    # 返回边缘密度最高的区域（可能是水印位置）
    suspected_region = max(edge_density, key=edge_density.get)
    return suspected_region, edge_density

# 批量分析样本库
results = []
for img_file in Path("watermark_samples").glob("*.jpg"):
    region, density = detect_watermark_region(str(img_file))
    results.append({
        "file": img_file.name,
        "suspected_watermark_region": region,
        "edge_density": density
    })

import pandas as pd
df = pd.DataFrame(results)
print(df["suspected_watermark_region"].value_counts())
# 输出各区域水印出现频次 → 验证右下角是否确实为最常见位置
```

### 7.3 图片比例分布统计

```python
from PIL import Image
from pathlib import Path
import pandas as pd

def get_aspect_ratio_label(w: int, h: int) -> str:
    ratio = w / h
    if abs(ratio - 1.0) < 0.05:   return "1:1"
    elif abs(ratio - 0.8) < 0.05: return "4:5"
    elif abs(ratio - 0.56) < 0.05: return "9:16"
    elif abs(ratio - 1.33) < 0.05: return "4:3"
    elif abs(ratio - 1.78) < 0.05: return "16:9"
    elif ratio < 0.8:              return "竖版其他"
    else:                          return "横版其他"

ratios = []
for platform in ["x", "instagram", "xiaohongshu", "tiktok"]:
    for img_file in Path(f"samples/{platform}").glob("*.jpg"):
        try:
            with Image.open(img_file) as img:
                w, h = img.size
                ratios.append({
                    "platform": platform,
                    "width": w,
                    "height": h,
                    "ratio_label": get_aspect_ratio_label(w, h),
                })
        except:
            pass

df = pd.DataFrame(ratios)
print(df.groupby(["platform", "ratio_label"]).size().unstack(fill_value=0))
```

### 7.4 颜色与视觉风格聚类

```python
from sklearn.cluster import KMeans
import numpy as np
from PIL import Image

def extract_watermark_dominant_colors(image_path: str, crop_region: str = "bot_right"):
    """提取水印区域的主色调"""
    img = Image.open(image_path).convert("RGB")
    w, h = img.size
    
    crops = {
        "bot_right": (2*w//3, 2*h//3, w, h),
        "bot_left":  (0, 2*h//3, w//3, h),
    }
    region = img.crop(crops.get(crop_region, crops["bot_right"]))
    pixels = np.array(region).reshape(-1, 3)
    
    # K-Means 提取主色（k=3）
    kmeans = KMeans(n_clusters=3, n_init=5, random_state=42)
    kmeans.fit(pixels)
    dominant_colors = kmeans.cluster_centers_.astype(int)
    return dominant_colors.tolist()

# 分析 100 张样本的水印颜色分布
# 目标：判断用户偏好白底黑字、透明叠加还是彩色印记
```

---

## 八、数据到功能：洞察转化为具体优化项

### 8.1 分享尺寸预设优化

基于各平台图片比例分布统计，将导出尺寸预设按优先级排序：

```
当前预设排序（默认）→ 优化后排序

优化前：
  1. 保存到相册（原始比例）
  2. Instagram Feed（4:5）
  3. LINE（1:1）

优化后（基于数据）：
  1. 保存到相册（原始比例）← 仍为第一位
  2. [平台选择后自动判断] ← 新增：选平台后自动推荐对应尺寸
  3. Instagram Feed（4:5）1080×1350
  4. 小红书（3:4）1080×1440  ← 新增
  5. LINE（1:1）1080×1080
  6. X（16:9）1200×675
  7. Story（9:16）1080×1920
```

### 8.2 水印默认风格调整

```
基于各平台数据的风格匹配建议：

X（Twitter）用户         → 像素（Pixel）风格
  原因：X 用户偏好信息密度高、有话题感的内容

Instagram 用户           → 印章（Seal）或简约（Minimal）风格
  原因：Instagram 视觉精致感优先，轻量水印不破坏构图

LINE 内分享              → 印章（Seal）风格
  原因：与 LINE 贴纸的视觉语法接近，用户接受度高

小红书用户               → 像素（Pixel）风格（含中文地名）
  原因：小红书用户对带信息量的旅行印记接受度最高
  
TikTok                   → 简约（Minimal）风格
  原因：视频封面水印需轻，不抢夺主体注意力
```

### 8.3 分享预设文案自动生成

基于各平台 Caption 格式分析，在分享时自动生成平台适配的预设文案：

```python
def generate_caption(location: str, date: str, species: str, platform: str) -> str:
    """根据平台生成分享预设文案"""
    templates = {
        "x": f"🌸 {location} の桜、今日満開でした。\n{date} · {species}\n#桜 #お花見2026 #PixelHerbarium",
        "instagram": f"📍 {location}\n{species} が満開 🌸\n\n#桜 #お花見 #桜スポット #sakura #hanami",
        "line": f"{location}の桜、今日見てきました🌸 {species}、本当に綺麗でした。",
        "xiaohongshu": f"📍 {location} | {date} 赏樱打卡 🌸\n{species} 正值满开，花期还剩约 3–5 天！\n#日本旅行 #赏樱攻略 #PixelHerbarium",
        "tiktok": f"Cherry blossoms at {location} 🌸 Full bloom! {date} #sakura #japan #hanami",
    }
    return templates.get(platform, templates["instagram"])
```

### 8.4 水印位置避让规则更新

基于图像分析发现的各平台安全区域：

| 平台 | 需要避让的区域 | 原因 |
|------|-------------|------|
| Instagram Story | 顶部 250px + 底部 250px | 系统 UI 交互区 |
| X | 图片中心 1/3 区域 | X 时间线预览会裁切边缘 |
| 小红书 | 右下角（已有原生点赞区域） | 与平台 UI 重叠 |
| LINE | 无特殊限制 | LINE 内图片以原比例展示 |
| TikTok | 左侧 1/4（评论 / 关注按钮区） | 竖版视频右侧为交互区 |

---

## 九、采集工具速查与合规提示

### 9.1 工具矩阵

| 平台 | 工具 | 用途 | 成本 | 技术门槛 |
|------|------|------|------|---------|
| **X** | tweepy | 官方 API 采集 | 免费层可用 | 中 |
| **X** | Yahoo!リアルタイム検索 | 网页快速检索 | 免费 | 低 |
| **Instagram** | Instaloader | metadata + 图片下载 | 免费开源 | 中 |
| **Instagram** | Apify Instagram Scraper | GUI 操作批量抓取 | 按量付费 | 低 |
| **Instagram** | Phantombuster | 定时周期监控 | 有免费额度 | 低 |
| **LINE** | 手动 OpenChat 观察 | 群聊观察 | 免费 | 低 |
| **LINE Blog** | requests + BeautifulSoup | 文章内容抓取 | 免费 | 中 |
| **小红书** | Apify 小红书爬虫 | 笔记结构化数据 | 按量付费 | 低 |
| **TikTok** | yt-dlp | 视频封面帧下载 | 免费开源 | 中 |
| **图像分析** | OpenCV / PIL | 水印区域检测 | 免费开源 | 中高 |
| **文本分析** | fugashi / janome | 日语分词 | 免费开源 | 中 |
| **情感分析** | oseti | 日语情感极性 | 免费开源 | 中 |

### 9.2 合规边界清单

> ⚠️ 以下为一般性提示，具体合规要求请在实施前咨询法律顾问。

```
✅ 可以做：
□ 通过官方 API 采集平台授权的公开数据
□ 用于产品研究和用户需求分析
□ 发布研究结论（不含原始个人数据）
□ 匿名化后引用有代表性的用户内容

❌ 不可以做：
□ 将采集的数据出售或商业转让
□ 以可识别个人身份的方式公开原始推文 / 帖子
□ 爬取有明确机器人保护（robots.txt 禁止）的页面
□ 使用采集的图片用于模型训练（需额外授权）
□ 在无授权情况下存储完整的推文文本超过 X ToS 规定期限
```

---

## 十、执行日历：花期内的滚动研究节奏

### 10.1 三阶段滚动采集计划

```
【阶段一：花期前 2 周（3 月上旬）】— 信息需求期
重点：用户在计划赏樱时如何使用工具 / 选择分享平台

采集任务：
□ X：搜索「桜 アプリ おすすめ」「桜 どこで見る」，采集 200 条
□ Instagram：抓取 #桜前線 近 7 天帖子 metadata，分析发帖节奏
□ LINE OpenChat：加入 3–5 个赏花群，观察信息流通模式

---

【阶段二：满开高峰（3 月下旬–4 月上旬）】— 行为数据最密集期
重点：真实打卡分享行为，水印在野外实际的呈现效果

采集任务：
□ X：每日采集「桜 写真 has:images lang:ja」，追踪实时趋势
□ Instagram：下载 #桜フォトスポット 新增图片，建立视觉样本库
□ 小红书：采集「日本赏樱打卡」高赞笔记，分析水印接受度
□ TikTok：收集 20 条赏樱视频，下载封面帧分析

---

【阶段三：花期结束后 2 周（4 月中下旬）】— 回顾沉淀期
重点：用户对分享体验的回顾与反思，发现功能痛点

采集任务：
□ X：搜索「桜 写真 後悔 OR もっと」「桜 アプリ よかった OR だめだった」
□ LINE Blog：收集 2026 年赏樱游记，提取工具使用描述
□ 综合分析：整理三阶段数据，输出功能优化报告
```

### 10.2 每轮研究输出模板

```markdown
## 第 [N] 轮平台数据研究报告
采集时间：____  |  平台：____  |  样本量：____ 条

### 水印相关核心发现
1. ____（支持证据：X 条相关帖子）
2. ____

### 分享行为发现
1. ____
2. ____

### 本轮最高互动帖子的共同特征
- 图片比例：____
- 水印：有 / 无 / 风格____
- Caption 格式：____

### 下一版本建议优化项
| 优先级 | 功能项 | 数据依据 |
|--------|--------|---------|
| P0 | ____ | ____ 条帖子提及 |
| P1 | ____ | ____ |
```

---

*文档版本：v1.0 | 整理日期：2026 年 3 月*  
*参考资料：X 日本赏花用户研究检索方案（v1.0）、LINE 平台日本赏花用户研究检索方案（v1.0）、Instagram 季节性自然内容检索方案（v1.0）*

> 📌 **核心原则**：数据的价值不在于量，而在于能否驱动功能决策。每轮研究结束后，必须明确输出至少 3 条可执行的产品优化建议，否则采集工作无效。

🌸 *每一张被分享的水印照片都是一次数据点——让数据告诉我们下一版本该做什么。*
