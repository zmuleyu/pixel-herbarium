# Screenshot Pipeline — 开发记录与故障手册

> 截图管线唯一真相源。遇到截图问题先查此文档。
> 最后更新：2026-03-27 · 17 次迭代 · 4 张截图已上传 ASC

---

## 1. 架构概览

### 信号握手协议

```
App                              CI (GHA)
 │                                │
 ├─ clearScreenshotSignals()      │
 ├─ router.replace(home)          │
 ├─ waitForRender()               │
 ├─ writeFile(screenshot_ready_home) ──→ detect file
 │                                ├─ sleep 1s (settle)
 │                                ├─ xcrun simctl io screenshot
 │                                ├─ rm screenshot_ready_home ──→ detect deletion
 ├─ router.push(checkin)          │
 ├─ writeFile(screenshot_ready_checkin) ──→ ...repeat...
 │                                │
 └─ [4 screens total]             └─ upload artifact
```

### 文件清单

| 类型 | 路径 | 用途 |
|------|------|------|
| Feature flag | `src/constants/features.ts` | `SCREENSHOT_MODE` 开关 |
| Demo 数据 | `src/constants/demo-data.ts` | 3 条花点 + 4/3 樱花日期 |
| 状态注入 | `src/hooks/useScreenshotMode.ts` | Date mock + 数据注入 + Guide 标记 |
| 导航编排 | `src/hooks/useScreenshotSequence.ts` | 4 屏自动导航 |
| 信号协议 | `src/hooks/utils/screenshotSignal.ts` | 文件握手 write/poll/clear |
| Guide 抑制 | `src/components/guide/GuideWrapper.tsx` | SCREENSHOT_MODE 时跳过 overlay |
| 启动流 | `src/app/_layout.tsx` | OTA 跳过 + 引导跳过 |
| CI 工作流 | `.github/workflows/screenshot-build.yml` | 主构建+捕获流程 |
| 合成脚本 | `scripts/screenshot-compose.mjs` | Canvas 合成 1320×2868 |
| 本地捕获 | `scripts/capture-local.sh` | 本地 Mac 信号捕获 |
| 中国优化 | `scripts/mac-china-capture.sh` | 代理+一键捕获 |
| 真机捕获 | `scripts/eas-device-screenshot.sh` | EAS Build + iPhone |

### 环境变量

| 变量 | 值 | 注入方式 | 消费方 |
|------|------|---------|--------|
| `EXPO_PUBLIC_SCREENSHOT_MODE` | `"true"` | GHA env + .env.local | features.ts |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase URL | GHA env + .env.local | supabase.ts |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | JWT | GHA env + .env.local | supabase.ts |
| `APP_VARIANT` | `"development"` | eas.json | Build config |
| `EXPO_TOKEN` | GitHub Secret | GHA secret | Expo CLI |

**关键发现**: Metro 从 `.env.local` 文件读取 `EXPO_PUBLIC_*`，不是 shell 环境变量。必须在 `npx expo prebuild` 前写入文件。

---

## 2. 开发时间线

| # | 日期 | Commit | 问题 | 修复 |
|---|------|--------|------|------|
| 1 | 03-20 | `0c4dad2` | 需要一致的 App Store 截图状态 | SCREENSHOT_MODE + demo data + Date mock |
| 2 | 03-22 | `a423447` | 手动截图效率低 | GHA workflow_dispatch 自动构建 |
| 3 | 03-23 | `ca552c5` | 截图模式落在引导页 | _layout.tsx 跳过 onboarding |
| 4 | 03-23 | `36489b5` | xcrun simctl tap 不可靠 | App 内自动导航 useScreenshotSequence |
| 5 | 03-23 | `217a72d` | tap 坐标在 iOS 26 失效 | 改用 URL scheme 导航 |
| 6 | 03-26 | `f6e14db` | 定时截图不稳定 | **信号握手协议**（写文件→检测→删除） |
| 7 | 03-26 | `04002be` | Metro 读不到环境变量 | .env.local 文件注入 |
| 8 | 03-26 | `6e424f5` | GHA 失败时无备选 | 本地捕获脚本 capture-local.sh |
| 9 | 03-26 | `d5a0e5d` | bootstatus 无限挂起 | 60s 后台超时 + 状态栏覆盖 |
| 10 | 03-26 | `371a12b` | simctl io screenshot 挂起 | 15s timeout 包装 |
| 11 | 03-27 | `e5cb702` | 多层故障无 fallback | Simulator.app 提前启动 + screencapture 回退 |
| 12 | 03-27 | `ce019c5` | EAS 构建产物无法安装到真机 | distribution:internal 显式声明 |
| 13 | 03-27 | `e2deeb5` | **simctl launch 在 Xcode 26 挂起** | 30s 超时守卫 + xcode-select 路径修复 |
| 14 | 03-27 | `1df4253` | Guide overlay 出现在截图中 | CoachMarkController 早期 return |
| 15 | 03-27 | `41c4e78` | 三合一 bug：guide/home/OTA | guide_seen='true' + 显式 replace + OTA 跳过 |
| 16 | 03-27 | `b2892fb` | 首批 CI 截图有问题 | 问题记录，触发后续修复 |
| 17 | 03-27 | `0faa6e5` | 截图合成配置过期 | 03-stamp→03-footprint + 删除 05-onboarding |

---

## 3. 故障手册

### A. CI/Simulator 环境故障

#### A1: simctl launch 挂起（Xcode 26）
- **症状**: "Launching app..." 后无任何输出，15 分钟超时
- **根因**: Xcode 26 的 `xcrun simctl launch` 行为改变，变成阻塞调用
- **修复**: 后台运行 + 30s kill timer（commit `e2deeb5`）
- **预防**: 始终包装 simctl launch 为后台进程

#### A2: Simulator.app 路径不匹配
- **症状**: simctl io screenshot 挂起或截到黑屏
- **根因**: 硬编码 `/Applications/Xcode.app` 但 xcode-select 指向 Xcode_26
- **修复**: 使用 `$(xcode-select -p)/Applications/Simulator.app`
- **预防**: 永远不硬编码 Xcode 路径

#### A3: bootstatus 无限等待
- **症状**: workflow 卡在 "Booting simulator..."
- **根因**: `xcrun simctl bootstatus` 在某些 Xcode 版本无限阻塞
- **修复**: 后台运行 + 60s kill（commit `d5a0e5d`）
- **预防**: 所有 simctl 阻塞命令加超时守卫

#### A4: simctl io screenshot 挂起
- **症状**: 截图步骤卡住 >30s
- **根因**: Simulator.app GUI 未启动或进程锁
- **修复**: 15s timeout + screencapture 回退（commit `371a12b`）
- **预防**: 在 Boot 步骤就启动 Simulator.app GUI

#### A5: 找不到 iPhone 模拟器
- **症状**: "ERROR: No suitable iPhone simulator found"
- **根因**: Xcode 版本变更导致设备池变化
- **修复**: 优先级降级列表 iPhone 17 → 16 → 15
- **预防**: 保持设备列表覆盖 3 代机型

#### A6: App container 获取失败
- **症状**: "ERROR: could not get app data container after 10 retries"
- **根因**: App 启动后容器目录未立即可用
- **修复**: 10 次重试 × 2s 间隔 + debug 输出
- **预防**: 冷启动后等待 30s 再查询容器

### B. 信号协议故障

#### B1: documentDirectory 为 null
- **症状**: `[SCREENSHOT_SIGNAL] documentDirectory is null`
- **根因**: expo-file-system/legacy 的 shim 回退返回 null
- **修复**: null guard + console.error（commit `e2deeb5`）
- **预防**: 始终检查 documentDirectory 非空

#### B2: 信号文件未被删除
- **症状**: App 等待 30s 后才继续，截图可能捕获过渡状态
- **根因**: CI 脚本未检测到信号文件（路径不匹配或时序错误）
- **修复**: debug 输出每 15s 打印信号目录内容
- **预防**: 确保 SIGNAL_DIR 与 App 的 documentDirectory 一致

#### B3: 信号文件路径错误
- **症状**: CI 报告 timeout，但 App 日志显示 "Wrote: screenshot_ready_home"
- **根因**: documentDirectory 返回 null 导致路径为 "nullscreenshot_ready_home"
- **修复**: null guard（见 B1）
- **预防**: 日志中打印完整路径而非仅文件名

### C. App 启动/导航故障

#### C1: 截图落在 Onboarding 页面
- **症状**: 截图显示引导页而非主界面
- **根因**: SCREENSHOT_MODE 未设置或 AsyncStorage 写入失败
- **修复**: _layout.tsx 中 SCREENSHOT_MODE 跳过 onboarding（commit `ca552c5`）
- **预防**: 验证 .env.local 中 EXPO_PUBLIC_SCREENSHOT_MODE=true

#### C2: Home tab 未被捕获
- **症状**: 01-home 和 02-checkin 显示相同内容
- **根因**: redirect 在 tabs 已挂载时不触发
- **修复**: 显式 `router.replace('/(tabs)/home')`（commit `41c4e78`）
- **预防**: 不依赖 redirect，始终显式导航

#### C3: OTA 更新中断截图序列
- **症状**: App 在序列中途重启
- **根因**: checkAndApplyOTA 发现更新后调用 reloadAsync()
- **修复**: SCREENSHOT_MODE 时跳过 OTA（commit `41c4e78`）
- **预防**: 所有重启逻辑需检查 SCREENSHOT_MODE

#### C4: Auth 挂起导致 splash 不消失
- **症状**: 截图全是 loading spinner
- **根因**: Supabase auth 在 CI 网络下超时
- **修复**: 8s auth timeout + 15s ultimate timeout（_layout.tsx:109）
- **预防**: CI 环境确保 Supabase URL 可达

### D. UI 状态污染

#### D1: Guide tooltip overlay 出现
- **症状**: 截图上有半透明遮罩和提示气泡
- **根因**: AsyncStorage 的 guide_seen 值设为 '1' 但代码检查 === 'true'
- **修复**: 设置为 `'true'` + CoachMarkController 早期 return（commits `41c4e78` + `1df4253`）
- **预防**: GuideWrapper 直接检查 SCREENSHOT_MODE，不依赖 AsyncStorage 时序

#### D2: 日期显示非樱花季
- **症状**: 花点状态不是 "盛開" 或显示错误月份
- **根因**: Date mock 未生效
- **修复**: globalThis.Date 覆写 + static now()（useScreenshotMode.ts）
- **预防**: 验证 `new Date().toISOString()` 输出 2026-04-03

#### D3: 足迹网格为空
- **症状**: Footprint 页面无花点卡片
- **根因**: demo checkin records 未注入 store
- **修复**: `useCheckinStore.setState({ history: DEMO_CHECKIN_RECORDS })`
- **预防**: 验证 DEMO_CHECKIN_RECORDS.length > 0

### E. 构建/编译

#### E1: Swift 版本不兼容
- **症状**: xcodebuild 报 Swift 6.0 语法错误
- **根因**: expo-modules-core 指定 Swift 6.0 但 Xcode 26 不完全支持
- **修复**: patch podspec 降级到 Swift 5.9 + 移除 @MainActor
- **预防**: prebuild 后自动执行 patch 脚本

#### E2: folly coroutines 编译错误
- **症状**: folly 头文件报 coroutine 未定义
- **根因**: Xcode 26 clang 模块缓存忽略编译器标志
- **修复**: 直接 patch 头文件，将 `#if FOLLY_HAS_COROUTINES` 替换为 `#if 0`
- **预防**: pod install 后自动执行 patch

---

## 4. 超时架构（三层防御）

| 层级 | 位置 | 超时 | 回退 |
|------|------|------|------|
| **Workflow** | GHA job | 120 min | Kill workflow |
| **Workflow** | Capture step | 15 min | GHA error |
| **Simulator** | bootstatus | 60s | Kill + continue |
| **Simulator** | simctl launch | 30s | Kill + warn |
| **App** | Splash screen | 15s | Force loading=false |
| **App** | Auth check | 8s | Skip, guest mode |
| **App** | Language restore | 3s | Default language |
| **App** | OTA check | 5s | Skip (SCREENSHOT_MODE 直接跳过) |
| **Signal** | Home (CI) | 120s | Capture anyway + app log |
| **Signal** | Other screens (CI) | 60s | Capture anyway |
| **Signal** | App-side wait | 30s | Continue (非 CI 回退) |

---

## 5. 验证 Checklist

运行截图管线前确认：

```
□ EXPO_PUBLIC_SCREENSHOT_MODE=true 已写入 .env.local
□ Xcode 版本匹配 (xcode-select -p)
□ iOS 模拟器已启动 (xcrun simctl list devices | grep Booted)
□ Simulator.app GUI 已启动
□ App bundle ID = com.pixelherbarium.app
□ documentDirectory 可写
□ guide_seen_* 全部设为 'true'
□ DEMO_CHECKIN_RECORDS 已注入 (3 条)
□ Date mock 为 2026-04-03
□ OTA check 已跳过
□ 4 个信号名正确: screenshot_ready_{home,checkin,footprint,settings}
□ e2e/current/ 目录可写
```

---

## 6. 快速命令参考

```bash
# 触发 CI 截图构建
gh workflow run 249797733 --ref dev

# 检查运行状态
gh run list --workflow=249797733 --limit=1

# 下载截图
gh run download <run-id> --name app-screenshots-<sha> --dir e2e/current/

# 本地合成
node scripts/screenshot-compose.mjs

# 验证尺寸
node -e "const{loadImage}=require('canvas');const fs=require('fs');
fs.readdirSync('e2e/composed/canvas').filter(f=>f.endsWith('.png'))
.forEach(async f=>{const i=await loadImage('e2e/composed/canvas/'+f);
console.log(f+': '+i.width+'x'+i.height)})"
```
