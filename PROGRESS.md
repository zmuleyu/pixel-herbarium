# Pixel Herbarium — 赏花打卡 Pivot 进度

Updated: 2026-03-19

---

## ✅ Phase 1: Foundation — 完成 (commit `9f6ecb9`)

- Season 抽象层 (SeasonConfig / SEASONS / getCurrentSeason / getActiveSeason)
- Guest-first auth (无强制登录)
- 4-tab 导航壳 (home / checkin / footprint / settings)
- Home 屏 (特色 spot + 开花状态栏 + CTA)
- 遗留 tab href:null 隐藏
- **417 tests passing**

---

## ✅ Phase 2: MVP Check-in — 完成 (commit `73c1bda`)

- `useCheckinPhoto` — camera/library 选图 hook
- `SpotSelector` — 可搜索 spot 列表 + 开花状态 badge
- `CardTemplate` — 360×480 打卡卡片（用户照片 + 地点 + 日期 + 品牌）
- `checkin.tsx` — 3步向导（选图 → 选地点 → 预览+保存/分享）
- `footprint.tsx` — 打卡历史网格
- i18n: 12 个新 key (ja + en)
- **417 tests passing**

跳过（OTA 补充）：WatermarkTemplate / PixelTemplate / TemplateSelector

---

## 待做 — Phase 3: 设备测试 + App Store

### Phase 3 核心任务
- [x] **onboarding 文案更新** — 花めぐり 3 slides (commit `43facc6`)
- [x] **sakura.json 扩充** — 25 spots 覆盖九州/近畿/首都圏/東北/北海道 (commit `43facc6`)
- 🔄 **EAS preview build `a9f3b18b`** — 排队中 (profile: preview, commit `43facc6`)
  - Monitor: https://expo.dev/accounts/cbnium/projects/pixel-herbarium/builds/a9f3b18b-5ed1-4a83-9db5-766ae34347dc
- [ ] 真机验证打卡向导（选图 → 选 spot → 预览 → 保存）
- [ ] App Store Connect 元数据填写（见下）
- [ ] Production EAS build + submit

### OTA 补充（Phase 3 之后）
- [ ] WatermarkTemplate（叠加水印模板）
- [ ] PixelTemplate（像素化模板）
- [ ] TemplateSelector（模板选择 UI）

---

## Layer 2: Codemagic + Maestro E2E — 待新 EAS 构建完成

**当前状态**：Jest + TS CI 全通过 ✅ | Maestro E2E 待新 EAS Simulator build 完成后重测

### 根因分析（已更新 — Build #13 `69baba5d`）
- ❌ **6/6 Maestro flows 失败** — 双重根因：
  1. **旧 flows**：Build #13 用了 commit `47b8112`(22:41)，Maestro flow 更新在 `ae6b2bd`(23:04) 之后 → 旧 flows 仍用 `text: "スキップ"`
  2. **旧 EAS binary**：EAS `100ca731` 于 23:07 才排队，Build #13 (22:44) 运行时不存在 → 下载了旧 `b99f88df` (CHECKIN_MODE=false)

### 已完成修复 (commit `ae6b2bd`)
- [x] **Jest mock 修复** — `DiscoverScreen.test.tsx` 加 `jest.mock('expo-secure-store', ...)`
- [x] **4个 testID 新增** — home/footprint/checkin/settings 加 `testID="xxx.container"`
- [x] **Maestro flows 全量更新** — 适配 CHECKIN_MODE UI (id: selector 替代 text: selector)
- [x] **EAS Simulator build `100ca731`** 已排队 (commit `4ae8eb7`，含所有 testID)
  - Monitor: https://expo.dev/accounts/cbnium/projects/pixel-herbarium/builds/100ca731-861f-4ff9-928a-ef2a15a542db

### 待做
- [ ] **等待 EAS Simulator build `100ca731` 完成**（排队中，约 30-60 分钟）
- [ ] **在 Codemagic 手动触发新 build** (dev 分支 `a7c3ba0`)，验证 Maestro E2E 通过
  - 预期：6/6 PASS（新 binary + 新 flows）
- [ ] Visual regression baselines + Git LFS
- [x] **Layer 4: GitHub Actions release workflow** — `.github/workflows/release.yml` 完善
  - 触发条件：`git push tag v*`
  - Job 1: TypeScript + Jest validate (timeout 10min)
  - Job 2: `eas build --auto-submit` production iOS (timeout 60min)
  - 需要：GitHub Secret `EXPO_TOKEN` ✅ | EAS 存储的 Apple credentials（首次需交互式 `eas submit` 保存）

### Build IDs
- **新 EAS Simulator**: `100ca731` (commit `4ae8eb7`) ← 排队中 (23:07 CST)
- 旧 EAS Simulator: `b99f88df` (commit `2d42b30`) ← 废弃
- Codemagic App: `69ba556c2217be10dc8b85f8`
- Build #13: `69baba5d` (commit `47b8112`, 旧flows+旧binary → 6/6 失败，已诊断)

---

## 已完成基础设施 ✅

| 项目 | 状态 |
|------|------|
| 450 tests passing | ✅ |
| TypeScript 0 errors | ✅ |
| EAS 账号绑定 (cbnium / zmuleyu@gmail.com) | ✅ |
| EAS projectId: `74427c7e-dba6-4061-9cc9-3651d09fae01` | ✅ |
| EAS env SUPABASE_ANON_KEY (production + preview) | ✅ |
| Supabase redirect URLs (`pixelherbarium://`) | ✅ |
| Supabase Edge secrets (PLANTNET / REPLICATE / URL / KEY) | ✅ |
| Apple Developer Program 注册 | ✅ |
| Apple Sign In 配置 | ✅ |
| OTA (expo-updates) 配置 | ✅ |
| 账户删除功能 | ✅ (soft-delete `deletion_requested_at`) |
| 冷启动闪屏修复 | ✅ (index.tsx spinner) |
| Privacy Policy HTML | ✅ `docs/app-store-prep/privacy-policy.html` |
| Privacy Policy 托管 | ✅ GitHub Pages 已启用 2026-03-18 |
| **Privacy Policy URL** | ✅ `https://zmuleyu.github.io/pixel-herbarium/privacy-policy.html` |
| 内部 build 已安装测试 | ✅ build `ed606d36` 已在 iPhone 安装 |

---

## 待完成 — App Store Connect 元数据

> 登录 appstoreconnect.apple.com → My Apps → 创建 App 后填写

- [ ] **创建 App**：Bundle ID `com.pixelherbarium.app` / SKU `pixel-herbarium`
- [ ] **App 名称**（日文）：`花図鉑 — ピクセルアート花図鑑`
- [ ] **副标题**：`花を撮って、ピクセルアートに変えよう`
- [ ] **关键词**：`花言葉,花図鑑,ピクセルアート,植物識別,花の名前,散歩,桜,コレクション,花束,季節`
- [ ] **描述**（日文 ≤4000字）：见 `docs/aso/app-store-metadata-ja.md`
- [ ] **宣传文本**（3-4月桜版）：见 `docs/aso/app-store-metadata-ja.md`
- [ ] **Support URL**：`https://cybernium.cn`
- [ ] **Privacy Policy URL**：`https://zmuleyu.github.io/pixel-herbarium/privacy-policy.html`
- [ ] **年龄分级**：4+
- [ ] **App Privacy 营养标签**：见 `docs/app-store-prep/compliance-checklist.md` §4 表格

---

## 待完成 — 截图

> 需在 iPhone（6.9" = iPhone 16 Pro Max）上拍摄，或用 Simulator

截图计划见 `docs/app-store-prep/screenshot-plan.md`（如有）

| # | 画面 | 状态 |
|---|------|------|
| 1 | 相机→识别结果（ピクセルアート表示） | ⏸ 待拍摄 |
| 2 | 花言葉カード（表→裏） | ⏸ 待拍摄 |
| 3 | 図鑑グリッド（コレクション） | ⏸ 待拍摄 |
| 4 | LINEカード / 花束画面 | ⏸ 待拍摄 |
| 5 | 地図タブ（発見スポット） | ⏸ 待拍摄 |
| 6 | 社交Tab / 花束贈り | ⏸ 待拍摄 |

---

## 待完成 — 构建与提交

- [ ] **Production EAS build**（原生构建，约 15-30 分钟）
  ```bash
  cd D:/projects/Games/gardern/pixel-herbarium
  npx eas build --profile production --platform ios
  ```
- [ ] **EAS submit**（自动提交到 App Store Connect）
  ```bash
  npx eas submit --platform ios --latest
  ```
  - 需要先在 `eas.json` submit section 填写 `appleId` + `ascAppId`

---

## 待完成 — 合规最终验证

- [ ] 真机测试核心流程：启动 → 登录(Apple Sign In) → 识别 → 收集 → 花言叶 → Share Poster
- [ ] 测试冷启动（非 dev server，使用 production build）
- [ ] 测试无网络状态下的错误处理
- [ ] App Store Connect 所有必填字段无红色警告
- [ ] 填写 Review Notes（Apple Sign In 测试账号 + AI 识别功能使用路径）

---

## 关键资源

| 资源 | 路径/URL |
|------|---------|
| ASO 元数据（日文） | `docs/aso/app-store-metadata-ja.md` |
| 合规检查清单 | `docs/app-store-prep/compliance-checklist.md` |
| 隐私政策（HTML） | `docs/app-store-prep/privacy-policy.html` |
| 隐私政策（线上） | `https://zmuleyu.github.io/pixel-herbarium/privacy-policy.html` |
| App Store Connect | `https://appstoreconnect.apple.com` |
| EAS Dashboard | `https://expo.dev/accounts/cbnium/projects/pixel-herbarium` |
