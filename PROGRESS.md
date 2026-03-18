# Pixel Herbarium — App Store 提交进度

Updated: 2026-03-18

---

## 已完成基础设施 ✅

| 项目 | 状态 |
|------|------|
| 317+ tests passing | ✅ |
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
