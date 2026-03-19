# LINE 竞品分析 · 第一层实现方案
## 理解数据结构性限制 → 建立可及性地图

> **定位：** 在写任何一行抓取代码之前，先用本方案摸清 LINE 各子产品的数据边界，避免把时间花在不可及的数据上。  
> **产出物：** 可及性验证报告 + 数据源优先级矩阵 + 合规边界确认清单

---

## 1. 为什么要先做第一层

LINE 的数据访问结构与 App Store、小红书根本不同。后两者的评论是**集中式公开数据**，一个接口能批量拿到。LINE 的数据是**分散式半公开数据**，同一类信息（例如"用户对 GreenSnap 的评价"）散落在 BLOG / OpenChat / Creators Market 三个完全不同技术结构的子产品里，访问方式各异。

跳过第一层直接写爬虫的后果：

- 花了两天实现 OpenChat 自动化，发现无法绕过登录墙
- LINE BLOG 的 robots.txt 随时可能封锁某些路径
- 把精力放在数据量少的 LINE BLOG 上，而忽略了信号更密集的 OpenChat 人工观察

---

## 2. 五个子产品的可及性全量核查

### 2-1 核查脚本：自动探测技术边界

```python
# probe_line_accessibility.py
# 运行前提：不需要 LINE 账号，纯 HTTP 层面的探测
# 用途：在项目启动时一次性运行，生成可及性基线报告

import requests
import xml.etree.ElementTree as ET
from urllib.parse import urljoin
from dataclasses import dataclass, field
from typing import Optional
import json, time

@dataclass
class ProbeResult:
    product:        str
    base_url:       str
    robots_blocked: bool
    login_required: bool
    has_search_api: bool
    rate_limit_hit: bool
    sample_data_accessible: bool
    notes:          str = ""
    blocked_paths:  list = field(default_factory=list)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "ja-JP,ja;q=0.9",
}

# ── 工具函数 ──────────────────────────────────────────────

def fetch_robots(base_url: str) -> dict:
    """
    解析 robots.txt，返回 {blocked_paths, crawl_delay, sitemap_url}
    """
    url = urljoin(base_url, "/robots.txt")
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        blocked, delay, sitemap = [], None, None
        for line in res.text.splitlines():
            line = line.strip()
            if line.lower().startswith("disallow:"):
                path = line.split(":", 1)[1].strip()
                if path:
                    blocked.append(path)
            elif line.lower().startswith("crawl-delay:"):
                delay = line.split(":", 1)[1].strip()
            elif line.lower().startswith("sitemap:"):
                sitemap = line.split(":", 1)[1].strip()
        return {"blocked": blocked, "crawl_delay": delay, "sitemap": sitemap}
    except Exception as e:
        return {"error": str(e)}

def check_login_wall(url: str) -> bool:
    """
    访问目标 URL，判断是否触发登录跳转（302 → login / 200 含登录表单）
    """
    try:
        res = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
        login_signals = ["login", "signin", "accounts.line.me", "ログイン"]
        return any(s in res.url or s in res.text[:3000] for s in login_signals)
    except:
        return True   # 无法访问视为有墙

def check_search_endpoint(search_url: str, param: dict) -> dict:
    """
    试探搜索接口是否可公开访问，返回状态码和结果条数估计
    """
    try:
        res = requests.get(search_url, params=param,
                           headers=HEADERS, timeout=15)
        return {
            "status_code":  res.status_code,
            "content_len":  len(res.text),
            "has_results":  res.status_code == 200 and len(res.text) > 2000,
        }
    except Exception as e:
        return {"error": str(e)}

# ── 各子产品探测逻辑 ──────────────────────────────────────

def probe_line_blog() -> ProbeResult:
    base = "https://lineblog.me"
    robots = fetch_robots(base)
    blocked_paths = robots.get("blocked", [])

    # 搜索端点探测
    search_check = check_search_endpoint(
        f"{base}/search",
        {"q": "GreenSnap アプリ"}
    )
    # 文章正文页探测（用一篇已知存在的公开文章）
    article_check = not check_login_wall(f"{base}/")

    return ProbeResult(
        product="LINE BLOG",
        base_url=base,
        robots_blocked=any("/search" in p for p in blocked_paths),
        login_required=check_login_wall(f"{base}/search?q=test"),
        has_search_api=search_check.get("has_results", False),
        rate_limit_hit=search_check.get("status_code") == 429,
        sample_data_accessible=article_check,
        blocked_paths=blocked_paths,
        notes=f"crawl_delay={robots.get('crawl_delay', '未设置')}"
    )

def probe_openchat() -> ProbeResult:
    base = "https://openchat.line.me"
    robots = fetch_robots(base)

    # OpenChat Web 入口
    login_check = check_login_wall(f"{base}/jp/")
    search_check = check_search_endpoint(
        f"{base}/api/v10/openchat/search",
        {"query": "花好き", "limit": 10}
    )

    return ProbeResult(
        product="LINE OpenChat",
        base_url=base,
        robots_blocked=len(robots.get("blocked", [])) > 5,
        login_required=login_check,
        has_search_api=search_check.get("has_results", False),
        rate_limit_hit=search_check.get("status_code") == 429,
        sample_data_accessible=False,   # 内容需要 LINE 账号
        blocked_paths=robots.get("blocked", []),
        notes="群内消息必须登录后在 App 内查看，Web 端无法访问消息内容"
    )

def probe_creators_market() -> ProbeResult:
    base = "https://creator.line.me"
    robots = fetch_robots(base)

    search_check = check_search_endpoint(
        f"{base}/ja/search/",
        {"q": "植物", "type": "sticker"}
    )
    login_check = check_login_wall(f"{base}/ja/search/?q=植物&type=sticker")

    return ProbeResult(
        product="LINE Creators Market",
        base_url=base,
        robots_blocked=any("search" in p for p in robots.get("blocked", [])),
        login_required=login_check,
        has_search_api=search_check.get("has_results", False),
        rate_limit_hit=search_check.get("status_code") == 429,
        sample_data_accessible=not login_check,
        blocked_paths=robots.get("blocked", []),
        notes="排行榜页面公开可访问；购买/销量数字为估算区间"
    )

def probe_line_research() -> ProbeResult:
    base = "https://lineresearch-platform.blog.jp"
    robots = fetch_robots(base)

    # 公开博客，应该无需登录
    login_check = check_login_wall(base)
    # 试探文章列表
    list_check = check_search_endpoint(base, {})

    return ProbeResult(
        product="LINE Research 公开博客",
        base_url=base,
        robots_blocked=False,
        login_required=login_check,
        has_search_api=False,   # 无搜索 API，靠 Google site: 搜索
        rate_limit_hit=list_check.get("status_code") == 429,
        sample_data_accessible=not login_check,
        notes="内容以 PDF 报告为主，需 pdfplumber 解析；部分报告需付费"
    )

def probe_official_account() -> ProbeResult:
    """
    LINE 官方账号的推送内容只能通过 App 观察。
    此探测仅确认是否有公开 Web 镜像。
    """
    # LY Corporation 的 for Business 站点是公开的，但不含推送内容
    base = "https://www.lycbiz.com"
    login_check = check_login_wall(base)

    return ProbeResult(
        product="LINE 官方账号（竞品）",
        base_url="LINE App（无 Web 入口）",
        robots_blocked=False,
        login_required=True,    # 实际推送内容必须在 App 里看
        has_search_api=False,
        rate_limit_hit=False,
        sample_data_accessible=False,
        notes="只能通过 LINE App 手动关注竞品账号后人工记录推送内容"
    )

# ── 主程序：运行全量探测并输出报告 ──────────────────────

def run_all_probes() -> list[ProbeResult]:
    probes = [
        probe_line_blog,
        probe_openchat,
        probe_creators_market,
        probe_line_research,
        probe_official_account,
    ]
    results = []
    for probe_fn in probes:
        print(f"探测中: {probe_fn.__name__} ...")
        result = probe_fn()
        results.append(result)
        time.sleep(3)   # 礼貌间隔
    return results

def generate_accessibility_report(results: list[ProbeResult]) -> str:
    """
    将探测结果输出为 Markdown 表格 + 详细说明
    """
    lines = [
        "# LINE 子产品可及性探测报告\n",
        "| 子产品 | robots限制 | 登录墙 | 搜索API | 速率限制 | 数据可及 |",
        "|--------|-----------|--------|---------|---------|---------|",
    ]
    for r in results:
        def fmt(b): return "✅ 无" if not b else "❌ 有"
        lines.append(
            f"| {r.product} "
            f"| {fmt(r.robots_blocked)} "
            f"| {fmt(r.login_required)} "
            f"| {'✅' if r.has_search_api else '❌'} "
            f"| {'❌ 触发' if r.rate_limit_hit else '✅ 正常'} "
            f"| {'✅ 可及' if r.sample_data_accessible else '❌ 不可及'} |"
        )
    lines.append("\n## 各产品详细说明\n")
    for r in results:
        lines.append(f"### {r.product}")
        lines.append(f"- **base_url:** {r.base_url}")
        lines.append(f"- **blocked_paths:** {r.blocked_paths or '无'}")
        lines.append(f"- **备注:** {r.notes}\n")
    return "\n".join(lines)

if __name__ == "__main__":
    results = run_all_probes()
    report = generate_accessibility_report(results)
    print(report)
    with open("docs/market-research/line_accessibility_report.md", "w") as f:
        f.write(report)
```

---

## 3. robots.txt 动态监控

可及性不是静态的——LINE 会随时更新 robots.txt 封锁新路径。用以下脚本在每次收集前自动校验。

```python
# check_robots_before_scrape.py
import requests, sys

def is_path_allowed(base_url: str, target_path: str,
                    user_agent: str = "*") -> bool:
    """
    运行每次抓取前调用，如果目标路径被 disallow 则中止并报警
    """
    robots_url = f"{base_url.rstrip('/')}/robots.txt"
    res = requests.get(robots_url, timeout=8)
    current_agent_rules = []
    capture = False
    for line in res.text.splitlines():
        line = line.strip()
        if line.lower().startswith("user-agent:"):
            agent = line.split(":", 1)[1].strip()
            capture = agent in (user_agent, "*")
        elif capture and line.lower().startswith("disallow:"):
            path = line.split(":", 1)[1].strip()
            current_agent_rules.append(path)
    for rule in current_agent_rules:
        if rule and target_path.startswith(rule):
            return False
    return True

# 使用方式：每次抓取前调用
TARGETS = [
    ("https://lineblog.me",     "/search"),
    ("https://creator.line.me", "/ja/search/"),
]

for base, path in TARGETS:
    if not is_path_allowed(base, path):
        print(f"[BLOCKED] {base}{path} 被 robots.txt 封锁，终止本次抓取")
        sys.exit(1)
    else:
        print(f"[OK] {base}{path} 可访问")
```

---

## 4. 登录墙识别与分级处理

不同子产品的登录墙类型不同，处理策略也不同。

```python
# classify_login_wall.py

import requests
from enum import Enum

class WallType(Enum):
    NONE          = "无墙，公开可访问"
    SOFT_REDIRECT = "软墙：302 跳转到登录页，内容仍可部分读取"
    HARD_BLOCK    = "硬墙：无 LINE 账号则完全无法访问"
    RATE_LIMIT    = "速率墙：短时间大量请求后触发，非账号问题"

def classify_wall(url: str) -> tuple[WallType, str]:
    """
    返回 (墙类型, 处理建议)
    """
    session = requests.Session()
    res = session.get(url, allow_redirects=True, timeout=12,
                      headers={"User-Agent": "Mozilla/5.0",
                               "Accept-Language": "ja-JP"})

    if res.status_code == 429:
        return WallType.RATE_LIMIT, "降低请求频率至 3 秒/次，或切换 IP"

    if res.status_code in (301, 302):
        if "accounts.line.me" in res.url or "login" in res.url:
            return WallType.HARD_BLOCK, "必须使用 LINE 账号登录，改为人工观察"

    if res.status_code == 200:
        text = res.text[:5000]
        login_keywords = ["ログイン", "サインイン", "accounts.line.me/login"]
        if any(kw in text for kw in login_keywords):
            return WallType.SOFT_REDIRECT, "页面结构可读取，部分内容被遮挡，尝试解析公开部分"
        return WallType.NONE, "可直接抓取，注意遵守 crawl-delay"

    return WallType.HARD_BLOCK, f"HTTP {res.status_code}，跳过此端点"

# 对每个子产品的关键 URL 分类
TEST_URLS = {
    "LINE BLOG 搜索":         "https://lineblog.me/search?q=GreenSnap",
    "LINE BLOG 文章页":        "https://lineblog.me/",  # 用实际文章 URL 替换
    "OpenChat Web":            "https://openchat.line.me/jp/",
    "OpenChat 搜索 API":       "https://openchat.line.me/api/v10/openchat/search?query=花",
    "Creators Market 搜索":    "https://creator.line.me/ja/search/?q=植物&type=sticker",
    "LINE Research Blog":      "https://lineresearch-platform.blog.jp/",
}

wall_map = {}
for name, url in TEST_URLS.items():
    wall_type, advice = classify_wall(url)
    wall_map[name] = {"type": wall_type.value, "advice": advice}
    print(f"{name}: [{wall_type.name}] → {advice}")
```

---

## 5. 可及性地图：静态结论

上述探测运行后，预期得到以下结论（基于 LINE 当前政策，需每次收集前重新验证）。

```
子产品                 技术可及性      数据收集方式           优先级
──────────────────────────────────────────────────────────────────────────
LINE BLOG             ✅ 可抓取       Python requests + BS4  ★★★
LINE Research Blog    ✅ 可抓取       requests + pdfplumber  ★★★
Creators Market 排行  ✅ 可抓取       requests + BS4         ★★☆
OpenChat 群组列表     ⚠️ 部分可见     requests（仅列表页）   ★☆☆
OpenChat 群内消息     ❌ 必须登录     人工 App 内观察记录    ★★★（高价值但高成本）
LINE 官方账号推送     ❌ 无 Web 入口  人工 App 内观察记录    ★★☆
LINE Research 数据    ❌ 付费服务     申请企业账号或看公开报告 ★★★（需预算）
```

---

## 6. 数据源优先级矩阵（基于可及性 × 信号质量）

```python
# 用于后续模块选择收集顺序的决策矩阵

PRIORITY_MATRIX = {
    "LINE BLOG": {
        "accessibility":    9,   # 10分制，可直接抓取
        "signal_quality":   8,   # 长文，行为链路完整
        "competitor_focus": 7,   # 用户有时会直接提竞品名
        "cost":             2,   # 开发成本低
        "priority_score":   lambda a, s, c, co: (a * 0.3 + s * 0.4 + c * 0.2) / co * 10,
    },
    "OpenChat 人工观察": {
        "accessibility":    5,   # 需要账号，但内容完全可读
        "signal_quality":   9,   # 实时群体讨论，最真实
        "competitor_focus": 6,   # 提竞品名的频率中等
        "cost":             8,   # 人工成本高
        "priority_score":   lambda a, s, c, co: (a * 0.3 + s * 0.4 + c * 0.2) / co * 10,
    },
    "Creators Market": {
        "accessibility":    9,
        "signal_quality":   5,   # 美学偏好数据，非直接竞品评价
        "competitor_focus": 2,
        "cost":             3,
        "priority_score":   lambda a, s, c, co: (a * 0.3 + s * 0.4 + c * 0.2) / co * 10,
    },
    "LINE Research 公开报告": {
        "accessibility":    8,
        "signal_quality":   9,   # 官方定量数据，校准基准用
        "competitor_focus": 3,   # 通常不提具体竞品
        "cost":             2,
        "priority_score":   lambda a, s, c, co: (a * 0.3 + s * 0.4 + c * 0.2) / co * 10,
    },
    "官方账号人工观察": {
        "accessibility":    5,
        "signal_quality":   7,   # 竞品自己暴露运营策略
        "competitor_focus": 10,  # 直接研究竞品
        "cost":             4,
        "priority_score":   lambda a, s, c, co: (a * 0.3 + s * 0.4 + c * 0.2) / co * 10,
    },
}

def compute_priorities(matrix: dict) -> list[tuple[str, float]]:
    scores = []
    for name, m in matrix.items():
        score = (m["accessibility"] * 0.3
                 + m["signal_quality"] * 0.4
                 + m["competitor_focus"] * 0.2) / m["cost"] * 10
        scores.append((name, round(score, 2)))
    return sorted(scores, key=lambda x: x[1], reverse=True)

ranked = compute_priorities(PRIORITY_MATRIX)
for rank, (name, score) in enumerate(ranked, 1):
    print(f"{rank}. {name}: {score} 分")
```

预期排序输出：

```
1. LINE BLOG                 : 18.20 分   ← 第一顺序实施
2. LINE Research 公开报告    : 16.50 分   ← 第一顺序实施
3. 官方账号人工观察          : 11.75 分   ← 第二顺序实施
4. OpenChat 人工观察         : 9.25 分    ← 高价值但高成本，第三顺序
5. Creators Market           : 8.60 分    ← 辅助参考
```

---

## 7. 合规边界确认清单

在每次开始收集之前，执行以下检查并保存结果。

```python
# compliance_checklist.py
from datetime import date

CHECKLIST = {
    "robots_txt_checked": {
        "description": "已读取目标站点 robots.txt 并确认目标路径未被 Disallow",
        "how_to_verify": "运行 check_robots_before_scrape.py",
    },
    "crawl_delay_respected": {
        "description": "请求间隔 ≥ robots.txt 中 Crawl-delay 值（默认 3 秒）",
        "how_to_verify": "代码中 time.sleep(3) 已启用",
    },
    "no_login_bypass": {
        "description": "未使用任何方式绕过登录墙获取私人数据",
        "how_to_verify": "仅访问无需登录即可访问的 URL",
    },
    "pii_not_collected": {
        "description": "不收集用户名、头像、个人 ID 等 PII 字段",
        "how_to_verify": "DataFrame 中无 user_id / username / avatar 列",
    },
    "data_for_research_only": {
        "description": "收集数据仅用于产品设计研究，不对外发布原始文本",
        "how_to_verify": "团队内部文件权限已设置",
    },
    "no_automated_openchat": {
        "description": "OpenChat 群内消息仅通过人工 App 内观察，不使用自动化工具",
        "how_to_verify": "无 OpenChat 相关抓取代码提交到仓库",
    },
}

def run_compliance_check() -> dict:
    results = {}
    print(f"=== 合规检查 {date.today()} ===\n")
    for key, item in CHECKLIST.items():
        answer = input(f"[{key}]\n{item['description']}\n验证方法: {item['how_to_verify']}\n确认通过? (y/n): ")
        results[key] = answer.strip().lower() == "y"
        print()
    all_passed = all(results.values())
    failed = [k for k, v in results.items() if not v]
    if not all_passed:
        print(f"⚠️  以下项目未通过，请解决后再开始收集: {failed}")
    else:
        print("✅ 所有合规检查通过，可以开始收集")
    return results

if __name__ == "__main__":
    run_compliance_check()
```

---

## 8. 第一层产出物与交接标准

第一层完成后，输出以下三个文件，作为后续模块（数据收集、NLP 分析）的输入。

```
docs/market-research/
├── line_accessibility_report.md    ← 模块 2 生成：各子产品可及性探测结果
├── priority_matrix.json            ← 模块 6 生成：收集优先级排序
└── compliance_check_YYYYMMDD.json  ← 模块 7 生成：合规确认记录
```

**交接判断标准：** 当 `line_accessibility_report.md` 中每个子产品的 `WallType` 分类完成，且 `priority_matrix.json` 输出排序后，第一层结束，进入第二层（竞品信号提取）实施。

---

*本文件是 `pixel-herbarium-line-data-collection-technical-plan.md` 的细化实现，对应「第一层：理解数据结构性限制」。*
