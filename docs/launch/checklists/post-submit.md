# Post-Submit Monitoring Checklist

> 提交审核后操作 + 首 24h 监控。按阶段顺序执行。

---

## 阶段 1：审核通过后操作

### 发布操作

- [ ] ASC 发布方式确认为 **手动发布**（Manually Release）而非自动发布
- [ ] 确认 App Store 版本页面状态变为 "Ready for Sale"
- [ ] 在 iPhone 日本区 App Store 搜索 「ピクセル植物図鑑」，确认 App 可被搜索到
- [ ] 确认 App 图标、截图、描述文案在商店页面显示正确

### 多市场发布策略（日本先行）

- [ ] 日本（JP）区域已上线并可公开下载
- [ ] 其他地区（全球）发布时间已在 ASC 「可用性」中预设，或已记录待办日期

---

## 阶段 2：首 24h 监控

### 崩溃率（Crashlytics）

- [ ] Crashlytics Dashboard 已打开并确认数据开始收集
- [ ] Crash-free users rate > **99%**（目标：< 1% 崩溃率）
- [ ] 若出现 P0 崩溃（影响启动/核心流程），立即进入 Hotfix 流程

### 下载与留存（ASC Analytics）

- [ ] ASC App Analytics 确认有下载数据（通常延迟 24-48h）
- [ ] 首批用户会话数已记录（作为运营基线写入 `ops/monitoring-baseline.md`）

### 用户评分

- [ ] App Store 评分页面无 1-2 星评价爆发（如有，立即查阅 `ops/review-reply-guide.md`）
- [ ] 目标首周平均评分 ≥ **4.0**

---

## 阶段 3：被拒处理入口

若审核状态变为 "Rejected" 或 "Metadata Rejected"：

- [ ] 前往 `docs/launch/rejection-playbook.md` 按 8 步标准恢复流程处理
- [ ] 定位 Guideline 编号 → 查速查表 → 修复 → 重交
- [ ] 修复完成后更新 `rejection-playbook.md` "AHB 历史被拒记录" 区块

---

*Checklist v1.0 · 2026-03-29*
