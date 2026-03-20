# 上架审核 Runbook

> 每次提交 App Store 前，按 Phase 顺序逐项执行。
> - **首次提交**：全量执行
> - **版本更新**：跳过标注 `[首次]` 的项目（见附录 C 简化版）
> - 标注 🤖 的检查项可由 Claude 自动执行

---

## Phase A: 代码层审查 🤖

### A1. 权限描述本地化

- [ ] 检查命令：`grep "NSCameraUsageDescription\|NSLocation\|NSPhotoLibrary" app.json`
- [ ] 要求：所有 `NS*UsageDescription` 为目标市场语言（日语）
- [ ] 同步检查：expo plugins 中的权限描述（cameraPermission / locationWhenInUsePermission 等）
- 关联：Guideline 5.1.1

### A2. 多余权限清理

- [ ] 对照 `android.permissions` 列表，逐项确认有对应功能实现
- [ ] 禁止：声明了但未使用的权限（如 RECORD_AUDIO）
- [ ] 检查命令：`grep -c "android.permission" app.json` → 与实际功能数量对比

### A3. i18n 覆盖率

- [ ] 检查命令：`npx jest --testPathPattern=i18n`
- [ ] 要求：ja/en key 完全对等，0 缺失
- [ ] 抽查：确认无硬编码日语/英语字符串在 `.tsx` 组件中

### A4. AI 生成内容标注

- [ ] 检查命令：`grep -r "ai.generated" src/`
- [ ] 要求：所有 AI 渲染图（pixel art）展示位置有 "AI生成" 标注
- [ ] 关联位置：`plant/[id].tsx`（详情页）、`discover.tsx`（识别结果）
- 关联：App Store 2025.11 AI 透明度要求

### A5. 错误处理覆盖

- [ ] 每个 tab 组件被 `ErrorBoundary` 包裹
- [ ] 所有网络请求（识别/打卡/同步）有 try-catch + i18n 错误提示
- [ ] 断网状态显示 `OfflineBanner`（非崩溃/白屏）
- [ ] 离线队列（spot-store `flushOfflineQueue`）正常工作

### A6. Review Prompt 时机

- [ ] 不在首次启动触发
- [ ] 仅在核心功能完成后触发（firstCheckin / fiveCheckins）
- [ ] cooldown ≥ 30 天（`COOLDOWN_MS` 常量）

### A7. 测试 + 类型检查

- [ ] `npx jest` — 全通过
- [ ] `npx tsc --noEmit` — 0 errors

---

## Phase B: 元数据审查

### B1. ASO 元数据 `[首次]`

- [ ] → `docs/aso/app-store-metadata-ja.md`
- [ ] 名称 ≤30 字、副标题 ≤30 字、关键词 ≤100 字、描述 ≤4000 字
- [ ] 无竞品名称（PictureThis、GreenSnap 等）
- [ ] 无未实现功能的描述

### B2. Review Notes

- [ ] → `docs/app-store-prep/review-notes.md`
- [ ] 包含：Guest 模式说明、测试账号、功能路径、权限用途、AI 说明、无 IAP 声明
- [ ] 版本更新时：补充"本次改了什么"

### B3. 隐私政策

- [ ] URL 可访问：`curl -s -o /dev/null -w "%{http_code}" https://pixel-herbarium.com/privacy-policy`（期望 200）
- [ ] 内容覆盖：数据类型、使用目的、第三方共享、用户权利、账号删除
- [ ] App 内 Settings → Privacy Settings 可跳转

### B4. 截图一致性

- [ ] 每张截图对应当前版本真实 UI（非 mockup）
- [ ] 无未实现功能的截图
- [ ] 覆盖 6.9" 设备尺寸

### B5. 功能声明一致性

- [ ] → `compliance-checklist.md` §5
- [ ] 描述中提及的每个功能在当前版本中可正常使用

---

## Phase C: App Store Connect 填写（手动）

### C1. Privacy Nutrition Label `[首次]`

- [ ] → `compliance-checklist.md` §4 表格
- [ ] 逐项填写数据收集类型（邮箱、位置、照片、设备 ID、使用数据）

### C2. 年龄分级 `[首次]`

- [ ] 完成年龄评级问卷 → 4+

### C3. Review Notes 粘贴

- [ ] 复制 `review-notes.md` 内容到 App Store Connect → Review Notes

### C4. AI 生成内容

- [ ] ASC 中勾选 AI 生成内容选项

### C5. 发布设置

- [ ] 手动发布（审核通过后自己确认上线）
- [ ] 可用地区：日本优先

---

## Phase D: 构建与提交

### D1. Production Build

```bash
cd D:/projects/Games/gardern/pixel-herbarium
npx eas build --profile production --platform ios
```

- [ ] 等待完成（~15-30 min）
- [ ] 确认 build status: finished

### D2. Submit

```bash
npx eas submit --platform ios --latest
```

- [ ] 等待 Apple 处理（10-30 min）
- [ ] 在 ASC 中确认 build 出现在版本选择列表

### D3. 真机最终验证

- [ ] 在 production build 上完整走一遍：
  1. 冷启动 → 无崩溃
  2. Onboarding 3 slides → 完整展示
  3. Guest 浏览 → Home/Map/Herbarium/Settings 正常
  4. Apple Sign In → 登录成功
  5. 发見タブ → 拍照 → AI 识别 → 结果展示
  6. 地図タブ → 打卡 → Stamp card 保存
  7. 分享 → LINE/Instagram/保存到相册
  8. 断网 → OfflineBanner 显示，不崩溃
  9. Settings → Privacy → 账号删除可达

---

## Phase E: 审核后

### E1. 审核通过

- [ ] 手动点击"发布到 App Store"
- [ ] 确认应用在 App Store 可搜索（可能需 24h 索引）

### E2. 审核拒绝 — 恢复路径

```
收到拒绝邮件
    ↓
App Store Connect → Resolution Center 查看完整原因
    ↓
对照 App Store Review Guidelines 定位具体条款
    ↓
真机 clean install 复现问题
    ↓
修复 → 撰写回复说明（改了什么、在哪里验证）
    ↓
Resolution Center 回复 OR 提交新 Build
```

- 不到万不得已不申诉（申诉处理时间 > 修复重交时间）
- 仅在确信审核员误判时使用申诉，用事实性语言

---

## 附录 A: 日本市场专项检查

- [ ] 权限弹窗文案为日语（非英语）
- [ ] 隐私政策有日语版本
- [ ] 日期格式：YYYY年M月D日（`Intl.DateTimeFormat('ja-JP')`）
- [ ] 货币格式：¥X,XXX（无小数）
- [ ] 姓名顺序：姓在前
- [ ] IME 组合输入不触发多余搜索请求（Composition 事件处理）
- [ ] 字体：iOS 系统字体 + HiraginoMaruGothicProN（display）
- [ ] 行高 ≥ 1.7（日语排版推荐）
- [ ] APPI 合规：数据跨境传输告知（PlantNet API 在爱沙尼亚）
- [ ] LINE 集成：`LSApplicationQueriesSchemes` 含 `"line"`

## 附录 B: 2026 年新增合规速查

| 要求 | 生效时间 | 行动项 |
|------|---------|--------|
| AI 透明度披露 | 2025.11 | 标注 AI 生成内容，获取用户同意 |
| 新年龄评级体系（13+/16+/18+）| 2025.7 | 重新填写年龄评级问卷 |
| Xcode 26 + iOS 26 SDK 强制 | 2026.4 | 升级构建环境 |
| 日本 MSCA 法案 | 2026 | 第三方支付/分发选项（如适用）|

## 附录 C: 版本更新简化版

版本更新（非首次提交）仅需执行：

| 必做 | 条件性 |
|------|--------|
| A5 错误处理 | A1-A2（如改了 app.json） |
| A7 测试+类型 | B1 元数据（如改了名称/描述） |
| B2 Review Notes（更新说明）| C1-C4（如改了数据收集） |
| B4 截图一致性 | |
| D1-D3 构建提交验证 | |

---

*Created: 2026-03-19 · Last updated: 2026-03-19*
*数据来源：App Store Review Guidelines 2026、APPI 2025-2026 合规指南、日本 MSCA 官方文档*
