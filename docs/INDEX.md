# Pixel Herbarium 文档索引

> 五域导航：Product · Design · Dev · Launch · Ops
> **docs/ = Single Source of Truth** · Session 开始时读本文件 + `../CLAUDE.md`

---

## D1 · Product（产品）

| 文件 | 说明 |
|------|------|
| [product/product-spec.md](product/product-spec.md) | Core Loop · 稀有度 · FOMO规则 · 分享格式 |
| [product/competitive-insights.md](product/competitive-insights.md) | 竞品矩阵 · 监控配置 · scrapling集成 |
| [product/research/](product/research/) | 26份调研报告（competitor/market/platform/data/design/launch） |

**研究快查：**
- `product/research/competitor/` — 6份竞品深度分析（FLOWERY、桜ナビ、Weathernews众包等）
- `product/research/market/` — Adult Kawaii验证 · 日本市场TAM/SAM/SOM
- `product/research/platform/` — Instagram/X/LINE/YouTube搜索策略
- `product/research/data/` — 景点数据源合规指南 · 用户评论收集SOP
- `product/research/design/` — 印章设计 · 樱花UI资源
- `product/research/launch/` — 本土化checklist

---

## D2 · Design（设计）

| 文件 | 说明 |
|------|------|
| [design/design-system.md](design/design-system.md) | 颜色 · 字体 · Adult Kawaii定义 · 组件规范 |
| [design/specs/](design/specs/) | 14份功能设计文档（YYYY-MM-DD格式） |

**设计规格速查：**
- `design/specs/2026-03-20-*.md` — 最新：stamp-b2 · in-app-guidance · screenshots-pipeline
- `design/specs/2026-03-18-*.md` — content-pack · onboarding · share-poster · hanakotoba-flip
- `design/specs/2026-03-17-*.md` — check-in-mvp · herbarium-collection · spot-discovery
- `design/specs/2026-03-15-*.md` — i18n · ota-update · auth-flow

---

## D3 · Dev（开发）

| 文件 | 说明 |
|------|------|
| [dev/architecture.md](dev/architecture.md) | 技术架构 · 目录结构 · 开发状态 |
| [dev/guide/bugfix-workflow.md](dev/guide/bugfix-workflow.md) | Bug分类与修复流程 |
| [dev/guide/spring-flower-identification.md](dev/guide/spring-flower-identification.md) | 植物数据校验参考（六姐妹物候时序） |
| [dev/postmortems/](dev/postmortems/) | 事故复盘（2026-03-18 infinite-spinner） |

**关键约束（开发必读）：**
- OTA 不能改变 hook 数量 → 新增 useState/useEffect 必须 native build
- `auth-store.ts` 初始 `loading: true`（不是 false）
- Apple Sign-In 只在 catch 中重置 submitting（不在 finally）

---

## D4 · Launch（上架）

| 文件 | 说明 |
|------|------|
| [launch/app-store-prep/submission-review.md](launch/app-store-prep/submission-review.md) | **上架审核 Runbook**（提交前必读） |
| [launch/app-store-prep/](launch/app-store-prep/) | 合规checklist · 隐私政策 · 服务条款 · 截图规格（6文件） |
| [launch/aso/](launch/aso/) | 元数据(ja/en) · 关键词策略 · LINE/X/打卡推广文案（6文件） |
| [launch/privacy-policy-ja.md](launch/privacy-policy-ja.md) | 隐私政策日文版 |

**P0 阻塞（上线前必须完成）：**
- C3：満開home截图替换 → ASC上传 6.9" iPhone 16 Pro Max（手动）
- Production Build：`eas build --profile production --platform ios`（EAS额度4/1重置后）

---

## D5 · Ops（运营）

| 文件 | 说明 |
|------|------|
| [ops/lifecycle.md](ops/lifecycle.md) | 开发与运营生命周期总纲（4 Phase框架） |
| [ops/testflight-guide.md](ops/testflight-guide.md) | TestFlight分发配置 |
| [ops/line-oa-setup.md](ops/line-oa-setup.md) | LINE Official Account频道配置 |
| [ops/monitoring-baseline.md](ops/monitoring-baseline.md) | 运营监控指标基线（上线后建立） |
| [ops/review-reply-guide.md](ops/review-reply-guide.md) | App Store评论回复规范（日语模板） |
| [ops/season-calendar.md](ops/season-calendar.md) | 季节内容更新日历（全年运营节奏） |

---

## 归档

- [`.archive/completed-plans/`](.archive/completed-plans/) — 已完成的实施计划（9份）

---

## 外部数据源

| 系统 | 存储内容 | 访问方式 |
|------|---------|---------|
| Claude Memory | 设计约束 · 移动端规则 · CI配置 | Session自动注入 |
| scrapling-mcp | 竞品评论 · 市场信号 · 趋势数据 | `scrapling` MCP工具 |
| Supabase | 花卉景点数据(519条) · 用户数据 | `supabase` MCP / Dashboard |
| Codemagic | E2E测试结果 · CI截图 | Dashboard / artifacts |
| app-status.json | 阶段进度 · Gate状态 · 运营指标 | `~/.claude/data/app-status/app-herbarium.json` |

---

*文档体系版本 v2.0 · 五域重组 · 2026-03-20*
