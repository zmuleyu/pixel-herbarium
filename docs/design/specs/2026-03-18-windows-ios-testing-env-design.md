# Windows iOS 开发测试环境搭建 — 设计文档 v1.2（成本优化版）

## Context

**问题**：Pixel Herbarium (PH) 是 Expo 55 / React Native 0.83 的 iOS app，开发环境为 Windows 10 + iPhone（无 Mac）。当前通过 EAS Build 远程编译、324 个 Jest 测试覆盖逻辑层，但 iOS 端缺失 E2E 自动化测试、视觉回归、多设备兼容性测试和性能测试。

**核心约束**：几乎所有 iOS 测试框架（Maestro、Detox、Appium for iOS）都依赖 macOS。Windows 上获取 macOS 能力的途径仅有：云端 macOS runner、云真机平台、macOS VM。

**前置条件**：项目目前无 GitHub remote（`git remote -v` 为空）。Layer 2 开始前必须先完成 GitHub 仓库创建和推送。

**决策**：采用分层混合方案（Approach C），四层递进，从免费到按需付费。

---

## 架构总览（v1.2 成本优化版）

```
Layer 1 (FREE)          Layer 2 (FREE)           Layer 3 (按需 ¥30-100)   Layer 4 (FREE)
┌─────────────────┐    ┌──────────────────┐     ┌──────────────────┐    ┌──────────────────┐
│ Windows Local    │    │ Codemagic CI     │     │ 友盟/阿里EMAS    │    │ EAS Release      │
│                  │    │ 500min/月 M2 免费 │     │ 国内云真机        │    │                  │
│ Jest screen tests│    │ Maestro E2E      │     │ 多设备兼容        │    │ Tag → Validate   │
│ MSW API mocks   │    │ iOS Simulator    │     │ App Store 截图    │    │ → E2E → Build    │
│ Snapshot testing │    │ Visual regression│     │ 性能数据          │    │ → Submit ASC     │
│                  │    │ Multi-size matrix│     │                  │    │ OTA test workflow │
└─────────────────┘    └──────────────────┘     └──────────────────┘    └──────────────────┘
       ↑                       ↑                        ↑                       ↑
    Day 1-2                 Day 3-7                  按需启用                Day 8-10
```

### v1.1 → v1.2 核心变更

| 变更 | 原方案（v1.1） | 优化后（v1.2） | 节省 |
|------|---------------|---------------|------|
| iOS CI/CD | GHA macOS ($10-60/月) | **Codemagic 免费 500 min/月 M2** | $10-60/月 |
| E2E 集成 | 自建 GHA workflow | **EAS Workflows 内置 Maestro**（备选） | 配置复杂度 |
| 云真机 | AWS DF $0.17/min | **友盟 U-APM ¥1/min**（国内快） | ~40% 费用 |
| 备选 CI | 无 | **GHA 公开仓库 macOS 无限免费** | 应急零成本 |

---

## Layer 1：本地增强测试（免费，Day 1-2）

### 1A. 屏幕级集成测试

现有 324 测试以 hooks/utils 为主，缺少完整屏幕渲染测试。

**新增测试文件**：
```
__tests__/screens/
  LoginScreen.test.tsx       — Apple Sign In 按钮渲染、邮箱登录流程
  DiscoverScreen.test.tsx    — 权限门控、相机/GPS 状态显示
  HerbariumScreen.test.tsx   — 60 格网格渲染、稀有度徽章、过滤器
  PlantDetail.test.tsx       — 花言叶翻转卡、数据展示
  MapScreen.test.tsx         — 地图标记、缩放
  ProfileScreen.test.tsx     — 语言切换、登出、数据导出
```

**工具**：`@testing-library/react-native`（已安装）。
**新依赖**：`jest-expo`（提供 RN 兼容的 jest preset，替代当前 `ts-jest` + `node` 环境）或为屏幕测试单独配置 `testEnvironment: 'jsdom'`。
**注意**：当前 `jest.config.js` 使用 `testEnvironment: 'node'`，`__mocks__/react-native.js` 返回字符串 stub。屏幕级渲染测试需要实际 React 组件环境。两种策略：
1. **渐进式**：为 `__tests__/screens/` 目录配置独立的 jest project（jsdom 环境），现有 hook 测试保持 node 环境不变
2. **全量迁移**：切换到 `jest-expo` preset（Expo 官方推荐），统一测试环境

推荐策略 1（渐进式），避免影响现有 324 个测试。
**额外 mock**：expo-router (`useRouter`, `useSegments`)、expo-camera、expo-apple-authentication。

### 1B. MSW 网络级 API Mock

**与现有 mock 的共存策略**：现有 324 测试直接 mock `@supabase/supabase-js` 模块。MSW 仅用于新增的屏幕级测试（`__tests__/screens/`），不修改现有测试。两套 mock 通过 jest project 隔离（屏幕测试用 MSW + jsdom，hook 测试保持原有 module mock + node）。

**新增文件**：
```
__tests__/mocks/
  handlers/auth.ts      — signInWithEmail, signInWithApple, signOut
  handlers/plants.ts    — 植物列表、发现、图鉴
  handlers/identify.ts  — Edge Function invoke mock
  handlers/quota.ts     — 配额检查/消耗
  server.ts             — MSW 服务器配置
```

**新依赖**：`msw`

### 1C. 快照测试

对屏幕测试加 `toMatchSnapshot()` 断言，检测样式/结构意外变更。快照存储在 `__tests__/__snapshots__/`。

### ~~1D. Storybook React Native Web~~ — 已移除（YAGNI）

> 对于单人开发 + 有真机的场景，Storybook RNWeb 维护成本高于收益。如未来团队扩展或需要设计评审再引入。

### Layer 1 覆盖

| 测试需求 | 覆盖度 | 说明 |
|----------|--------|------|
| E2E | 2/5 | 组件级逻辑流程，非触摸/导航 |
| 视觉回归 | 2/5 | 快照检测代码级变化 |
| 多设备 | 0/5 | 无 |
| 性能 | 0/5 | 无 |

---

## Layer 2：Codemagic + Maestro E2E（免费，Day 3-7）

### 2A-0. CI 平台选择：Codemagic（推荐） vs GHA vs EAS Workflows

| 平台 | 免费 macOS 额度 | 机器规格 | 适用条件 |
|------|----------------|---------|---------|
| **Codemagic**（推荐） | **500 min/月 M2** | 8 核 8GB | 任何仓库，无需公开 |
| GHA（公开仓库） | **无限** | M1/M2 | 需公开仓库代码 |
| GHA（私有仓库） | ~200 min/月 | M1/M2 | Free plan 2000 min × 1/10 |
| EAS Workflows | 60 min/月 | Expo 云端 | Expo 项目，额度少 |

**Codemagic 优势**：
- 私有仓库也有 500 min/月（PH 典型用量 ~200 min/月，绰绰有余）
- 移动端专用，预装 Xcode + CocoaPods + Simulator
- 原生支持 Maestro 集成
- 无需 GHA 的 macOS 10x 费率计算

**升级路径**：免费额度不够时 → 公开仓库切换 GHA（无限免费）→ 或 Codemagic 付费 $0.095/min

### 2A. EAS Simulator 构建 Profile

在 `eas.json` 新增 `simulator` profile：
```json
{
  "simulator": {
    "developmentClient": true,
    "ios": { "simulator": true },
    "env": {
      "EXPO_PUBLIC_SUPABASE_URL": "https://<e2e-project>.supabase.co",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "<e2e-anon-key>"
    },
    "channel": "simulator"
  }
}
```

**注意**：不继承 `development`（该 profile 设 `simulator: false` 会冲突），不设 `distribution`（simulator build 无需签名分发），使用独立 `channel: "simulator"` 避免污染 development OTA 频道。

生成 `.app` 包（非 `.ipa`），可在 macOS Simulator 中运行。

### 2A-bis. Maestro + Expo 55 兼容性验证门

Expo 55 默认启用 New Architecture (Fabric)。Maestro 与 Fabric 的兼容性尚未完全确认。

**Day 4 验证步骤**：
1. 触发 `eas build --profile simulator --platform ios`
2. 在 GHA macOS runner 上安装 .app 到 Simulator
3. 运行单条 PoC flow：`maestro test e2e/flows/01-cold-start.yaml`
4. 如果失败：检查 Maestro issue tracker，考虑 `newArchEnabled: false` 降级或等待 Maestro 更新
5. PoC 通过后才继续编写剩余流程

### 2B. Maestro E2E 流程

Maestro 是 Expo/RN 官方推荐的 E2E 框架，YAML 定义测试流程。

**Phase 1：6 条核心流程**（Day 5 完成）：
```
e2e/flows/
  01-cold-start.yaml           — 冷启动 → splash → 正确导航
  02-login-email.yaml          — 邮箱登录（测试账号）
  03-discover-flow.yaml        — 权限流程 + 发现/识别
  04-herbarium-grid.yaml       — 网格展示、过滤、点击导航
  05-hanakotoba-flip.yaml      — 翻转动画 + 花言叶展示
  06-profile-settings.yaml     — 语言切换、登出
```

**Phase 2：扩展到 12 条**（后续迭代）：
```
  07-share-poster.yaml         — 分享弹窗打开、海报生成
  08-map-view.yaml             — 地图加载、标记显示
  09-social-tab.yaml           — 好友/花束 tab 功能
  10-offline-behavior.yaml     — 飞行模式处理
  11-deep-link.yaml            — URL scheme 导航
  12-onboarding.yaml           — 首次用户引导
```

**Apple Sign In 策略**：所有 E2E 用邮箱登录。创建专用 Supabase 测试账号：
- Email: `e2e-test@pixelherbarium.dev`
- 预置数据：5 株已收集植物、好友关系、发现历史

### 2C. Codemagic CI 工作流

```yaml
# codemagic.yaml
workflows:
  ios-e2e-test:
    name: iOS E2E Tests
    max_build_duration: 45
    instance_type: mac_mini_m2
    environment:
      xcode: latest
      node: 20.18.0
      vars:
        EXPO_TOKEN: $EXPO_TOKEN
        E2E_TEST_EMAIL: e2e-test@pixelherbarium.dev
        E2E_TEST_PASSWORD: $E2E_TEST_PASSWORD
    triggering:
      events:
        - push
      branch_patterns:
        - pattern: master
        - pattern: dev
    scripts:
      - name: Install dependencies
        script: npm ci
      - name: Run Jest tests
        script: npx jest --ci
      - name: Download EAS Simulator build
        script: |
          npx eas-cli build:list --platform ios --profile simulator --limit 1 --json > build.json
          BUILD_URL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('build.json','utf8'))[0].artifacts.buildUrl)")
          curl -L -o app.tar.gz "$BUILD_URL" && tar xzf app.tar.gz
      - name: Boot Simulator
        script: |
          xcrun simctl boot "iPhone 16 Pro Max"
          xcrun simctl install booted *.app
      - name: Install & run Maestro
        script: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          export PATH="$PATH:$HOME/.maestro/bin"
          maestro test e2e/flows/ --format junit --output e2e-results.xml
    artifacts:
      - e2e-results.xml
      - ~/.maestro/tests/*/screenshots/**
```

**费用**：Codemagic 免费 500 min/月 M2。
- 单次 E2E（1 设备 × 6 流程）≈ 15-20 min
- 4 次/周 × 20min = 80 min/月（仅用 16% 免费额度）
- 多设备矩阵：3 设备 × 20min = 60min/次，4 次/周 = 240min/月（48% 额度）
- **当前阶段只跑 1 设备即可（iPhone 16 Pro Max），80 min/月完全免费**
- 发版前临时加多设备测试，仍在 500 min 内

**与 GHA 的区别**：
- 无需 `runs-on: macos-14` 的 10x 费率计算
- 预装 Xcode，无需额外 setup 步骤
- 如未来超出 500 min → 公开仓库切 GHA（无限免费）作为备选

### 2D. 视觉回归

Maestro 每步截图 + `pixelmatch` 对比基线：
```
e2e/baselines/    — 金标准截图（Git LFS 跟踪，避免 repo 膨胀）
e2e/diffs/        — 差异图（.gitignore）
scripts/visual-regression.mjs  — pixelmatch 对比脚本
```
阈值：0.1% 像素差异。
**存储**：基线 PNG 预计 ~30 张 × 200KB = 6MB 起。使用 Git LFS 跟踪 `e2e/baselines/*.png`，避免 git 历史膨胀。

### Layer 2 覆盖

| 测试需求 | 覆盖度 | 说明 |
|----------|--------|------|
| E2E | 4/5 | 6 条核心流程（Phase 1），后续扩展到 12 条 |
| 视觉回归 | 3/5 | Simulator 截图对比 |
| 多设备 | 3/5 | 3 尺寸 × 2 iOS 版本矩阵 |
| 性能 | 0/5 | 后续 Layer 补充 |

---

## Layer 3：云真机测试（按需付费，¥30-100/次）

### 3A. 国内云真机平台（推荐替代 AWS DF）

| 平台 | 定价 | 免费额度 | iOS 支持 | 优势 |
|------|------|---------|---------|------|
| **友盟 U-APM**（推荐） | ¥1/min | 有体验时长 | 口碑好 | 阿里旗下，iOS 支持细致，虚拟定位/抓包/截图 |
| 阿里云 EMAS | ¥2/min (iOS) | 每月 10 台次 + 10min | 有 | 定价透明，文档完整，iOS 双倍计费 |
| Testin 云测 | ¥3/min | 注册送 60 min | 300+ 机型 | 覆盖最广，但最贵 |
| AWS Device Farm | $0.17/min ≈ ¥1.2/min | 首年 1000 min（不确定） | 有 | 国际标准，但国内访问慢需代理 |

**推荐友盟 U-APM 的理由**：
- ¥1/min，PH 月度发版 1 次 × 5 设备 × 10min = **¥50/次**
- 国内 IDC，访问快，无需代理
- 支持虚拟定位（可测试东京 GPS 坐标）
- 中文支持，售后方便

**升级路径**：友盟（当前）→ 需要更多设备覆盖时加 Testin → 国际化需求加 AWS DF

### 3B. 真机测试矩阵

| 设备 | iOS 版本 | 测试重点 |
|------|----------|----------|
| iPhone SE (3rd) | iOS 16.x | 最小屏 4.7" |
| iPhone 14 | iOS 17.x | 主流机型 |
| iPhone 15 Pro | iOS 17.x | ProMotion 120Hz |
| iPhone 16 Pro Max | iOS 18.x | 最大屏 6.9" |
| iPhone 13 mini | iOS 17.x | 最小现代屏 5.4" |

### 3C. App Store 截图自动化

专用 Maestro 截图流程 → AWS DF 在目标设备执行 → 提取精确分辨率截图 → Figma 后期处理。

```
e2e/screenshots/
  ss-01-herbarium-grid.yaml
  ss-02-hanakotoba-flip.yaml
  ss-03-discover-camera.yaml
  ss-04-share-poster.yaml
  ss-05-map-view.yaml
```

**替代方案（免费）**：GHA macOS + Simulator 截图。分辨率正确但非真机渲染，PH 的 pixel-art 风格在 Simulator 上效果可接受。

### 3D. 性能测试

| 指标 | 工具 | 来源 |
|------|------|------|
| 冷启动时间 | Maestro timing assertion | Layer 2 CI |
| FPS/内存 | AWS DF 性能报告 | Layer 3 |
| JS bundle 大小 | `expo export` 本地检查 | Windows |
| 组件渲染时间 | React DevTools Profiler | 真机连接 |

**性能预算** (`e2e/performance-budgets.json`)：
```json
{
  "cold-start-to-interactive-ms": null,
  "herbarium-scroll-fps-min": null,
  "js-bundle-size-kb-max": null,
  "memory-peak-mb-max": null
}
```
**注意**：初始值设为 null，Layer 2 首次 CI 运行后采集基线数据，再设定阈值（基线 + 20% 余量）。先测量，再设预算。

### Layer 3 覆盖

| 测试需求 | 覆盖度 |
|----------|--------|
| E2E | 5/5 |
| 视觉回归 | 4/5 |
| 多设备 | 5/5 |
| 性能 | 3/5 |
| 截图 | 4/5 |

---

## Layer 4：自动发版管线（免费，Day 8-10）

### 4A. 发版工作流

```
git tag v1.0.1 → push
  → GHA: Jest + TypeScript 验证
  → GHA: Maestro E2E (SE + 16 Pro Max)
  → EAS: production build
  → EAS: submit to App Store Connect
```

### 4B. OTA 测试工作流

```
Pre-OTA: E2E 全套通过（基线）
→ eas update --channel production
→ Post-OTA: 重新启动 app → E2E 再跑一遍
→ 失败 → eas update:rollback
```

---

## 源码改造要求

### testID 添加

以下文件需要为关键交互元素添加 `testID` prop：

| 文件 | 需添加的 testID |
|------|----------------|
| `src/app/(auth)/login.tsx` | auth.email, auth.password, auth.signIn, auth.apple |
| `src/app/(tabs)/discover.tsx` | discover.capture, discover.gallery, discover.gps, discover.quota |
| `src/app/(tabs)/herbarium.tsx` | herbarium.filter.*, herbarium.cell.*, herbarium.progress |
| `src/components/HanakotobaFlipCard.tsx` | flip.front, flip.back |
| `src/components/SharePoster.tsx` | poster.container, poster.share |

### E2E 测试环境

- **独立 Supabase 项目**（free tier）用于 E2E，预置种子数据
- **确定性模式**：E2E 构建中固定日期（2026-04-15 春季）、固定 GPS（东京站 35.6812, 139.7671）
- **动画加速**：测试模式下通过 config 值控制 `duration: isE2E ? 0 : 300`（值变更，不增删 hook），遵守 OTA hook 数量不变规则

### Apple Sign In 测试

| 场景 | 方法 | 频率 |
|------|------|------|
| 按钮渲染 | RNTL 组件测试 | 每次 CI |
| 完整登录流程 | 真机手动验证 | 发版前 |
| 新账号注册 | 真机手动 | 首次提交前 |
| 账号删除 | E2E（邮箱）+ 手动（Apple） | 发版前 |

---

## 新增文件结构

```
pixel-herbarium/
  .github/workflows/
    ci.yml                     — Jest + typecheck（每次 push）
    e2e-ios.yml                — Maestro E2E（macOS runner）
    release.yml                — Tag → validate → E2E → build → submit
    ota-test.yml               — OTA 更新验证
  .gitattributes               — Git LFS 配置（e2e/baselines/*.png）
  .gitignore                   — 新增 e2e/diffs/, .maestro/
  e2e/
    .maestro/config.yaml
    flows/                     — 6 条核心 + 6 条扩展 E2E 流程
    screenshots/               — 5 条截图流程
    baselines/                 — 金标准截图（Git LFS）
    diffs/                     — 差异图（.gitignore）
    performance-budgets.json
  __tests__/
    mocks/                     — MSW mock handlers（与现有 __tests__ 目录一致）
      handlers/
      server.ts
    screens/                   — 6 个屏幕级测试 + 1 个 social tab 测试
  scripts/
    visual-regression.mjs
    performance-check.mjs
```

---

## 费用总结

### v1.2 优化后

| 组件 | 月费 | 年费 | 说明 |
|------|------|------|------|
| L1 本地 | $0 | $0 | Jest + MSW |
| L2 Codemagic | **$0** | **$0** | 500 min/月免费，PH 用量 ~80-240 min |
| L3 友盟 U-APM | **¥50/次 ≈ $7/次** | **¥600 ≈ $84** | 月度发版 ¥50，按需 |
| L4 EAS 发版 | $0 | $0 | 15 builds/月免费 |
| Apple Developer | $99/年 | $99/年 | 已有 |
| **合计** | **~$7/月** | **~$84/年** | 仅 L3 云真机有费用 |

### 对比优化前

| 维度 | v1.1 | v1.2 | 节省 |
|------|------|------|------|
| CI/CD | GHA macOS $10-60/月 | Codemagic 免费 | **$120-720/年** |
| 云真机 | AWS DF $8-50/次 | 友盟 ¥50/次 ≈ $7 | **~15%** |
| **年度总计** | **$240-720** | **~$84** | **65-88%** |

---

## 实施时间线

| 天 | 层级 | 任务 |
|----|------|------|
| 1 | L1 | jest.config.js 多 project 配置 + MSW setup + 3 个屏幕测试 |
| 2 | L1 | 剩余 4 个屏幕测试 + 快照测试 |
| 3 | L2 | **GitHub 仓库创建** + push + 审查敏感数据 + Git LFS + **Codemagic 账号注册** |
| 4 | L2 | EAS simulator profile + 首次 Simulator 构建 + **Maestro PoC 验证**（Codemagic） |
| 5 | L2 | 编写 6 条核心 Maestro 流程 |
| 6 | L2 | Codemagic codemagic.yaml 配置 + 首次成功运行 |
| 7 | L2 | 视觉回归 + 性能基线采集 |
| 8 | L4 | Release workflow（tag → validate → E2E → EAS build → submit） |
| 9 | L4 | OTA 测试 workflow + rollback 验证 |
| 10 | L3 | （按需）友盟 U-APM 注册 + 首次真机测试 |

---

## 风险与缓解

| 风险 | 概率 | 缓解措施 |
|------|------|----------|
| Codemagic 免费额度变更 | 低 | 备选：公开仓库切 GHA（macOS 无限免费） |
| Maestro Simulator 不稳定 | 中 | `--retries 2` + 调整超时 |
| EAS Simulator build 在 SDK 升级后失败 | 中 | 固定 SDK 版本，分支先测 |
| Apple Sign In 无法自动化 | 确定 | 邮箱 E2E + 手动清单 |
| Maestro + Expo 55 Fabric 不兼容 | 中 | Day 4 PoC 验证，失败则 `newArchEnabled: false` 或换 Detox |
| 视觉回归误报（像素噪声） | 中 | 0.1% 阈值 + SSIM 结构相似度 |

---

## 关键修改文件

- `eas.json` — 新增 simulator profile
- `src/app/(auth)/login.tsx` — testID + Apple Sign In 测试策略
- `src/app/(tabs)/discover.tsx` — testID + 确定性测试模式
- `src/app/(tabs)/herbarium.tsx` — testID
- `src/app/(tabs)/social.tsx` — testID（如存在）
- `jest.config.js` — 多 project 配置（node + jsdom）
- `package.json` — 新增 msw 依赖
- `.gitignore` — 新增 e2e/diffs/, .maestro/
- `.gitattributes` — Git LFS 配置
- `scripts/validate-build.mjs` — 性能预算检查

## 验证方式

- L1: `npx jest --ci` 全部通过（目标 380+ tests，现有 324 + 新增 ~56）
- L2:
  - Day 4: Maestro PoC 单流程在 GHA macOS runner 上通过
  - Day 7: GHA E2E workflow 绿灯（6/6 flows × 3 devices）
- L3: AWS DF 5 设备全部通过 + 截图导出
- L4: `git tag v1.0.1 && git push --tags` 触发完整管线到 ASC
