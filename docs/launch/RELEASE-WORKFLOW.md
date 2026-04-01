# AHB iOS 全链路发版工作流

> 花図鉑 (Pixel Herbarium) App Store 发版 SOP
> 基于 v1.1.0 build 4 完整上架经验（2026-03-15 至 3-29）
> 最后更新: 2026-04-01（补充拒审二次修复流程 + LLM review 门）

---

## 概览

```
S1 版本规划 → S2 开发验证 → S3 截图生成(条件) → S4 元数据准备
    → S5 Build & Submit → S6 ASC 配置确认 → S7 上线后监控
```

**预计耗时**（标准版本更新，无截图更新）：~30 分钟
**预计耗时**（含截图更新）：~60 分钟（截图 CI ~20 分钟）

---

## S1: 版本规划

**输入**：功能需求确定，dev 分支代码稳定
**产出**：app.json version + buildNumber 更新

| 步骤 | 操作 | 验证 |
|------|------|------|
| 1 | 确定版本号（semver：fix → patch，feature → minor） | — |
| 2 | 更新 `app.json`: version + buildNumber +1 | `bash scripts/pre-submit/check-version.sh` |
| 3 | 判断 OTA 可行性：改动涉及 native 层？ | 否 → OTA；是 → 完整 GHA build |
| 4 | 确认 EAS Dev Build 配额（月初优先构建） | `npx eas build:list --limit 1` |

**OTA 约束速查**：

| 改动类型 | 可 OTA？ |
|---------|---------|
| 文字/样式/逻辑修改 | ✅ |
| 新增/删除 useState/useEffect | ❌ 必须 native build |
| 新增/删除 npm 包（native module） | ❌ 必须 native build |
| 修改 app.json 原生配置 | ❌ 必须 native build |

---

## S2: 开发验证

**输入**：功能代码完成
**产出**：L1/L2 验证通过 + tests 全绿
**对应 /app-review**：Phase A

```bash
# 1. 自动化测试
npx jest --ci                    # 全部通过
npx tsc --noEmit                 # 0 errors

# 2. 本地验证（三层体系）
# L1: 纯 JS 改动
npx expo start                   # Expo Go 扫码

# L2: 含原生模块改动
npx expo start --dev-client      # Dev Build 扫码

# 3. 真机冒烟测试
```

**真机冒烟测试清单**：
- [ ] 冷启动 → 无白屏/崩溃
- [ ] 核心流程：Home → 花を撮る → 选照片 → Stamp Editor → 保存
- [ ] Diary 查看打卡记录
- [ ] Settings → 语言切换/隐私政策/账号删除可达
- [ ] 断网 → 提示友好，不崩溃
- [ ] 权限全部拒绝 → 优雅降级

**验证门**：tests 全绿 + 真机无崩溃

---

## S3: 截图生成（条件触发）

**触发条件**：UI 有变更 或 截图内容需更新
**输入**：dev 分支最新代码已 push
**产出**：`e2e/composed/asc-6.5-new/` 下 1284×2778 截图
**对应 /app-review**：Phase C (C1/C11-C13)

### 触发前 5 步必检

- [ ] `git log --oneline origin/dev -1` — remote HEAD SHA = 本地
- [ ] `grep EXPO_PUBLIC_SCREENSHOT_MODE .env.local` — 返回 `true`
- [ ] `grep -r "useFocusEffect" src/app/\(tabs\)/` — 截图信号用 useFocusEffect
- [ ] 冷启动默认 tab 与 screenshot sequence 导航一致
- [ ] 5 项全过再触发，否则先修再触发

### 执行流程

```bash
# 1. 触发截图 CI
gh workflow run screenshots.yml --ref dev

# 2. 等待完成后下载
gh run download <run_id> --dir e2e/current

# 3. Resize 到 ASC 要求尺寸
python scripts/screenshot-resize.py    # 1320×2868 → 1284×2778

# 4. 目视验证
# 无空状态/引导页，展示满数据，3 张截图（home/diary/settings）
```

**截图尺寸要求**：

| 槽位 | 尺寸 | 本项目使用 |
|------|------|----------|
| 6.9" (iPhone 16 Pro Max) | 1320×2868 | 否（CI 产出此尺寸，需 resize） |
| 6.5" (iPhone 11 Pro Max) | 1284×2778 | ✅ ASC 已验证接受 |

---

## S4: 元数据准备

**输入**：截图就绪（如需更新）
**产出**：metadata + review-notes + URL 全部有效
**对应 /app-review**：Phase C (C2-C18)

| 步骤 | 操作 | 文件 |
|------|------|------|
| 1 | 更新元数据（如文案变更） | `docs/launch/aso/app-store-metadata-ja.md` |
| 2 | 更新 Review Notes | `docs/launch/app-store-prep/review-notes.md` |
| 3 | URL 检查 | `bash scripts/pre-submit/check-urls.sh` |
| 4 | Review Notes 功能匹配 | 人工确认 Tab 结构/登录方式 = 当前 build |

**Review Notes 要点**：
- 首次提交：完整描述（Guest Mode + 核心流程 + 权限 + 联系信息）
- 版本更新：补充 "What's New" + 测试路径
- 联系信息（姓名/电话/邮件）必须有效

**URL 统一规则**：所有入口使用 `pixel-herbarium.com`（不用 `.app`）

---

## S5: Build & Submit

**输入**：S2-S4 全部通过
**产出**：IPA 上传至 ASC
**对应 /app-review**：Phase D (D0-D5)

```bash
# 0. 前置检查
bash scripts/pre-submit/check-secrets.sh    # 12 个 secret 完整
bash scripts/pre-submit/check-version.sh    # buildNumber 递增
git push origin dev                         # 确认远程 HEAD 同步

# 1. Preview Build（Ad Hoc, ~10 min）
gh workflow run preview-build.yml --repo zmuleyu/pixel-herbarium --ref dev
gh run list --repo zmuleyu/pixel-herbarium --workflow preview-build.yml --limit 1
# 等待 Gate1 → Gate2 → Gate3 全 PASS

# 2. Release Build（App Store, ~12 min）
gh workflow run release.yml --repo zmuleyu/pixel-herbarium --ref dev
gh run list --repo zmuleyu/pixel-herbarium --workflow release.yml --limit 1
# 等待 release PASS + Submit（xcrun altool → ASC）

# 3. 确认 ASC 收到 build
# App Store Connect → 版本 → 构建版本 → 确认 build 出现
```

### 常见失败速查

| 症状 | 修法 |
|------|------|
| Gate1.5 missing-success | 先 `git push origin dev`，再在当前 SHA 跑 preview |
| Gate2 patch 验证失败 | 检查 patch hunk 匹配，`npx patch-package <pkg>` 重新生成 |
| Gate3 Swift 6 deinit error | 清空 deinit 体（见 `patches/expo-image+55.0.6.patch`） |
| Submit altool error | 检查 ASC_KEY_ID / ASC_ISSUER_ID / ASC_PRIVATE_KEY_BASE64 |
| EXPO_PUBLIC_* 不生效 | 写入 `.env.local` 文件（Metro 不读 job.env） |
| Node 版本不兼容 | 检查 `npm ls` 的 EBADENGINE 警告 |

---

## S6: ASC 配置确认

**输入**：build 已上传 ASC
**产出**：所有 ASC 必填字段完成，"添加以供审核"无阻断项
**对应 /app-review**：Phase C.5
**详细 checklist**：→ `docs/launch/checklists/asc-config.md`

| # | 字段 | ASC 位置 |
|---|------|---------|
| CS1 | 内容版权 | App 信息 → 内容版权（选"是"或"否"） |
| CS2 | 定价 | 价格与销售范围 → 添加定价（免费 = $0.00） |
| CS3 | 销售范围 | 价格与销售范围 → App 供应情况（至少 1 国家） |
| CS4 | 隐私标签 | App 隐私 → 问卷已发布（非草稿） |
| CS5 | 年龄分级 | App 信息 → 年龄分级问卷已填写 |
| CS6 | 构建版本 | 版本页 → 构建版本已关联 |
| CS7 | 类别 | App 信息 → 类别（主要 + 次要） |
| CS8 | URL SSL | 技术支持网址 / 营销网址 → SSL 正常 |

**最终确认**：点击"添加以供审核" → 无阻断项弹出 → 确认 → 提交以供审核

**提交时机**：

| 时机 | 建议 |
|------|------|
| 周一至周三 | ✅ 最优，24-48h 审核 |
| 周五下午 | ⚠️ 避免，可能延长至 5 天 |
| WWDC 前后 2 周 | ⚠️ 避免 |

---

## S7: 上线后监控

**输入**：审核通过
**产出**：上线确认 + 首日无重大问题
**对应 /app-review**：Phase E
**详细 checklist**：→ `docs/launch/checklists/post-submit.md`

### 审核通过

1. 手动点击"发布到 App Store"（如选手动发布）
2. 确认 App Store 可搜索（可能需 24h 索引）
3. 多市场策略：日本先行 → 24h 观察 → 全球开放

### 首 24h 监控

- [ ] Crashlytics crash rate < 1%
- [ ] ASC Analytics → 下载/留存/崩溃率
- [ ] 用户评分关注（≥4.0 目标）

### 审核被拒

→ `docs/launch/rejection-playbook.md`

---

## 特殊场景

### 首次提交 vs 版本更新

| 阶段 | 首次提交 | 版本更新 |
|------|---------|---------|
| S1 | 完整 version 设置 | buildNumber +1 |
| S3 | 必须生成截图 | 仅 UI 变更时 |
| S4 | 完整 Review Notes | 补充 What's New |
| S6 | CS1-CS8 全量设置 | 通常仅 CS6（关联新 build） |

### 被拒后快速迭代

```
Resolution Center 查看原因 → 下载所有审核截图
    → 定位 Guideline（查 rejection-playbook.md）
    → 【全量 pattern 扫描】grep 同类问题，列出完整清单
    → 真机 clean install 复现
    → 修复代码/元数据（覆盖清单所有条目）
    → S2（tsc + jest 全绿）
    → 【gemini or other LLM review】diff + 截图 → 确认覆盖完整
    → 仅 LLM review 通过后 → S5（build）→ S6（重新提交）
    → Resolution Center 回复（修复点与截图一一对应）
```

> **触发 build 的前置门：全量扫描 ✅ + tests 全绿 ✅ + LLM review ✅**
> 跳过任何一步都可能导致二次被拒，浪费 1-2 天审核等待时间。

### 仅截图更新

直接从 S3 开始，跳过 S1/S2，S4 中更新截图到 ASC 即可。

---

## 经验复盘 — v1.1.0 教训汇总（含 build 5 拒审二次修复）

### 开发阶段

| 教训 | 规则 |
|------|------|
| index.ts 写错导致正式包白屏 | 唯一正确内容：`import "expo-router/entry"` |
| reanimated v4 不兼容 Expo 55 | Old Architecture 必须用 v3 |
| Apple Sign-In finally 中 setState crash | catch 中重置，不用 finally |
| 冷启动白屏需 5 层防御 | Redirect → language → session → segments → 终极超时 |
| OTA 不能改 hook 数量 | 新增 useState → 必须 native build |
| useFocusEffect vs useEffect | "屏幕可见时执行" 只能用 useFocusEffect |

### CI/Build 阶段

| 教训 | 规则 |
|------|------|
| git push 遗漏 → Gate1.5 失败 | 触发 GHA 前必须确认 remote HEAD |
| EAS 配额月底耗尽 | 月初优先构建 Dev Build，GHA 零消耗 |
| eas build --local pod install 失败 | GHA 用 xcodebuild 直接构建 |
| Swift 6 deinit 只在 Release archive 报错 | 清空 deinit 体 |
| EXPO_PUBLIC_* 在 job.env 无效 | 写入 .env.local（Metro 只读文件） |
| Node 版本不满足 engines | 升级 RN/Expo 后检查 EBADENGINE 警告 |

### 截图阶段

| 教训 | 规则 |
|------|------|
| sleep-based 时序 8 轮失败 | 信号驱动方案（文件握手） |
| useEffect 在 pre-mount 触发 | 截图信号必须用 useFocusEffect |
| 猜测型修改不看日志 | 先 `gh run download` 看截图，再改代码 |
| 6.9" 截图不能直传 ASC | resize 到 1284×2778（6.5" 槽位） |
| 营销合成脚本效果不好 | 不自建，用 Figma/第三方工具 |

### ASC 提交阶段

| 教训 | 规则 |
|------|------|
| 内容版权/定价未设置 → 阻断提交 | CS1-CS8 提前逐项确认 |
| .app 域名 SSL 失效 | 统一使用 pixel-herbarium.com |
| ASC 截图顺序混乱 | 全删后按文件名顺序重传 |

### 拒审修复阶段（build 5 教训）

| 教训 | 规则 |
|------|------|
| 只修 Apple 点名文件，遗漏同类模式 → 必须打第二个 build | 修代码前先 grep 全局同类 pattern，列清单确认零遗漏 |
| 审核截图未充分分析 → 遗漏截图中可见但未提及的交互 | 下载所有截图，逐张用 LLM 分析，确认每个交互点都已覆盖 |
| 过早触发 build → 修两轮等两倍审核时间 | 触发 build 的前置门：全量扫描 + tests 全绿 + LLM review 三步全过 |
| Demo Account 用 SQL 创建须验证 email_confirmed_at | 创建后用 signInWithPassword 验证可直接登录，不依赖邮件确认 |

---

## 相关文件索引

| 文件 | 作用 |
|------|------|
| `docs/launch/app-store-prep/review-notes.md` | Review Notes 模板 |
| `docs/launch/app-store-prep/compliance-checklist.md` | 合规检查清单 |
| `docs/launch/aso/app-store-metadata-ja.md` | ASC 日文元数据 |
| `docs/launch/checklists/pre-release.md` | S2 开发验证 checklist |
| `docs/launch/checklists/asc-config.md` | S6 ASC 配置门 checklist |
| `docs/launch/checklists/post-submit.md` | S7 上线后监控 checklist |
| `docs/launch/rejection-playbook.md` | 被拒处理 SOP |
| `scripts/pre-submit/check-urls.sh` | URL SSL 检查 |
| `scripts/pre-submit/check-version.sh` | 版本号递增检查 |
| `scripts/pre-submit/check-secrets.sh` | GitHub Secret 完整性检查 |
| `.github/workflows/preview-build.yml` | Preview Build（Ad Hoc） |
| `.github/workflows/release.yml` | Release Build + ASC Submit |
| `.github/workflows/screenshots.yml` | 截图 CI |
