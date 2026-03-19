# 🌸 Weathernews 樱花观景地点数据爬取与 APP 集成操作指南

> **目标**：从 `https://weathernews.jp/sakura/` 爬取约 1400 个樱花观景地点（名称、坐标、地区等），整理为结构化数据，导入 APP，用于给用户照片添加地点 Logo。

---

## 📋 总体流程概览

```
第一步：分析网站结构  →  第二步：爬取数据  →  第三步：清洗整理  →  第四步：设计数据格式  →  第五步：生成 Logo  →  第六步：导入 APP
```

---

## 第一步：分析目标网站结构

### 1.1 手动侦察页面

1. 用 Chrome / Firefox 打开 `https://weathernews.jp/sakura/`
2. 按 `F12` 打开开发者工具
3. 切换到 **Network（网络）** 选项卡，刷新页面
4. 筛选 `XHR` / `Fetch` 请求，查看是否有 JSON API 接口返回地点数据

> **重点关注**：
> - 请求 URL 中含 `spot`、`location`、`list`、`point` 关键词的接口
> - 响应体为 JSON，包含地点名称、纬度/经度字段的接口

### 1.2 检查页面 HTML 结构

```bash
# 使用 curl 快速查看 HTML 骨架
curl -s "https://weathernews.jp/sakura/" | grep -i "spot\|location\|lat\|lng\|地点" | head -50
```

### 1.3 确认数据来源类型

| 数据来源类型 | 特征 | 对应方案 |
|---|---|---|
| 直接 JSON API | Network 面板可见 XHR 请求返回地点列表 | 直接请求 API（最简单）|
| JavaScript 渲染（SPA） | HTML 中无地点信息，由 JS 动态加载 | 使用 Playwright/Selenium |
| 静态 HTML | 地点信息直接写在 HTML 中 | BeautifulSoup 解析 |

---

## 第二步：爬取数据

### 2.1 方案 A：直接调用隐藏 API（推荐，若存在）

若在 Network 面板发现类似以下接口：

```
https://weathernews.jp/sakura/api/spots.json
https://weathernews.jp/sakura/api/list?type=all
```

则可直接用 Python 获取：

```python
import requests
import json

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://weathernews.jp/sakura/",
    "Accept": "application/json"
}

# 替换为实际发现的 API URL
api_url = "https://weathernews.jp/sakura/api/spots.json"

response = requests.get(api_url, headers=headers)
data = response.json()

# 保存原始数据
with open("sakura_raw.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"共获取地点数：{len(data)}")
```

---

### 2.2 方案 B：Playwright 动态渲染爬取（JS 渲染页面）

#### 安装依赖

```bash
pip install playwright beautifulsoup4 pandas
playwright install chromium
```

#### 爬取脚本

```python
import asyncio
import json
from playwright.async_api import async_playwright

async def scrape_sakura():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # 拦截 API 响应
        captured_data = []

        async def handle_response(response):
            if "sakura" in response.url and response.status == 200:
                try:
                    content_type = response.headers.get("content-type", "")
                    if "json" in content_type:
                        data = await response.json()
                        captured_data.append({
                            "url": response.url,
                            "data": data
                        })
                        print(f"捕获接口：{response.url}")
                except Exception as e:
                    pass

        page.on("response", handle_response)

        await page.goto("https://weathernews.jp/sakura/", wait_until="networkidle")
        await asyncio.sleep(3)  # 等待异步数据加载完成

        # 同时尝试从页面 DOM 提取
        spots = await page.evaluate("""
            () => {
                // 尝试从全局变量中提取（常见于日本天气网站）
                if (window.spots) return window.spots;
                if (window.sakuraData) return window.sakuraData;
                if (window.__INITIAL_STATE__) return window.__INITIAL_STATE__;
                return null;
            }
        """)

        await browser.close()

        return captured_data, spots

captured, spots = asyncio.run(scrape_sakura())

# 保存结果
with open("sakura_api_responses.json", "w", encoding="utf-8") as f:
    json.dump(captured, f, ensure_ascii=False, indent=2)
```

---

### 2.3 方案 C：BeautifulSoup 静态解析（HTML 渲染页面）

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

response = requests.get("https://weathernews.jp/sakura/", headers=headers)
soup = BeautifulSoup(response.text, "html.parser")

spots = []

# 根据实际 HTML 结构调整选择器
# 示例：查找包含地点信息的元素
for item in soup.select(".spot-item, .sakura-location, [data-lat]"):
    spot = {
        "name": item.get("data-name") or item.select_one(".name, .spot-name").text.strip(),
        "lat": item.get("data-lat"),
        "lng": item.get("data-lng"),
        "prefecture": item.get("data-pref") or "",
        "type": item.get("data-type") or "sakura"
    }
    spots.append(spot)

print(f"解析到 {len(spots)} 个地点")
df = pd.DataFrame(spots)
df.to_csv("sakura_spots.csv", index=False, encoding="utf-8-sig")
```

---

### 2.4 分批爬取策略（应对分页/懒加载）

```python
import time
import requests

all_spots = []
page_num = 1

while True:
    url = f"https://weathernews.jp/sakura/api/spots?page={page_num}&limit=100"
    resp = requests.get(url, headers=headers)

    if resp.status_code != 200:
        break

    data = resp.json()
    spots = data.get("spots", data.get("items", []))

    if not spots:
        break

    all_spots.extend(spots)
    print(f"第 {page_num} 页，累计 {len(all_spots)} 条")

    page_num += 1
    time.sleep(1)  # 礼貌性延迟，避免封禁

print(f"总计：{len(all_spots)} 个地点")
```

---

## 第三步：数据清洗与整理

### 3.1 标准化字段

```python
import pandas as pd
import json

# 加载原始数据
with open("sakura_raw.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

# 字段映射（根据实际 JSON 字段名调整）
def normalize_spot(item):
    return {
        "id": item.get("id") or item.get("spot_id"),
        "name_ja": item.get("name") or item.get("spot_name"),      # 日文名
        "name_en": item.get("name_en", ""),                        # 英文名（若有）
        "prefecture": item.get("pref") or item.get("prefecture"),  # 都道府县
        "city": item.get("city", ""),                              # 市区町村
        "lat": float(item.get("lat") or item.get("latitude", 0)),
        "lng": float(item.get("lng") or item.get("longitude", 0)),
        "category": item.get("category", "sakura"),
        "image_url": item.get("image") or item.get("img_url", ""),
    }

spots = [normalize_spot(item) for item in raw]
df = pd.DataFrame(spots)

# 去重
df.drop_duplicates(subset=["name_ja", "lat", "lng"], inplace=True)

# 过滤无效坐标
df = df[(df["lat"] != 0) & (df["lng"] != 0)]

print(df.head())
print(f"清洗后共 {len(df)} 个有效地点")
```

### 3.2 导出为多种格式

```python
# CSV（通用）
df.to_csv("sakura_spots_clean.csv", index=False, encoding="utf-8-sig")

# JSON（APP 导入推荐）
df.to_json("sakura_spots_clean.json", orient="records", force_ascii=False, indent=2)

# SQLite（本地数据库）
import sqlite3
conn = sqlite3.connect("sakura.db")
df.to_sql("spots", conn, if_exists="replace", index=False)
conn.close()
```

---

## 第四步：设计 APP 数据格式

### 4.1 推荐的 JSON 数据结构

```json
{
  "version": "1.0",
  "updated_at": "2026-03-18",
  "total": 1400,
  "spots": [
    {
      "id": "sakura_001",
      "name_ja": "上野恩賜公園",
      "name_zh": "上野公园",
      "prefecture": "東京都",
      "city": "台東区",
      "lat": 35.7141,
      "lng": 139.7734,
      "logo": {
        "icon": "ueno_park.png",
        "color": "#FF6B9D",
        "label": "上野公園"
      },
      "tags": ["人気スポット", "夜桜"]
    }
  ]
}
```

### 4.2 按都道府县建立索引（优化查询速度）

```python
import json

with open("sakura_spots_clean.json", "r", encoding="utf-8") as f:
    spots = json.load(f)

# 建立都道府县索引
index = {}
for spot in spots:
    pref = spot["prefecture"]
    if pref not in index:
        index[pref] = []
    index[pref].append(spot["id"])

with open("sakura_index_by_pref.json", "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=2)
```

---

## 第五步：设计地点 Logo

### 5.1 Logo 设计规范

| 属性 | 建议规格 |
|---|---|
| 尺寸 | 200×80 px（横版）或 100×100 px（方形）|
| 格式 | PNG（支持透明背景）|
| 字体 | 日文：Noto Sans JP；中文：思源黑体 |
| 主色 | 樱花粉 `#FF6B9D` + 白色 `#FFFFFF` |
| 命名规则 | `logo_{spot_id}.png` |

### 5.2 批量生成 Logo（Python Pillow）

```python
from PIL import Image, ImageDraw, ImageFont
import os

def generate_logo(spot_id, name, prefecture, output_dir="logos"):
    os.makedirs(output_dir, exist_ok=True)

    # 创建画布
    img = Image.new("RGBA", (300, 100), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 背景圆角矩形（樱花粉）
    draw.rounded_rectangle([0, 0, 299, 99], radius=20, fill=(255, 107, 157, 220))

    # 樱花图标（可替换为实际 PNG 图标）
    draw.ellipse([10, 35, 40, 65], fill=(255, 255, 255, 180))

    # 地点名称
    try:
        font_name = ImageFont.truetype("NotoSansJP-Bold.ttf", 28)
        font_pref = ImageFont.truetype("NotoSansJP-Regular.ttf", 16)
    except:
        font_name = ImageFont.load_default()
        font_pref = font_name

    draw.text((55, 20), name, font=font_name, fill=(255, 255, 255, 255))
    draw.text((55, 58), prefecture, font=font_pref, fill=(255, 220, 235, 255))

    # 保存
    output_path = os.path.join(output_dir, f"logo_{spot_id}.png")
    img.save(output_path, "PNG")
    return output_path

# 批量生成
import json

with open("sakura_spots_clean.json", "r", encoding="utf-8") as f:
    spots = json.load(f)

for spot in spots:
    path = generate_logo(spot["id"], spot["name_ja"], spot["prefecture"])
    print(f"生成：{path}")
```

---

## 第六步：导入 APP

### 6.1 数据文件打包

```
sakura_data/
├── sakura_spots_clean.json    # 主数据文件（1400 条记录）
├── sakura_index_by_pref.json  # 都道府县索引
├── sakura.db                  # SQLite 数据库（可选）
└── logos/
    ├── logo_sakura_001.png
    ├── logo_sakura_002.png
    └── ...（共 1400 个）
```

### 6.2 iOS / Android APP 集成建议

#### 方式一：本地 Bundle（离线可用）

- 将 `sakura_spots_clean.json` 和 `logos/` 打包进 APP Assets
- APP 启动时加载到内存 / SQLite
- 适合：数据量不大、需要离线功能

#### 方式二：远程 API（数据可实时更新）

```javascript
// APP 端伪代码（React Native / Flutter）
const fetchSpots = async () => {
  const res = await fetch("https://your-api.com/sakura/spots");
  const data = await res.json();
  // 缓存到本地
  await AsyncStorage.setItem("sakura_spots", JSON.stringify(data));
};
```

### 6.3 地点匹配逻辑（给照片打 Logo）

```swift
// iOS Swift 伪代码示例
func matchSpot(photoLocation: CLLocation, spots: [SakuraSpot]) -> SakuraSpot? {
    let threshold = 0.5  // 0.5 km 范围内视为匹配
    
    return spots.min(by: { a, b in
        let distA = photoLocation.distance(from: CLLocation(latitude: a.lat, longitude: a.lng))
        let distB = photoLocation.distance(from: CLLocation(latitude: b.lat, longitude: b.lng))
        return distA < distB
    }).flatMap { spot in
        let distance = photoLocation.distance(from: CLLocation(latitude: spot.lat, longitude: spot.lng))
        return distance < threshold * 1000 ? spot : nil
    }
}
```

```kotlin
// Android Kotlin 伪代码示例
fun matchSpot(photoLat: Double, photoLng: Double, spots: List<SakuraSpot>): SakuraSpot? {
    val threshold = 500.0  // 500米以内
    return spots
        .map { it to haversineDistance(photoLat, photoLng, it.lat, it.lng) }
        .filter { (_, dist) -> dist < threshold }
        .minByOrNull { (_, dist) -> dist }
        ?.first
}
```

### 6.4 图片合成（给照片添加 Logo 水印）

```python
# 服务端合成示例（Python PIL）
from PIL import Image

def add_location_logo(photo_path, logo_path, output_path, position="bottom-left"):
    photo = Image.open(photo_path).convert("RGBA")
    logo = Image.open(logo_path).convert("RGBA")

    # Logo 缩放为照片宽度的 30%
    logo_width = int(photo.width * 0.30)
    logo_height = int(logo.height * (logo_width / logo.width))
    logo = logo.resize((logo_width, logo_height), Image.LANCZOS)

    # 定位（左下角，留 20px 边距）
    margin = 20
    x = margin
    y = photo.height - logo_height - margin

    # 合成
    photo.paste(logo, (x, y), logo)
    photo.convert("RGB").save(output_path, "JPEG", quality=95)

# 示例调用
add_location_logo("user_photo.jpg", "logos/logo_sakura_001.png", "output.jpg")
```

---

## ⚠️ 注意事项

### 法律与道德合规

- **务必检查** weathernews.jp 的 [robots.txt](https://weathernews.jp/robots.txt) 和使用条款（利用規約）
- 爬取频率建议：每次请求间隔 **≥1秒**，避免对服务器造成压力
- 商业用途使用数据前，建议联系 Weathernews 获取授权或使用其官方 API（WxTech Data）
- Logo 中如包含 Weathernews 品牌元素，需遵守其品牌使用规范

### 技术注意事项

- 日文文字处理：所有文件统一使用 `UTF-8` 编码
- 坐标系：日本地图使用 **JGD2011**（与 WGS84 近似，误差可忽略）
- 照片 GPS 信息：需在 APP 端读取 EXIF 数据中的 GPSLatitude / GPSLongitude

---

## 🛠️ 依赖环境汇总

```bash
# Python 依赖
pip install requests beautifulsoup4 playwright pandas pillow sqlite3

# Node.js 依赖（若选择 JS 爬虫）
npm install puppeteer axios cheerio

# Playwright 浏览器
playwright install chromium
```

---

## 📁 最终交付文件清单

| 文件 | 说明 |
|---|---|
| `sakura_spots_clean.json` | 1400 个地点结构化数据 |
| `sakura_index_by_pref.json` | 按都道府县索引 |
| `sakura.db` | SQLite 数据库 |
| `logos/*.png` | 1400 个地点 Logo 图片 |
| `scraper.py` | 爬虫脚本 |
| `generate_logos.py` | Logo 批量生成脚本 |

---

*本指南生成日期：2026-03-18 | 适用目标：weathernews.jp/sakura 樱花地点数据采集与 APP 集成*
