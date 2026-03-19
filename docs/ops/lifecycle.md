# 开发与运营生命周期

> 产品从设计到运营的完整流程框架。当前仅 Phase 2 已落地，其余阶段在首次上架后基于实际经验逐步补充。

---

## 适用范围

PH 项目及后续同类 App 产品（花/植物/文化收集类）。

---

## 四阶段总览

### Phase 1: 设计与准备 `[待建]`

产品从 0 到可构建状态的全部准备工作。

- **产品调研与定型** — 竞品分析、用户画像、市场验证、核心循环设计
- **方案设计** — 技术选型、信息架构、设计系统、数据模型
- **基础数据准备** — 植物数据库、地点数据、翻译文件、素材资源

→ 参考：[product-spec.md](../product-spec.md) · [research/](../research/) · [design-system.md](../design-system.md)

---

### Phase 2: 上架审核 ← 当前已落地

每次提交应用商店前的系统性审查流程。

- **Apple App Store** — 完整 Runbook 已建立
- **Google Play** `[待建]`
- **其他平台** `[待建]`

→ 主文档：[submission-review.md](../app-store-prep/submission-review.md)
→ 子文档：[compliance-checklist.md](../app-store-prep/compliance-checklist.md) · [review-notes.md](../app-store-prep/review-notes.md) · [store-listing.md](../app-store-prep/store-listing.md)

---

### Phase 3: 正式运营 `[待建]`

上架后的持续运营与迭代。

- **技术更新** — OTA 推送、native build 迭代、版本管理
- **内容完善** — 季节更新（花期数据刷新）、地点扩充、翻译维护
- **商业推广** — Instagram（#花めぐり）、X/Twitter、LINE OA、目的地本国平台

→ 参考：[docs/aso/](../aso/) · [docs/ops/](../ops/)

---

### Phase 4: 应急机制 `[待建]`

异常情况的预案与响应流程。

- **审核拒绝恢复** — Resolution Center 处理 → 修复 → 重提交
- **账号违规/处罚** — 申诉流程、风险评估、备用方案
- **线上事故响应** — 崩溃激增、数据泄露、服务中断

→ 参考：[docs/postmortems/](../postmortems/)

---

## 文档演进规则

1. 每个 Phase 独立子文档，lifecycle.md **仅做索引**
2. 首次上架完成后，基于实际经验补充 Phase 3/4
3. 跨项目复用时，提取通用部分到 `~/.claude/workflows/`
4. `[待建]` 标记在对应文档创建后移除

---

*Created: 2026-03-19 · Last updated: 2026-03-19*
