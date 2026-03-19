# LINE 竞品分析 · 第三层实现方案
## 模式识别与洞察生成——从结构化信号到产品决策

> **定位：** 以第二层产出的 `all_signals.json` 为唯一输入，完成信号聚合 → 竞品差异化识别 → 语义聚类 → 机会点生成 → 报告输出的完整分析管道。  
> **产出物：** `insights_report.md`（产品团队可读报告）+ `opportunity_matrix.json`（结构化机会点，供 PRD 引用）

---

## 目录

1. [模块总览与目录结构](#0-模块总览)
2. [loader.py — 数据加载与置信度过滤](#1-loaderpy)
3. [aggregator.py — 信号聚合与统计分析](#2-aggregatorpy)
4. [differentiator.py — 竞品差异化识别](#3-differentiatorpy)
5. [clusterer.py — 高价值信号语义聚类](#4-clustererpy)
6. [opportunity_generator.py — 机会点生成](#5-opportunity_generatorpy)
7. [report_writer.py — 报告输出](#6-report_writerpy)
8. [pipeline.py — 端到端运行入口](#7-pipelinepy)
9. [输出产物格式规范](#8-输出产物格式规范)

---

## 0. 模块总览

### 目录结构

```
layer3/
├── loader.py                   # 模块 1：数据加载、校验、置信度分流
├── aggregator.py               # 模块 2：频率矩阵 / 加权排序 / 时序趋势
├── differentiator.py           # 模块 3：GreenSnap vs PictureThis 差异化识别
├── clusterer.py                # 模块 4：TF-IDF 语义聚类（痛点簇 / 留存簇）
├── opportunity_generator.py    # 模块 5："We should / We should not" 生成
├── report_writer.py            # 模块 6：insights_report.md 输出
├── pipeline.py                 # 端到端运行入口
└── output/
    ├── insights_report.md      ← 产品团队可读报告
    ├── opportunity_matrix.json ← 机会点结构化数据（供 PRD 引用）
    └── archived_ambiguous.json ← confidence < 0.3 的低置信信号存档
```

### 依赖安装

```bash
# 核心数值/数据处理
pip install pandas numpy scipy

# 日语 TF-IDF 分词（fugashi 已在第二层安装）
pip install scikit-learn fugashi unidic-lite

# 报告写出（纯标准库，无需额外安装）
# markdown 生成用 f-string + pathlib，无外部依赖

# 可选：更美观的终端进度条
pip install tqdm
```

### 数据流总览

```
all_signals.json
      │
      ▼
 [loader.py]
 ┌────────────────────────────┐
 │  main_signals (conf≥0.3)  │──────────────────────────────────────────┐
 │  archived_signals (conf<0.3)→ archived_ambiguous.json                │
 └────────────────────────────┘                                          │
                                                                          ▼
                                              ┌──────────────────────────────────┐
                                              │        aggregator.py             │
                                              │  · competitor×type 频率矩阵      │
                                              │  · engagement 加权痛点排序        │
                                              │  · published_at 时序趋势          │
                                              └──────────────┬───────────────────┘
                                                             │
                                              ┌──────────────▼───────────────────┐
                                              │       differentiator.py          │
                                              │  · GS vs PT 分布差异             │
                                              │  · 满意度 vs 流失原因对比         │
                                              └──────────────┬───────────────────┘
                                                             │
                                              ┌──────────────▼───────────────────┐
                                              │          clusterer.py            │
                                              │  · TF-IDF 日语分词               │
                                              │  · K-Means 聚类                  │
                                              │  · 痛点簇 / 留存簇 标注           │
                                              └──────────────┬───────────────────┘
                                                             │
                                              ┌──────────────▼───────────────────┐
                                              │    opportunity_generator.py      │
                                              │  · We should / We should not     │
                                              │  · opportunity_matrix.json       │
                                              └──────────────┬───────────────────┘
                                                             │
                                              ┌──────────────▼───────────────────┐
                                              │        report_writer.py          │
                                              │  · insights_report.md            │
                                              └──────────────────────────────────┘
```

---

## 1. loader.py

**职责：** 读取 `all_signals.json`，校验字段完整性，按置信度分流为主信号集和低置信度存档集。

**核心设计决策：**
- `confidence < 0.3` 的 `ambiguous` 信号单独归档，**不进入主报告**
- `source_weight` 在此处附加到每条 signal，供后续加权计算使用
- 返回 `pd.DataFrame` 而非 list[dict]，便于后续模块直接做向量运算

```python
# loader.py
# 功能：加载 all_signals.json，校验 Schema，分流主/归档信号集
# 输入：all_signals.json 路径
# 输出：(main_df: pd.DataFrame, archived_df: pd.DataFrame)
#
# 输入示例（all_signals.json 中的一条记录）：
# {
#   "signal_id": "BLOG_3f7c1a2b",
#   "source": "LINE_BLOG",
#   "published_at": "2024-01-20",
#   "competitor": "GreenSnap",
#   "signal_type": "feature_pain_point",
#   "confidence": 0.667,
#   "text_ja": "GreenSnapの認識精度がバラバラで...",
#   "text_context": "GreenSnapを半年使った正直レビュー",
#   "engagement_score": 1,
#   "signal_type_manual": null,
#   "sentiment_manual": null
# }
#
# 输出示例（main_df 的一行）：
# signal_id       BLOG_3f7c1a2b
# source          LINE_BLOG
# competitor      GreenSnap
# signal_type     feature_pain_point
# confidence      0.667
# engagement_score  1
# source_weight   1.0         ← 新增列：数据源权重
# weighted_score  0.667       ← 新增列：confidence × engagement × source_weight

import json
import pandas as pd
from pathlib import Path

# ── 数据源权重表 ─────────────────────────────────────────────────────────────
# LINE_RESEARCH：官方定量数据，可作校准基准，权重最高
# LINE_OPENCHAT_MANUAL：最接近真实用户声音，权重次高
# LINE_BLOG：定性长文，粒度细但受博主主观性影响，基础权重
SOURCE_WEIGHTS: dict[str, float] = {
    "LINE_RESEARCH":        1.5,
    "LINE_OPENCHAT_MANUAL": 1.2,
    "LINE_BLOG":            1.0,
}

# ── 必填字段（第二层 Schema 保证字段） ────────────────────────────────────────
REQUIRED_FIELDS = [
    "signal_id", "source", "competitor",
    "signal_type", "confidence", "text_ja", "engagement_score",
]

# 合法枚举值
VALID_SOURCES      = {"LINE_BLOG", "LINE_RESEARCH", "LINE_OPENCHAT_MANUAL"}
VALID_COMPETITORS  = {"GreenSnap", "PictureThis", "both", "other"}
VALID_SIGNAL_TYPES = {
    "feature_pain_point", "feature_satisfaction",
    "share_behavior", "retention_motivation",
    "churn_reason", "ambiguous",
}

# 低置信度阈值：低于此值的 ambiguous 信号归档，不进入主报告
CONFIDENCE_THRESHOLD = 0.3


def load_signals(
    input_path: str = "output/all_signals.json",
    archive_path: str = "output/archived_ambiguous.json",
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    加载信号 JSON，校验，分流，附加衍生列。

    参数
    ----
    input_path  : all_signals.json 路径
    archive_path: 低置信度存档输出路径

    返回
    ----
    (main_df, archived_df)
    main_df     : confidence >= CONFIDENCE_THRESHOLD 的信号，附加 source_weight / weighted_score
    archived_df : confidence < CONFIDENCE_THRESHOLD 的 ambiguous 信号
    """
    # ── 读取 JSON ─────────────────────────────────────────────────────────────
    path = Path(input_path)
    if not path.exists():
        raise FileNotFoundError(f"找不到输入文件：{input_path}")

    with open(path, "r", encoding="utf-8") as f:
        raw: list[dict] = json.load(f)

    print(f"[LOAD] 读取 {len(raw)} 条原始信号 ← {input_path}")

    # ── 构建 DataFrame ────────────────────────────────────────────────────────
    df = pd.DataFrame(raw)

    # ── 字段校验 ─────────────────────────────────────────────────────────────
    missing = [col for col in REQUIRED_FIELDS if col not in df.columns]
    if missing:
        raise ValueError(f"all_signals.json 缺少必填字段：{missing}")

    # 枚举值校验（记录异常行，不中断，打印警告）
    _warn_invalid(df, "source",       VALID_SOURCES)
    _warn_invalid(df, "competitor",   VALID_COMPETITORS)
    _warn_invalid(df, "signal_type",  VALID_SIGNAL_TYPES)

    # ── 类型规范化 ───────────────────────────────────────────────────────────
    df["confidence"]      = pd.to_numeric(df["confidence"],      errors="coerce").fillna(0.0)
    df["engagement_score"] = pd.to_numeric(df["engagement_score"], errors="coerce").fillna(1)

    # published_at：解析为 datetime（无法解析的置 NaT）
    df["published_at"] = pd.to_datetime(df["published_at"], errors="coerce")

    # ── 附加衍生列 ───────────────────────────────────────────────────────────
    # source_weight：数据源可信度权重
    df["source_weight"] = df["source"].map(SOURCE_WEIGHTS).fillna(1.0)

    # weighted_score：综合置信度 × 互动分 × 数据源权重
    # 用于加权排序，值域约 [0, 4.5]（confidence∈[0,1]，engagement∈[1,3]，weight∈[1,1.5]）
    df["weighted_score"] = df["confidence"] * df["engagement_score"] * df["source_weight"]

    # ── 置信度分流 ────────────────────────────────────────────────────────────
    low_conf_mask = df["confidence"] < CONFIDENCE_THRESHOLD
    archived_df   = df[low_conf_mask].copy()
    main_df       = df[~low_conf_mask].copy()

    # 存档低置信度信号
    archived_records = archived_df.to_dict(orient="records")
    # 将 NaT / Timestamp 转为字符串，保证 JSON 可序列化
    for rec in archived_records:
        if pd.isnull(rec.get("published_at")):
            rec["published_at"] = None
        elif hasattr(rec["published_at"], "isoformat"):
            rec["published_at"] = rec["published_at"].isoformat()

    with open(archive_path, "w", encoding="utf-8") as f:
        json.dump(archived_records, f, ensure_ascii=False, indent=2)

    print(f"[LOAD] 主信号集：{len(main_df)} 条（confidence ≥ {CONFIDENCE_THRESHOLD}）")
    print(f"[LOAD] 低置信度存档：{len(archived_df)} 条 → {archive_path}")

    return main_df, archived_df


def _warn_invalid(df: pd.DataFrame, col: str, valid_set: set[str]) -> None:
    """打印枚举值异常行（不中断流程）"""
    invalid = df[~df[col].isin(valid_set)][col].unique()
    if len(invalid):
        print(f"[WARN] {col} 包含非预期值：{invalid}，这些行仍保留但可能影响分组统计")
```

---

## 2. aggregator.py

**职责：** 对主信号集做三类统计分析——交叉频率矩阵、加权痛点排序、时序趋势。

**核心设计决策：**
- 频率矩阵同时输出 **原始计数** 和 **加权分数矩阵** 两张表，方便对照
- 时序趋势按月聚合（`published_at` 粒度不稳定，精确到月是合理上限）
- 加权排序只针对 `signal_type = feature_pain_point | churn_reason`，即"负向信号"

```python
# aggregator.py
# 功能：信号聚合统计，输出三类分析结果
# 输入：main_df（来自 loader.load_signals 的 pd.DataFrame）
# 输出：AggregationResult（dataclass，包含三张分析表）
#
# 输入示例（main_df 片段）：
# competitor  signal_type          engagement_score  weighted_score  published_at
# GreenSnap   feature_pain_point   2                 1.334           2024-01-20
# PictureThis churn_reason         3                 2.25            2024-03-05
#
# 输出示例（pain_ranking，前 3 条）：
# rank  signal_type         competitor  total_weighted  top_signal_text
#  1    churn_reason        GreenSnap   18.6            "コミュニティが閑散としている..."
#  2    feature_pain_point  PictureThis 14.2            "広告が多すぎて使いにくい..."
#  3    feature_pain_point  GreenSnap   11.8            "認識精度がバラバラで..."

import pandas as pd
import numpy as np
from dataclasses import dataclass

# 负向信号类型（纳入「真实痛点权重」排序）
NEGATIVE_SIGNAL_TYPES = {"feature_pain_point", "churn_reason"}


@dataclass
class AggregationResult:
    """聚合分析结果容器"""
    # 交叉频率矩阵（行=竞品，列=信号类型，值=原始计数）
    count_matrix:    pd.DataFrame
    # 交叉加权矩阵（行=竞品，列=信号类型，值=加权分数之和）
    weighted_matrix: pd.DataFrame
    # 负向信号加权排序（每个竞品×信号类型组合的总加权分 + 代表性文本）
    pain_ranking:    pd.DataFrame
    # 时序趋势（月度，行=年月，列=信号类型，值=该月该类型信号计数）
    monthly_trend:   pd.DataFrame


def build_cross_matrix(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    生成竞品 × 信号类型的交叉计数矩阵和加权矩阵。

    输入：main_df
    输出：(count_matrix, weighted_matrix)

    count_matrix 示例：
    signal_type      ambiguous  churn_reason  feature_pain_point  feature_satisfaction  ...
    competitor
    GreenSnap               3            12                  28                    15
    PictureThis             1             8                  19                    22
    both                    2             3                   7                     9

    weighted_matrix 示例（同结构，值为 weighted_score 之和）：
    signal_type      churn_reason  feature_pain_point  ...
    competitor
    GreenSnap               18.6                11.8
    """
    # 原始计数矩阵
    count_matrix = pd.crosstab(df["competitor"], df["signal_type"])

    # 加权矩阵：对 weighted_score 求和
    weighted_matrix = (
        df.groupby(["competitor", "signal_type"])["weighted_score"]
        .sum()
        .unstack(fill_value=0.0)
    )

    return count_matrix, weighted_matrix


def build_pain_ranking(df: pd.DataFrame, top_n: int = 10) -> pd.DataFrame:
    """
    对负向信号（feature_pain_point + churn_reason）按 weighted_score 加权排序。
    同时附带每组的代表性文本（weighted_score 最高的那条 signal 的 text_ja 片段）。

    输入：main_df
    输出：pain_ranking DataFrame

    输出示例：
    rank  competitor   signal_type          total_weighted  signal_count  top_signal_text
     1    GreenSnap    churn_reason                   18.6            12  "コミュニティが..."
     2    PictureThis  feature_pain_point             14.2            19  "広告が多すぎて..."
    """
    neg_df = df[df["signal_type"].isin(NEGATIVE_SIGNAL_TYPES)].copy()

    # 每个（竞品, 信号类型）组的总加权分 + 信号数量
    grouped = neg_df.groupby(["competitor", "signal_type"]).agg(
        total_weighted=("weighted_score", "sum"),
        signal_count=("signal_id", "count"),
    ).reset_index()

    # 代表性文本：每组中 weighted_score 最高的那条 signal 的 text_ja（截取前 60 字）
    top_texts = (
        neg_df.sort_values("weighted_score", ascending=False)
        .groupby(["competitor", "signal_type"])["text_ja"]
        .first()
        .str[:60]
        .reset_index()
        .rename(columns={"text_ja": "top_signal_text"})
    )

    ranking = (
        grouped
        .merge(top_texts, on=["competitor", "signal_type"])
        .sort_values("total_weighted", ascending=False)
        .head(top_n)
        .reset_index(drop=True)
    )
    ranking.index = ranking.index + 1  # 从 1 开始
    ranking.index.name = "rank"

    return ranking


def build_monthly_trend(df: pd.DataFrame) -> pd.DataFrame:
    """
    按月聚合各信号类型的计数，生成时序趋势矩阵。
    published_at 为 null 的信号被排除在时序分析之外。

    输入：main_df
    输出：monthly_trend DataFrame

    输出示例（行=年月，列=信号类型）：
    signal_type         feature_pain_point  feature_satisfaction  churn_reason  ...
    published_at
    2023-10                              3                     1             0
    2023-11                              7                     4             2
    2024-01                             12                     6             5
    """
    dated_df = df.dropna(subset=["published_at"]).copy()
    dated_df["month"] = dated_df["published_at"].dt.to_period("M")

    monthly_trend = (
        dated_df.groupby(["month", "signal_type"])
        .size()
        .unstack(fill_value=0)
        .sort_index()
    )

    return monthly_trend


def run_aggregation(main_df: pd.DataFrame) -> AggregationResult:
    """
    聚合分析主入口，串联三类统计。

    输入：main_df
    输出：AggregationResult
    """
    print("[AGGREGATOR] 构建交叉频率矩阵...")
    count_matrix, weighted_matrix = build_cross_matrix(main_df)

    print("[AGGREGATOR] 构建负向信号加权排序...")
    pain_ranking = build_pain_ranking(main_df, top_n=10)

    print("[AGGREGATOR] 构建月度时序趋势...")
    monthly_trend = build_monthly_trend(main_df)

    print(f"[AGGREGATOR] 完成：矩阵 {count_matrix.shape}，"
          f"排名前 {len(pain_ranking)} 条，"
          f"时序覆盖 {len(monthly_trend)} 个月")

    return AggregationResult(
        count_matrix=count_matrix,
        weighted_matrix=weighted_matrix,
        pain_ranking=pain_ranking,
        monthly_trend=monthly_trend,
    )
```

---

## 3. differentiator.py

**职责：** 量化识别 GreenSnap 与 PictureThis 在信号类型分布、满意度、流失原因上的显著差异。

**核心设计决策：**
- 使用 **卡方检验**（`scipy.stats.chi2_contingency`）判断分布差异是否显著（而非仅凭比例）
- 对 `feature_satisfaction` 和 `churn_reason` 分别做竞品对比，生成差异文本
- 输出结构化 `DiffResult`，供报告模块直接引用

```python
# differentiator.py
# 功能：GreenSnap vs PictureThis 信号类型分布对比 + 满意度 / 流失差异提取
# 输入：main_df（loader 输出）
# 输出：DiffResult（dataclass）
#
# 输出示例：
# DiffResult(
#   distribution_diff={
#     "GreenSnap":   {"feature_pain_point": 0.43, "feature_satisfaction": 0.23, ...},
#     "PictureThis": {"feature_pain_point": 0.29, "feature_satisfaction": 0.38, ...},
#   },
#   chi2_pvalue=0.021,          # p < 0.05 表示分布有统计显著差异
#   is_significant=True,
#   satisfaction_diff={
#     "GreenSnap_top":   ["コミュニティ機能", "植物日記"],
#     "PictureThis_top": ["識別精度", "多言語対応"],
#   },
#   churn_diff={
#     "GreenSnap_top":   ["通知が多い", "UI が古い"],
#     "PictureThis_top": ["広告が多い", "課金圧力"],
#   },
# )

import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from scipy.stats import chi2_contingency


@dataclass
class DiffResult:
    """竞品差异化识别结果"""
    # 信号类型分布（百分比）：{竞品名: {信号类型: 占比}}
    distribution_diff: dict[str, dict[str, float]]
    # 卡方检验 p 值
    chi2_pvalue: float
    # 分布差异是否统计显著（p < 0.05）
    is_significant: bool
    # 满意度关键词对比：{竞品_top: [词1, 词2, ...]}
    satisfaction_diff: dict[str, list[str]]
    # 流失原因关键词对比：{竞品_top: [词1, 词2, ...]}
    churn_diff: dict[str, list[str]]
    # 加权满意度得分对比
    satisfaction_weighted: dict[str, float] = field(default_factory=dict)
    # 加权流失得分对比
    churn_weighted: dict[str, float] = field(default_factory=dict)


# 卡方检验显著性阈值
SIGNIFICANCE_LEVEL = 0.05

# 用于关键词提取的简单停用词（日语高频助词/助动词）
JP_STOPWORDS = {
    "が", "を", "は", "に", "で", "の", "と", "も", "な", "ない",
    "ある", "する", "いる", "れる", "られる", "など", "こと", "もの",
    "て", "から", "まで", "より", "でも", "では", "けど", "ので",
}


def compute_distribution_diff(
    gs_df: pd.DataFrame, pt_df: pd.DataFrame
) -> tuple[dict, float, bool]:
    """
    计算两款产品的信号类型分布（百分比），并做卡方检验。

    输入：gs_df（GreenSnap 子集），pt_df（PictureThis 子集）
    输出：(distribution_diff, chi2_pvalue, is_significant)

    分布示例：
    {
        "GreenSnap":   {"feature_pain_point": 0.43, "feature_satisfaction": 0.23},
        "PictureThis": {"feature_pain_point": 0.29, "feature_satisfaction": 0.38},
    }
    """
    all_types = [
        "feature_pain_point", "feature_satisfaction",
        "share_behavior", "retention_motivation", "churn_reason", "ambiguous",
    ]

    def dist(df: pd.DataFrame) -> dict[str, float]:
        counts = df["signal_type"].value_counts()
        total  = counts.sum()
        return {t: round(counts.get(t, 0) / total, 3) for t in all_types}

    gs_dist = dist(gs_df)
    pt_dist = dist(pt_df)

    # 卡方检验：构建列联表（行=竞品，列=信号类型）
    gs_counts = [gs_df["signal_type"].value_counts().get(t, 0) for t in all_types]
    pt_counts = [pt_df["signal_type"].value_counts().get(t, 0) for t in all_types]

    contingency_table = [gs_counts, pt_counts]

    # 过滤全零列（避免卡方检验报错）
    contingency_arr = np.array(contingency_table)
    contingency_arr = contingency_arr[:, contingency_arr.sum(axis=0) > 0]

    try:
        chi2, p_value, _, _ = chi2_contingency(contingency_arr)
    except ValueError:
        p_value = 1.0  # 数据不足，无法检验

    return (
        {"GreenSnap": gs_dist, "PictureThis": pt_dist},
        round(p_value, 4),
        p_value < SIGNIFICANCE_LEVEL,
    )


def extract_keyword_diff(
    gs_df: pd.DataFrame,
    pt_df: pd.DataFrame,
    signal_type: str,
    top_n: int = 5,
) -> dict[str, list[str]]:
    """
    从特定信号类型的 text_ja 中，提取两款产品各自的高频关键词。
    使用字符级 2-gram 频率（无需分词器，兼容所有环境）作为轻量替代。

    为什么用 2-gram 而不是单字？
    日语单字（1-gram）噪音极高（"が"、"の"等），2-gram 已能捕捉核心语义单元
    （"精度が"、"広告が"、"コミュニ"）。完整分词见 clusterer.py。

    输入：gs_df / pt_df（已过滤为特定 signal_type 的子集），top_n
    输出：{"GreenSnap_top": [...], "PictureThis_top": [...]}

    输出示例（signal_type="churn_reason"）：
    {
        "GreenSnap_top":   ["通知が多", "UIが古", "コミュニティ"],
        "PictureThis_top": ["広告が多", "課金圧力", "精度が低"],
    }
    """
    def top_bigrams(df: pd.DataFrame) -> list[str]:
        texts = df[df["signal_type"] == signal_type]["text_ja"].dropna()
        bigram_freq: dict[str, int] = {}
        for text in texts:
            for i in range(len(text) - 1):
                bg = text[i:i+2]
                # 过滤含停用词单字的 bigram
                if bg[0] not in JP_STOPWORDS and bg[1] not in JP_STOPWORDS:
                    bigram_freq[bg] = bigram_freq.get(bg, 0) + 1
        # 按频率降序取 top_n
        return [bg for bg, _ in sorted(bigram_freq.items(),
                                        key=lambda x: -x[1])[:top_n]]

    return {
        "GreenSnap_top":   top_bigrams(gs_df),
        "PictureThis_top": top_bigrams(pt_df),
    }


def compute_weighted_score_diff(
    gs_df: pd.DataFrame, pt_df: pd.DataFrame, signal_type: str
) -> dict[str, float]:
    """
    计算两款产品在某信号类型上的加权分数均值，用于量化对比强度。

    输出示例（signal_type="feature_satisfaction"）：
    {"GreenSnap": 1.24, "PictureThis": 2.18}
    含义：PictureThis 满意度信号的加权强度约为 GreenSnap 的 1.76 倍
    """
    def mean_score(df: pd.DataFrame) -> float:
        sub = df[df["signal_type"] == signal_type]["weighted_score"]
        return round(sub.mean(), 3) if len(sub) > 0 else 0.0

    return {
        "GreenSnap":   mean_score(gs_df),
        "PictureThis": mean_score(pt_df),
    }


def run_differentiation(main_df: pd.DataFrame) -> DiffResult:
    """
    竞品差异化识别主入口。

    输入：main_df
    输出：DiffResult
    """
    # 过滤出两款主竞品（排除 both / other）
    gs_df = main_df[main_df["competitor"] == "GreenSnap"].copy()
    pt_df = main_df[main_df["competitor"] == "PictureThis"].copy()

    print(f"[DIFF] GreenSnap 信号：{len(gs_df)} 条，PictureThis 信号：{len(pt_df)} 条")

    # 分布差异 + 卡方检验
    dist_diff, p_val, is_sig = compute_distribution_diff(gs_df, pt_df)
    sig_label = "显著（p<0.05）" if is_sig else "不显著（p≥0.05）"
    print(f"[DIFF] 分布差异卡方检验：p={p_val}，{sig_label}")

    # 满意度关键词对比
    sat_diff = extract_keyword_diff(gs_df, pt_df, "feature_satisfaction")
    sat_weighted = compute_weighted_score_diff(gs_df, pt_df, "feature_satisfaction")

    # 流失原因关键词对比
    churn_diff = extract_keyword_diff(gs_df, pt_df, "churn_reason")
    churn_weighted = compute_weighted_score_diff(gs_df, pt_df, "churn_reason")

    return DiffResult(
        distribution_diff=dist_diff,
        chi2_pvalue=p_val,
        is_significant=is_sig,
        satisfaction_diff=sat_diff,
        churn_diff=churn_diff,
        satisfaction_weighted=sat_weighted,
        churn_weighted=churn_weighted,
    )
```

---

## 4. clusterer.py

**职责：** 对 `text_ja` 字段做轻量语义聚类，识别「痛点主题簇」和「留存主题簇」。

**核心设计决策：**
- 分词：`fugashi` + `unidic-lite`（第二层已安装），提取名词 + 形容词 + 动词
- 向量化：`TfidfVectorizer`（scikit-learn），字符级 1-3gram 作为兜底（fugashi 不可用时）
- 聚类：`KMeans`（K 值由 Elbow Method 自动选取，范围 3-8）
- 聚类结果标注：每簇前 5 高权重词 → 人工可读簇名

```python
# clusterer.py
# 功能：对 text_ja 做日语 TF-IDF 向量化 + KMeans 聚类，
#       输出痛点主题簇和留存主题簇
# 输入：main_df（loader 输出）
# 输出：ClusterResult（dataclass）
#
# 输出示例：
# ClusterResult(
#   pain_clusters=[
#     ClusterGroup(id=0, size=23, top_terms=["認識精度", "バラバラ", "識別失敗"],
#                  label="識別精度の不安定さ", signals=[...]),
#     ClusterGroup(id=1, size=18, top_terms=["広告", "課金", "プレミアム"],
#                  label="広告・課金圧力", signals=[...]),
#   ],
#   retention_clusters=[
#     ClusterGroup(id=0, size=31, top_terms=["コミュニティ", "仲間", "シェア"],
#                  label="コミュニティ帰属感", signals=[...]),
#   ]
# )

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

# fugashi 分词（可选，不可用时自动回退到字符级 n-gram）
try:
    import fugashi
    _TAGGER = fugashi.Tagger()
    _FUGASHI_AVAILABLE = True
except Exception:
    _TAGGER = None
    _FUGASHI_AVAILABLE = False

# 痛点信号类型
PAIN_TYPES      = {"feature_pain_point", "churn_reason"}
# 留存信号类型
RETENTION_TYPES = {"feature_satisfaction", "retention_motivation", "share_behavior"}

# 聚类 K 值搜索范围
K_MIN, K_MAX = 3, 8

# 日语停用词（扩展版）
JP_STOPWORDS = {
    "が", "を", "は", "に", "で", "の", "と", "も", "な", "ない",
    "ある", "する", "いる", "れる", "られる", "など", "こと", "もの",
    "て", "から", "まで", "より", "でも", "では", "けど", "ので",
    "よう", "ため", "さ", "さん", "ます", "です", "した", "して",
    "GreenSnap", "PictureThis", "グリーンスナップ", "アプリ",
}


@dataclass
class ClusterGroup:
    """单个聚类簇"""
    id:         int
    size:       int
    top_terms:  list[str]     # 簇内 TF-IDF 权重最高的 5 个词
    label:      str           # 自动生成的可读簇名（top_terms[0:2] 拼接）
    signals:    list[dict]    # 簇内信号列表（含 signal_id / text_ja / competitor）


@dataclass
class ClusterResult:
    """聚类分析结果"""
    pain_clusters:      list[ClusterGroup]
    retention_clusters: list[ClusterGroup]
    # 每条 signal 的簇分配（signal_id → cluster_id）
    pain_assignments:      dict[str, int] = field(default_factory=dict)
    retention_assignments: dict[str, int] = field(default_factory=dict)


# ── 日语分词 ──────────────────────────────────────────────────────────────────

def tokenize_ja(text: str) -> str:
    """
    日语分词：提取名词、形容词、动词词根，去除停用词。
    使用 fugashi（可用时）或字符级 2-gram 回退。

    输入："GreenSnapの認識精度がバラバラで信頼できない"
    输出（fugashi）："認識 精度 バラバラ 信頼"
    输出（回退）："認識精 識精度 精度が …"（字符级，用于 TF-IDF 特征提取）
    """
    if _FUGASHI_AVAILABLE and _TAGGER:
        tokens = []
        for word in _TAGGER(text):
            pos = word.feature.pos1  # 品詞（名詞、形容詞、動詞 etc.）
            if pos in ("名詞", "形容詞", "動詞"):
                surface = word.surface
                if surface not in JP_STOPWORDS and len(surface) > 1:
                    tokens.append(surface)
        return " ".join(tokens) if tokens else text
    else:
        # 回退：返回原文（TfidfVectorizer 将使用字符级 analyzer）
        return text


# ── 最优 K 值选取（Elbow + Silhouette） ────────────────────────────────────────

def find_optimal_k(X, k_min: int = K_MIN, k_max: int = K_MAX) -> int:
    """
    通过 Silhouette Score 在 [k_min, k_max] 范围内选取最优 K 值。

    输入：X（TF-IDF 稀疏矩阵），k_min，k_max
    输出：最优 K 值

    选取逻辑：silhouette_score 最高的 K（忽略样本不足时的异常）
    """
    if X.shape[0] < k_min + 1:
        # 样本过少，直接返回最小 K
        return k_min

    best_k, best_score = k_min, -1.0
    for k in range(k_min, min(k_max + 1, X.shape[0])):
        km = KMeans(n_clusters=k, random_state=42, n_init="auto")
        labels = km.fit_predict(X)
        try:
            score = silhouette_score(X, labels, metric="cosine")
        except Exception:
            continue
        if score > best_score:
            best_score, best_k = score, k

    print(f"[CLUSTER] 最优 K={best_k}（Silhouette={best_score:.3f}）")
    return best_k


# ── 核心聚类函数 ─────────────────────────────────────────────────────────────

def cluster_signals(
    df: pd.DataFrame,
    signal_types: set[str],
    group_label: str,
) -> tuple[list[ClusterGroup], dict[str, int]]:
    """
    对特定信号类型子集做 TF-IDF + KMeans 聚类。

    输入：
        df          : main_df
        signal_types: 要聚类的信号类型集合
        group_label : "pain" 或 "retention"（用于日志输出）

    输出：(clusters, assignments)
        clusters    : list[ClusterGroup]
        assignments : {signal_id: cluster_id}
    """
    sub_df = df[df["signal_type"].isin(signal_types)].copy()
    print(f"[CLUSTER] {group_label} 信号子集：{len(sub_df)} 条")

    if len(sub_df) < K_MIN:
        print(f"[CLUSTER] {group_label} 信号数量不足（< {K_MIN}），跳过聚类")
        return [], {}

    # ── 分词 ──────────────────────────────────────────────────────────────────
    sub_df["tokenized"] = sub_df["text_ja"].fillna("").apply(tokenize_ja)

    # ── TF-IDF 向量化 ─────────────────────────────────────────────────────────
    analyzer = "word" if _FUGASHI_AVAILABLE else "char"
    ngram_range = (1, 2) if _FUGASHI_AVAILABLE else (2, 3)

    vectorizer = TfidfVectorizer(
        analyzer=analyzer,
        ngram_range=ngram_range,
        max_features=500,          # 限制特征维度，避免稀疏矩阵过大
        min_df=2,                  # 至少出现 2 次的 n-gram 才纳入特征
        sublinear_tf=True,         # 对词频取对数，缓解高频词主导
    )

    try:
        X = vectorizer.fit_transform(sub_df["tokenized"])
    except ValueError as e:
        print(f"[WARN] TF-IDF 向量化失败：{e}，跳过聚类")
        return [], {}

    # ── 最优 K 值 ─────────────────────────────────────────────────────────────
    k = find_optimal_k(X)

    # ── KMeans 聚类 ───────────────────────────────────────────────────────────
    km = KMeans(n_clusters=k, random_state=42, n_init="auto")
    labels = km.fit_predict(X)
    sub_df = sub_df.copy()
    sub_df["cluster_id"] = labels

    # ── 提取每簇 Top 词 ───────────────────────────────────────────────────────
    feature_names = vectorizer.get_feature_names_out()
    clusters: list[ClusterGroup] = []

    for cluster_id in range(k):
        cluster_mask = labels == cluster_id
        cluster_df   = sub_df[cluster_mask]

        # 簇中心向量 → 权重最高的 5 个词
        centroid = km.cluster_centers_[cluster_id]
        top_indices = centroid.argsort()[-5:][::-1]
        top_terms = [
            feature_names[i] for i in top_indices
            if feature_names[i] not in JP_STOPWORDS
        ]

        # 自动生成簇名（取前两个高权重词，去除空格）
        label = "・".join(top_terms[:2]) if top_terms else f"クラスター{cluster_id}"

        # 簇内信号列表（只保留关键字段，控制输出体积）
        signals = cluster_df[["signal_id", "text_ja", "competitor",
                               "weighted_score", "published_at"]].to_dict(orient="records")

        clusters.append(ClusterGroup(
            id=cluster_id,
            size=int(cluster_mask.sum()),
            top_terms=top_terms,
            label=label,
            signals=signals,
        ))

    # 按簇大小降序排列
    clusters.sort(key=lambda c: -c.size)

    # 构建 signal_id → cluster_id 映射
    assignments = dict(zip(sub_df["signal_id"], sub_df["cluster_id"].astype(int)))

    print(f"[CLUSTER] {group_label} 聚类完成：{k} 个簇，"
          f"最大簇 {clusters[0].size} 条，主题：{clusters[0].label}")

    return clusters, assignments


def run_clustering(main_df: pd.DataFrame) -> ClusterResult:
    """
    聚类主入口，分别对痛点信号和留存信号聚类。

    输入：main_df
    输出：ClusterResult
    """
    pain_clusters, pain_asgn = cluster_signals(main_df, PAIN_TYPES, "pain")
    ret_clusters,  ret_asgn  = cluster_signals(main_df, RETENTION_TYPES, "retention")

    return ClusterResult(
        pain_clusters=pain_clusters,
        retention_clusters=ret_clusters,
        pain_assignments=pain_asgn,
        retention_assignments=ret_asgn,
    )
```

---

## 5. opportunity_generator.py

**职责：** 将痛点聚类 → 自动生成「We should / We should not」格式的产品建议，并输出 `opportunity_matrix.json`。

**核心设计决策：**
- 机会点优先级由「痛点簇的总加权分 × 竞品信号覆盖度」决定（双重过滤）
- `We should not` 直接对应竞品已踩的坑；`We should` 是我们的差异化空间
- 每条机会点附 `evidence_ids`（源 signal_id 列表），便于 PRD 追溯

```python
# opportunity_generator.py
# 功能：从痛点/留存聚类中生成产品机会点，输出结构化 opportunity_matrix.json
# 输入：ClusterResult + AggregationResult + main_df
# 输出：list[OpportunityItem] → opportunity_matrix.json
#
# 输出示例（opportunity_matrix.json 中的一条记录）：
# {
#   "opportunity_id": "OPP_001",
#   "priority": "high",
#   "cluster_type": "pain",
#   "cluster_label": "識別精度の不安定さ",
#   "competitor_source": ["GreenSnap", "PictureThis"],
#   "we_should": "植物識別に複数モデルのアンサンブルを実装し、低確信度時にユーザーへ明示的に通知する",
#   "we_should_not": "単一モデルの識別結果を確認なしで最終結果として表示する",
#   "evidence_ids": ["BLOG_3f7c1a2b", "OC_9a1d4e2f"],
#   "estimated_impact": 0.82,
#   "signal_count": 23
# }

import json
import uuid
from dataclasses import dataclass, asdict, field
from pathlib import Path
import pandas as pd

from clusterer import ClusterResult, ClusterGroup
from aggregator import AggregationResult


@dataclass
class OpportunityItem:
    """单条产品机会点"""
    opportunity_id:    str
    priority:          str            # "high" | "medium" | "low"
    cluster_type:      str            # "pain" | "retention"
    cluster_label:     str            # 聚类自动标注的主题名
    competitor_source: list[str]      # 涉及的竞品列表
    we_should:         str            # 正向行动建议
    we_should_not:     str            # 避坑建议（直接对应竞品痛点）
    evidence_ids:      list[str]      # 源 signal_id，供追溯
    estimated_impact:  float          # 机会点影响力估分（0~1）
    signal_count:      int            # 支撑信号数量
    top_terms:         list[str] = field(default_factory=list)  # 聚类关键词


# ── 机会点优先级计算 ──────────────────────────────────────────────────────────

def compute_impact_score(
    cluster: ClusterGroup,
    main_df: pd.DataFrame,
) -> float:
    """
    计算机会点影响力得分（0~1，越高越值得优先投入）。

    公式：
        impact = (簇内加权分均值 × log(簇大小+1) × 竞品覆盖度) 归一化到 [0,1]

    竞品覆盖度：涉及竞品数量 / 2（最多 2 款竞品）

    输入：cluster（ClusterGroup），main_df
    输出：float
    """
    signal_ids = [s["signal_id"] for s in cluster.signals]
    cluster_df = main_df[main_df["signal_id"].isin(signal_ids)]

    if cluster_df.empty:
        return 0.0

    avg_weighted = cluster_df["weighted_score"].mean()
    size_factor  = float(pd.np.log(cluster.size + 1)) if hasattr(pd, 'np') else \
                   float(__import__('numpy').log(cluster.size + 1))

    competitors_involved = cluster_df["competitor"].unique()
    # 只计 GreenSnap / PictureThis，"both" 按 2 算，"other" 不计
    coverage = sum(
        2 if c == "both" else 1
        for c in competitors_involved
        if c in ("GreenSnap", "PictureThis", "both")
    ) / 2.0
    coverage = min(coverage, 1.0)  # 最大 1.0

    raw_score = avg_weighted * size_factor * (0.5 + 0.5 * coverage)

    # 线性归一化到 [0, 1]（假设满分约为 15，超出时截断）
    return round(min(raw_score / 15.0, 1.0), 3)


def score_to_priority(score: float) -> str:
    """将影响力得分映射为优先级标签"""
    if score >= 0.6:
        return "high"
    elif score >= 0.3:
        return "medium"
    else:
        return "low"


# ── We should / We should not 文本生成 ───────────────────────────────────────

# 痛点簇 → 建议模板
# Key：top_terms 中可能出现的关键词触发词（模糊匹配）
# Value：(we_should, we_should_not)
PAIN_TEMPLATES: list[tuple[list[str], str, str]] = [
    (
        ["認識精度", "識別", "バラバラ", "間違え", "精度"],
        "植物識別に信頼スコアを表示し、低確信度時は複数候補を提示することで誤識別への不安を軽減する",
        "識別結果を検証なしで確定表示する（ユーザーが結果を盲目的に信頼してしまう）",
    ),
    (
        ["広告", "課金", "プレミアム", "有料"],
        "コア機能（識別・記録）を永続的に無料開放し、課金はコミュニティ拡張機能に限定する",
        "識別機能を課金ゲートの後ろに置く（最初の価値体験を阻害する）",
    ),
    (
        ["コミュニティ", "閑散", "過疎", "返信"],
        "投稿へのリアクション設計を簡略化し、初期ユーザーでも返答を受け取れる仕組みを作る",
        "コミュニティをリリース初期から全公開する（活気がない状態が初期離脱を招く）",
    ),
    (
        ["通知", "多すぎ", "うるさい", "スパム"],
        "通知をユーザーが細かくカスタマイズできる設定画面を提供し、デフォルトを最小限に設定する",
        "キャンペーンや更新通知をデフォルトオンで送信する",
    ),
    (
        ["UI", "古い", "使いにくい", "操作"],
        "タスクの主動線を 3 タップ以内に収め、定期的なユーザビリティテストを実施する",
        "機能を増やすたびにナビゲーションを複雑化する（階層が深くなりすぎる）",
    ),
]

RETENTION_TEMPLATES: list[tuple[list[str], str, str]] = [
    (
        ["日記", "記録", "成長", "履歴"],
        "植物の成長記録を時系列タイムラインで可視化し、ユーザーが愛着を持てる個人コレクションを構築できるようにする",
        "記録機能を単なるメモ帳に留める（ゲーミフィケーション要素を欠く）",
    ),
    (
        ["シェア", "SNS", "友達", "Instagram"],
        "記録写真をワンタップで SNS 向けテンプレートに変換できる機能を提供し、自然な口コミを促進する",
        "SNS シェアをアプリ内で完結させず、外部アプリへのスイッチを必要とする導線にする",
    ),
    (
        ["専門家", "知識", "解説", "情報"],
        "識別結果に専門家監修の育て方ガイドを紐付け、アプリ内で完結する学習体験を提供する",
        "識別だけで終わらせる（「なぜ」「どう育てるか」の情報を提供しない）",
    ),
]


def match_template(
    top_terms: list[str],
    templates: list[tuple[list[str], str, str]],
) -> tuple[str, str]:
    """
    根据聚类关键词，在模板库中查找最匹配的建议文本。
    匹配逻辑：统计 top_terms 与每条模板触发词的交集大小，取交集最大的模板。
    无匹配时返回通用建议。

    输入：top_terms=["認識精度", "バラバラ", "識別"], templates=[...]
    输出：(we_should, we_should_not)
    """
    best_score, best_should, best_not = 0, "", ""
    for triggers, should, should_not in templates:
        score = sum(
            1 for term in top_terms
            for trigger in triggers
            if trigger in term or term in trigger
        )
        if score > best_score:
            best_score   = score
            best_should  = should
            best_not     = should_not

    if not best_should:
        # 通用兜底模板
        best_should  = f"「{'・'.join(top_terms[:2])}」に関するユーザー課題を優先的に解消する機能設計を行う"
        best_not     = f"「{'・'.join(top_terms[:2])}」に関連する競合の失敗パターンを繰り返す"

    return best_should, best_not


# ── 主函数 ────────────────────────────────────────────────────────────────────

def generate_opportunities(
    cluster_result: ClusterResult,
    main_df: pd.DataFrame,
    output_path: str = "output/opportunity_matrix.json",
) -> list[OpportunityItem]:
    """
    从聚类结果生成 OpportunityItem 列表，写出 opportunity_matrix.json。

    输入：ClusterResult，main_df
    输出：list[OpportunityItem]（同时写出 JSON）

    输出示例（opportunity_matrix.json 片段）：
    [
      {
        "opportunity_id": "OPP_001",
        "priority": "high",
        "cluster_type": "pain",
        "cluster_label": "認識精度・バラバラ",
        "competitor_source": ["GreenSnap", "PictureThis"],
        "we_should": "植物識別に信頼スコアを表示し...",
        "we_should_not": "識別結果を検証なしで確定表示する...",
        "evidence_ids": ["BLOG_3f7c1a2b", "OC_9a1d4e2f"],
        "estimated_impact": 0.82,
        "signal_count": 23,
        "top_terms": ["認識精度", "バラバラ", "識別失敗"]
      },
      ...
    ]
    """
    opportunities: list[OpportunityItem] = []
    counter = 1

    def _process_clusters(
        clusters: list[ClusterGroup],
        cluster_type: str,
        templates: list,
    ):
        nonlocal counter
        for cluster in clusters:
            signal_ids = [s["signal_id"] for s in cluster.signals]
            cluster_df = main_df[main_df["signal_id"].isin(signal_ids)]

            # 涉及竞品
            raw_competitors = cluster_df["competitor"].unique().tolist()
            competitors = list({
                c for c in raw_competitors
                if c in ("GreenSnap", "PictureThis", "both")
            })
            if "both" in competitors:
                competitors = ["GreenSnap", "PictureThis"]

            # 影响力得分
            impact = compute_impact_score(cluster, main_df)
            priority = score_to_priority(impact)

            # 建议文本
            we_should, we_should_not = match_template(cluster.top_terms, templates)

            opp = OpportunityItem(
                opportunity_id=f"OPP_{counter:03d}",
                priority=priority,
                cluster_type=cluster_type,
                cluster_label=cluster.label,
                competitor_source=competitors,
                we_should=we_should,
                we_should_not=we_should_not,
                evidence_ids=signal_ids[:10],  # 最多保留 10 条证据，控制体积
                estimated_impact=impact,
                signal_count=cluster.size,
                top_terms=cluster.top_terms,
            )
            opportunities.append(opp)
            counter += 1

    _process_clusters(cluster_result.pain_clusters,      "pain",      PAIN_TEMPLATES)
    _process_clusters(cluster_result.retention_clusters, "retention", RETENTION_TEMPLATES)

    # 按优先级 + 影响力降序排列
    priority_order = {"high": 0, "medium": 1, "low": 2}
    opportunities.sort(key=lambda o: (priority_order[o.priority], -o.estimated_impact))

    # 写出 JSON
    output = [asdict(o) for o in opportunities]
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    high_count = sum(1 for o in opportunities if o.priority == "high")
    print(f"[OPP] 生成 {len(opportunities)} 条机会点（high={high_count}）→ {output_path}")

    return opportunities
```

---

## 6. report_writer.py

**职责：** 将所有分析结果整合，输出面向产品团队的 `insights_report.md`（非技术语言，可直接在 Notion / Confluence 中展示）。

**核心设计决策：**
- 报告分为 5 节：执行摘要、竞品分布分析、差异化洞察、机会点矩阵、方法论说明
- 数字全部保留，但解释用非技术语言，不出现「卡方」「p 值」等术语（改为「统计上有显著差异」）
- Markdown 表格对产品团队可读性最好，所有矩阵以表格输出

```python
# report_writer.py
# 功能：将各模块分析结果整合为 insights_report.md
# 输入：AggregationResult, DiffResult, ClusterResult, list[OpportunityItem], main_df
# 输出：insights_report.md（Markdown 格式）

import pandas as pd
from pathlib import Path
from datetime import datetime

from aggregator import AggregationResult
from differentiator import DiffResult
from clusterer import ClusterResult
from opportunity_generator import OpportunityItem


def _df_to_md_table(df: pd.DataFrame, float_fmt: str = ".2f") -> str:
    """
    将 DataFrame 转为 Markdown 表格字符串。

    输入：count_matrix（见 aggregator 输出）
    输出：
    | competitor | feature_pain_point | feature_satisfaction | ... |
    |---|---|---|---|
    | GreenSnap  | 28                 | 15                   | ... |
    """
    df_str = df.copy()
    # 数值格式化
    for col in df_str.select_dtypes(include="float").columns:
        df_str[col] = df_str[col].map(lambda x: f"{x:{float_fmt}}")

    lines = []
    # 表头
    header = "| " + " | ".join([df_str.index.name or ""] + list(df_str.columns)) + " |"
    sep    = "| " + " | ".join(["---"] * (len(df_str.columns) + 1)) + " |"
    lines.extend([header, sep])
    # 行
    for idx, row in df_str.iterrows():
        lines.append("| " + " | ".join([str(idx)] + list(row.astype(str))) + " |")

    return "\n".join(lines)


def write_report(
    agg:          AggregationResult,
    diff:         DiffResult,
    cluster:      ClusterResult,
    opportunities: list[OpportunityItem],
    main_df:      pd.DataFrame,
    output_path:  str = "output/insights_report.md",
) -> None:
    """
    生成 insights_report.md。

    输入：各模块分析结果
    输出：Markdown 报告文件（无返回值）
    """
    now     = datetime.now().strftime("%Y-%m-%d %H:%M")
    n_total = len(main_df)

    # ── 执行摘要统计 ─────────────────────────────────────────────────────────
    high_opps    = [o for o in opportunities if o.priority == "high"]
    gs_count     = int((main_df["competitor"] == "GreenSnap").sum())
    pt_count     = int((main_df["competitor"] == "PictureThis").sum())
    top_pain     = agg.pain_ranking.iloc[0] if len(agg.pain_ranking) > 0 else None
    sig_note     = "（两款产品的信号分布存在统计显著差异）" if diff.is_significant else "（分布差异未达统计显著水平，需扩充样本）"

    # ── 时序趋势文字描述 ──────────────────────────────────────────────────────
    trend_desc = ""
    if not agg.monthly_trend.empty:
        pain_col = "feature_pain_point"
        if pain_col in agg.monthly_trend.columns:
            pain_series = agg.monthly_trend[pain_col]
            if len(pain_series) >= 2:
                trend_dir = "上升" if pain_series.iloc[-1] > pain_series.iloc[0] else "下降"
                trend_desc = (
                    f"从 {pain_series.index[0]} 到 {pain_series.index[-1]}，"
                    f"功能痛点信号呈**{trend_dir}**趋势"
                    f"（{int(pain_series.iloc[0])} 条 → {int(pain_series.iloc[-1])} 条）。"
                )

    # ── 报告正文 ─────────────────────────────────────────────────────────────
    sections: list[str] = []

    # 封面
    sections.append(f"""# Pixel Herbarium 竞品用户研究报告

> **数据来源：** LINE BLOG / LINE Research / LINE OpenChat 人工观察  
> **分析范围：** GreenSnap、PictureThis JP  
> **生成时间：** {now}  
> **分析信号总量：** {n_total} 条（已过滤置信度 < 0.3 的低质量信号）

---
""")

    # 1. 执行摘要
    top_opp_text = ""
    if high_opps:
        top_opp_text = "\n".join(
            f"- **{o.cluster_label}**：{o.we_should[:40]}…"
            for o in high_opps[:3]
        )

    sections.append(f"""## 1. 执行摘要

本次研究共分析 **{n_total}** 条有效竞品用户信号，覆盖 GreenSnap（{gs_count} 条）
和 PictureThis（{pt_count} 条）。两款产品的用户声音在信号类型分布上{'' if diff.is_significant else '暂'}存在显著差异{sig_note}。

**核心发现：**

- 优先级最高的用户痛点来自「{top_pain['competitor'] if top_pain is not None else '—'}」的「{top_pain['signal_type'] if top_pain is not None else '—'}」，
  加权影响力得分 **{top_pain['total_weighted']:.1f}**，代表性用户声音：
  > 「{top_pain['top_signal_text'] if top_pain is not None else '—'}...」

- {trend_desc}

- 识别出 **{len(high_opps)}** 个高优先级产品机会点：
{top_opp_text}

---
""")

    # 2. 信号分布分析
    count_table = _df_to_md_table(agg.count_matrix)
    weighted_table = _df_to_md_table(agg.weighted_matrix, float_fmt=".1f")

    sections.append(f"""## 2. 信号分布分析

### 2.1 竞品 × 信号类型交叉频率

下表展示每款产品各信号类型的原始出现次数。

{count_table}

> **解读：** 数值越高，代表该产品在该维度上用户讨论越活跃。
> 高「feature_pain_point」值意味着该功能痛点被频繁提及，是优先改善的方向。

### 2.2 加权影响力矩阵

下表在原始频次基础上，叠加了「互动分数 × 数据源可信度」权重，
更真实反映各痛点对用户的实际影响程度。

{weighted_table}

### 2.3 真实痛点权重 Top 10

| 排名 | 竞品 | 信号类型 | 加权总分 | 信号数量 | 代表性用户声音 |
|---|---|---|---|---|---|
""")

    for _, row in agg.pain_ranking.iterrows():
        sections[-1] += (
            f"| {row.name} | {row['competitor']} | {row['signal_type']} "
            f"| {row['total_weighted']:.1f} | {row['signal_count']} "
            f"| 「{row['top_signal_text'][:30]}…」 |\n"
        )

    # 时序趋势
    if not agg.monthly_trend.empty:
        trend_table = _df_to_md_table(agg.monthly_trend)
        sections.append(f"""### 2.4 月度时序趋势

> 每月各信号类型的出现次数（`published_at` 为空的信号不计入）。

{trend_table}

{trend_desc}

---
""")

    # 3. 竞品差异化洞察
    gs_sat_score = diff.satisfaction_weighted.get("GreenSnap", 0)
    pt_sat_score = diff.satisfaction_weighted.get("PictureThis", 0)
    gs_churn_score = diff.churn_weighted.get("GreenSnap", 0)
    pt_churn_score = diff.churn_weighted.get("PictureThis", 0)

    sections.append(f"""## 3. 竞品差异化洞察

### 3.1 用户满意度对比

| 维度 | GreenSnap | PictureThis |
|---|---|---|
| 满意度信号加权强度 | {gs_sat_score:.2f} | {pt_sat_score:.2f} |
| 流失原因信号加权强度 | {gs_churn_score:.2f} | {pt_churn_score:.2f} |

**GreenSnap 用户满意度关键词：** {' / '.join(diff.satisfaction_diff.get('GreenSnap_top', []))}  
**PictureThis 用户满意度关键词：** {' / '.join(diff.satisfaction_diff.get('PictureThis_top', []))}  

**GreenSnap 流失原因关键词：** {' / '.join(diff.churn_diff.get('GreenSnap_top', []))}  
**PictureThis 流失原因关键词：** {' / '.join(diff.churn_diff.get('PictureThis_top', []))}  

> **解读：** 满意度加权强度更高的产品，说明其正向用户声音更集中且被高互动内容放大。
> 流失原因强度更高则意味着该产品的离开动机在用户中更为共鸣。

---
""")

    # 4. 痛点聚类
    sections.append("## 4. 高价值信号聚类\n\n### 4.1 痛点主题簇\n\n")
    for c in cluster.pain_clusters:
        comp_tags = "、".join(set(
            s.get("competitor", "") for s in c.signals
            if s.get("competitor") in ("GreenSnap", "PictureThis")
        ))
        sections[-1] += (
            f"#### 痛点簇 {c.id + 1}：{c.label}（{c.size} 条信号）\n\n"
            f"- **涉及竞品：** {comp_tags or '—'}\n"
            f"- **核心关键词：** {' / '.join(c.top_terms)}\n"
            f"- **代表性声音：**\n"
        )
        # 最多展示 3 条代表信号
        for s in c.signals[:3]:
            text_preview = str(s.get("text_ja", ""))[:60]
            sections[-1] += f"  > 「{text_preview}…」\n"
        sections[-1] += "\n"

    sections.append("### 4.2 留存主题簇\n\n")
    for c in cluster.retention_clusters:
        comp_tags = "、".join(set(
            s.get("competitor", "") for s in c.signals
            if s.get("competitor") in ("GreenSnap", "PictureThis")
        ))
        sections[-1] += (
            f"#### 留存簇 {c.id + 1}：{c.label}（{c.size} 条信号）\n\n"
            f"- **涉及竞品：** {comp_tags or '—'}\n"
            f"- **核心关键词：** {' / '.join(c.top_terms)}\n"
            f"- **代表性声音：**\n"
        )
        for s in c.signals[:3]:
            text_preview = str(s.get("text_ja", ""))[:60]
            sections[-1] += f"  > 「{text_preview}…」\n"
        sections[-1] += "\n"

    sections.append("---\n")

    # 5. 机会点矩阵
    sections.append("""## 5. Pixel Herbarium 产品机会点

> 以下建议直接源于竞品用户痛点和留存动因，每条附有来源信号追踪码，
> 可在 `opportunity_matrix.json` 中按 `opportunity_id` 检索完整证据链。

""")

    for priority_label in ["high", "medium", "low"]:
        group = [o for o in opportunities if o.priority == priority_label]
        if not group:
            continue
        emoji = {"high": "🔴", "medium": "🟡", "low": "⚪️"}[priority_label]
        sections[-1] += f"### {emoji} {priority_label.upper()} 优先级（{len(group)} 条）\n\n"

        for o in group:
            sections[-1] += (
                f"#### [{o.opportunity_id}] {o.cluster_label}\n\n"
                f"| 字段 | 内容 |\n|---|---|\n"
                f"| 涉及竞品 | {' / '.join(o.competitor_source) or '—'} |\n"
                f"| 影响力得分 | {o.estimated_impact:.2f} / 1.00 |\n"
                f"| 支撑信号数 | {o.signal_count} 条 |\n"
                f"| 聚类关键词 | {' / '.join(o.top_terms)} |\n\n"
                f"**✅ We should：**  \n{o.we_should}\n\n"
                f"**❌ We should not：**  \n{o.we_should_not}\n\n"
                f"<sub>证据 ID：{', '.join(o.evidence_ids[:5])}{'...' if len(o.evidence_ids) > 5 else ''}</sub>\n\n"
                f"---\n\n"
            )

    # 6. 方法论说明
    sections.append(f"""## 6. 方法论说明

| 项目 | 说明 |
|---|---|
| 数据来源 | LINE BLOG、LINE Research 官方报告、LINE OpenChat 人工观察 |
| 信号总量（含存档） | 原始读取总量（见运行日志） |
| 主分析信号量 | {n_total} 条（confidence ≥ 0.3） |
| 低置信度存档 | confidence < 0.3 的信号存入 `archived_ambiguous.json`，不进入本报告 |
| 数据源权重 | LINE Research × 1.5 / OpenChat × 1.2 / BLOG × 1.0 |
| 聚类方法 | TF-IDF（日语名词/形容词/动词）+ KMeans，K 值由 Silhouette Score 自动选取 |
| 机会点优先级 | 加权分均值 × log(簇大小) × 竞品覆盖度，归一化到 [0, 1] |
| 差异显著性 | 卡方检验（显著水平 p < 0.05），p={diff.chi2_pvalue} |

*本报告由 `layer3/pipeline.py` 自动生成，如需更新，重新执行 pipeline 即可。*
""")

    # ── 写出文件 ──────────────────────────────────────────────────────────────
    report_text = "\n".join(sections)
    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(report_text, encoding="utf-8")

    print(f"[REPORT] insights_report.md 已写出 → {output_path}")
    print(f"[REPORT] 报告字数：约 {len(report_text):,} 字符")
```

---

## 7. pipeline.py

**职责：** 串联所有模块，提供一键运行的端到端入口。

```python
# pipeline.py
# 第三层端到端运行入口
# 使用方式：python pipeline.py [--input output/all_signals.json] [--out-dir output/]
#
# 典型运行输出：
# ============================================================
# 第三层 · 模式识别与洞察生成 Pipeline 开始
# ============================================================
# [LOAD] 读取 312 条原始信号 ← output/all_signals.json
# [LOAD] 主信号集：289 条（confidence ≥ 0.3）
# [LOAD] 低置信度存档：23 条 → output/archived_ambiguous.json
# [AGGREGATOR] 构建交叉频率矩阵...
# [AGGREGATOR] 构建负向信号加权排序...
# [AGGREGATOR] 构建月度时序趋势...
# [DIFF] GreenSnap 信号：142 条，PictureThis 信号：98 条
# [DIFF] 分布差异卡方检验：p=0.021，显著（p<0.05）
# [CLUSTER] pain 信号子集：163 条
# [CLUSTER] 最优 K=5（Silhouette=0.412）
# [CLUSTER] retention 信号子集：89 条
# [CLUSTER] 最优 K=3（Silhouette=0.381）
# [OPP] 生成 8 条机会点（high=3）→ output/opportunity_matrix.json
# [REPORT] insights_report.md 已写出 → output/insights_report.md
# ============================================================
# 第三层完成！
# 产出物：
#   · output/insights_report.md       （产品团队可读报告）
#   · output/opportunity_matrix.json  （PRD 引用数据）
#   · output/archived_ambiguous.json  （低置信度信号存档）
# ============================================================

import argparse
from pathlib import Path

from loader               import load_signals
from aggregator           import run_aggregation
from differentiator       import run_differentiation
from clusterer            import run_clustering
from opportunity_generator import generate_opportunities
from report_writer        import write_report


def run_pipeline(
    input_path:   str = "output/all_signals.json",
    out_dir:      str = "output/",
) -> None:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("第三层 · 模式识别与洞察生成 Pipeline 开始")
    print("=" * 60)

    # ── 1. 加载与过滤 ─────────────────────────────────────────────────────────
    print("\n[1/6] 数据加载与置信度过滤...")
    main_df, archived_df = load_signals(
        input_path=input_path,
        archive_path=str(out / "archived_ambiguous.json"),
    )

    # ── 2. 聚合统计 ────────────────────────────────────────────────────────────
    print("\n[2/6] 信号聚合与统计分析...")
    agg_result = run_aggregation(main_df)

    # ── 3. 竞品差异化 ─────────────────────────────────────────────────────────
    print("\n[3/6] 竞品差异化识别...")
    diff_result = run_differentiation(main_df)

    # ── 4. 语义聚类 ────────────────────────────────────────────────────────────
    print("\n[4/6] 高价值信号语义聚类...")
    cluster_result = run_clustering(main_df)

    # ── 5. 机会点生成 ─────────────────────────────────────────────────────────
    print("\n[5/6] Pixel Herbarium 机会点生成...")
    opportunities = generate_opportunities(
        cluster_result=cluster_result,
        main_df=main_df,
        output_path=str(out / "opportunity_matrix.json"),
    )

    # ── 6. 报告写出 ────────────────────────────────────────────────────────────
    print("\n[6/6] insights_report.md 写出...")
    write_report(
        agg=agg_result,
        diff=diff_result,
        cluster=cluster_result,
        opportunities=opportunities,
        main_df=main_df,
        output_path=str(out / "insights_report.md"),
    )

    print(f"\n{'=' * 60}")
    print("第三层完成！")
    print("产出物：")
    print(f"  · {out}/insights_report.md       （产品团队可读报告）")
    print(f"  · {out}/opportunity_matrix.json  （PRD 引用数据）")
    print(f"  · {out}/archived_ambiguous.json  （低置信度信号存档）")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="第三层：模式识别与洞察生成")
    parser.add_argument(
        "--input", default="output/all_signals.json",
        help="all_signals.json 路径（默认：output/all_signals.json）"
    )
    parser.add_argument(
        "--out-dir", default="output/",
        help="产出物输出目录（默认：output/）"
    )
    args = parser.parse_args()
    run_pipeline(input_path=args.input, out_dir=args.out_dir)
```

---

## 8. 输出产物格式规范

### 8.1 `opportunity_matrix.json` 完整字段说明

```json
[
  {
    "opportunity_id":    "OPP_001",
    "priority":          "high",
    "cluster_type":      "pain",
    "cluster_label":     "認識精度・バラバラ",
    "competitor_source": ["GreenSnap", "PictureThis"],
    "we_should":         "植物識別に信頼スコアを表示し、低確信度時は複数候補を提示することで誤識別への不安を軽減する",
    "we_should_not":     "識別結果を検証なしで確定表示する（ユーザーが結果を盲目的に信頼してしまう）",
    "evidence_ids":      ["BLOG_3f7c1a2b", "OC_9a1d4e2f", "RSRCH_5b2c8d1e"],
    "estimated_impact":  0.82,
    "signal_count":      23,
    "top_terms":         ["認識精度", "バラバラ", "識別失敗", "信頼できない", "精度が"]
  },
  {
    "opportunity_id":    "OPP_002",
    "priority":          "high",
    "cluster_type":      "pain",
    "cluster_label":     "広告・課金圧力",
    "competitor_source": ["PictureThis"],
    "we_should":         "コア機能（識別・記録）を永続的に無料開放し、課金はコミュニティ拡張機能に限定する",
    "we_should_not":     "識別機能を課金ゲートの後ろに置く（最初の価値体験を阻害する）",
    "evidence_ids":      ["BLOG_a4e2f9b1", "OC_c7d3a1b2"],
    "estimated_impact":  0.74,
    "signal_count":      18,
    "top_terms":         ["広告", "課金", "プレミアム", "有料", "無料で"]
  }
]
```

### 8.2 `insights_report.md` 章节结构

```
# Pixel Herbarium 竞品用户研究报告
## 1. 执行摘要
## 2. 信号分布分析
  ### 2.1 竞品 × 信号类型交叉频率（计数矩阵）
  ### 2.2 加权影响力矩阵
  ### 2.3 真实痛点权重 Top 10
  ### 2.4 月度时序趋势（可选）
## 3. 竞品差异化洞察
  ### 3.1 用户满意度对比
## 4. 高价值信号聚类
  ### 4.1 痛点主题簇
  ### 4.2 留存主题簇
## 5. Pixel Herbarium 产品机会点
  ### 🔴 HIGH 优先级
  ### 🟡 MEDIUM 优先级
  ### ⚪️ LOW 优先级
## 6. 方法论说明
```

### 8.3 `archived_ambiguous.json` 说明

低置信度信号（`confidence < 0.3`）的存档文件。格式与 `all_signals.json` 相同，
附加 `source_weight` 和 `weighted_score` 两个衍生字段。

**用途：**
- 人工复核后可提升置信度并重新注入 `all_signals.json` 再次运行 pipeline
- 作为第二层信号分类器改进的负样本参考

---

## 附录：模块间数据依赖关系

```
all_signals.json
       │
       ▼
  loader.py
  ├── main_df          ──→ aggregator.py ──→ AggregationResult
  │                    ──→ differentiator.py ──→ DiffResult
  │                    ──→ clusterer.py ──→ ClusterResult
  │                    │                       │
  │                    └───────────────────────┼──→ opportunity_generator.py
  │                                            │         │
  └── archived_df ──→ archived_ambiguous.json  │         ▼
                                               │    opportunity_matrix.json
                                               │
                                    AggregationResult
                                    DiffResult          ──→ report_writer.py
                                    ClusterResult                  │
                                    list[OpportunityItem]          ▼
                                                          insights_report.md
```

---

*本文件是竞品用户研究技术方案的第三层，对应「模式识别与洞察生成」阶段。*  
*上游依赖：`output/all_signals.json`（第二层产出）*  
*下游交付：`insights_report.md` → 产品团队 / `opportunity_matrix.json` → PRD 文档*
