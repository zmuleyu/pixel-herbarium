# Pixel Herbarium — 赏花打卡 Pivot 进度

Updated: 2026-03-19 (15:00)

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

## ✅ Phase 3: 功能增强 — 完成 (commit `133fee8`)

### Phase 3 核心任务
- [x] **onboarding 文案更新** — 花めぐり 3 slides (commit `43facc6`)
- [x] **sakura.json 扩充** — 25 spots 覆盖九州/近畿/首都圏/東北/北海道 (commit `43facc6`)
- [x] **EAS preview build `a9f3b18b`** — ✅ finished 2026-03-19 02:36
- [x] **EAS simulator build `100ca731`** — ✅ finished 2026-03-19 05:19
- [x] **useReviewPrompt** — 30-day cooldown レビュー促進 (commit `dd459ed`)
- [x] **map.tsx** — sakura spots layer + PIN rendering + proximity check + check-in sheet (commit `90767ad`)
- [x] **herbarium.tsx** — sakura spots tab + SpotStampGrid + SpotDetailSheet (commit `953b964`)
- [x] **notify-bloom Edge Function** — pg_cron integration stub (commit `133fee8`)
- [x] **SharePoster spot format** — format='spot' variant (commit `3d17bd6`)
- [x] **Migration 021 applied to Supabase** — sakura_spots + spot_checkins + checkin_spot RPC (commit `b3aadb5`)
- [x] **database.ts regenerated** — sakura_spots/spot_checkins types (commit `b3aadb5`)
- **457 tests passing** | TypeScript 0 errors

### OTA 补充（上线之后）
- [ ] WatermarkTemplate（叠加水印模板）
- [ ] PixelTemplate（像素化模板）
- [ ] TemplateSelector（模板选择 UI）

---

## ✅ Phase 4: Content Pack Architecture — 完成 (commit `fe38b7ae`)

- [x] **M1**: `src/types/region.ts` (RegionConfig/GeoBounds) + `src/data/packs/jp/region.ts`
- [x] **M1**: sakura.json 移至 `src/data/packs/jp/seasons/` + 所有 spot 添加 `regionId: 'jp'`
- [x] **M2**: Migration 022 (line_uid to profiles) — ✅ applied to Supabase
- [x] **M2**: Migration 023 (sakura_spots → flower_spots + region_id + season_id) — ✅ applied to Supabase
- [x] **M2**: 25 flower spots seeded — ✅ verified (`spot_count: 25`)
- [x] **M3**: `src/services/content-pack.ts` (getActiveRegion / loadSpotsData)
- [x] **M3**: `sakura-store.ts` → `spot-store.ts` (useSakuraStore → useSpotStore)
- [x] **M3**: `types/sakura.ts` → `types/spot.ts` + season_id 字段
- [x] **M4**: 所有 tab 组件改用 useSpotStore + loadSpotsData
- [x] **M4**: notify-bloom Edge Function 更新为 flower_spots
- [x] **492 tests passing** | TypeScript 0 errors

---

## Layer 2: Codemagic + Maestro E2E + 截图

**当前状态**：Jest + TS ✅ | Codemagic `69bb6fc1c02438a9669bd938` 🔄 running（eas build --local）

### 已完成
- [x] Jest mock 修复 + 4 个 testID 新增 + Maestro flows 全量更新
- [x] EAS Simulator build `fb6c8451` — ✅ finished (含 stamp 代码，PROGRESS 旧注释有误)
- [x] Layer 4: GitHub Actions release workflow (`release.yml`)
- [x] stamp PR #1 merged master `85059cd` — ✅
- [x] 6 个 Maestro 截图 flows — ✅ (e2e/screenshots/)
- [x] ASC 元数据全部填写 — 推广文本/描述/关键词/联系信息/隐私政策URL ✅

### 待做
- [ ] **Codemagic build `69bb6fc1c02438a9669bd938` 完成** — 🔄 running ~30-50 min
- [ ] **下载 artifacts** `e2e/current/*.png`（8 张：discover/herbarium/login/map/profile/stamp×3）
- [ ] **Canva 后期处理** — 添加文字叠加 + 设备边框
- [ ] **上传截图到 ASC** — App Store Connect → 花図鉑 → 6.9" 截图

### Build IDs
- **Codemagic (screenshot)**: `69bb6fc1c02438a9669bd938` — 🔄 running 2026-03-19
- **EAS Simulator**: `fb6c8451` (commit `fe38b7ae`) — ✅ (含 stamp)
- **EAS Preview (stamp)**: `1643f1b6` — ✅ (OTA 已推 preview)
- Codemagic App: `69ba556c2217be10dc8b85f8`

---

## 已完成基础设施 ✅

| 项目 | 状态 |
|------|------|
| 457 tests passing | ✅ |
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

- [x] **创建 App** — ✅ ASC App ID: `6760695082`
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
