# App Store Connect 提交指南

> 本文件是 App Store Connect 填写操作手册，内容来源指向 `docs/aso/` 目录。
> 参考：NxCode 一键上传到 App Store Connect 的流程设计。

---

## 前提条件

- [ ] EAS build（preview 或 production profile）已完成构建
- [ ] App Store Connect 中已创建应用（Bundle ID: `com.pixelherbarium.app`）
- [ ] 隐私政策 URL 已 host 并可访问（见 `privacy-policy.md`）

---

## Step 1：上传 Build

```bash
# 方法 A：EAS Submit（自动上传到 App Store Connect）
npx eas submit --platform ios --latest

# 方法 B：手动上传
# 下载 IPA → Transporter.app → 拖入上传
```

**注意：** 首次上传需等待 Apple 处理 10-30 分钟，才能在 TestFlight 或版本中选择 build。

---

## Step 2：填写版本信息

### App Store Connect → My Apps → 花図鉑 → iOS App → 版本

| 字段 | 填写内容 | 来源 |
|------|---------|------|
| **App 名称** | `花図鉑 — ピクセルアート花図鑑` | `docs/aso/app-store-metadata-ja.md` |
| **副标题** | `花を撮って、ピクセルアートに変えよう` | 同上 |
| **宣传文本** | （见樱花季版本）| 同上（可随时改，无需审核）|
| **描述** | 日文版全文 | `docs/aso/app-store-metadata-ja.md` |
| **关键词** | `花言葉,花図鑑,ピクセルアート,植物識別,花の名前,散歩,桜,コレクション,花束,季節` | 同上 |
| **Support URL** | `https://pixel-herbarium.app/support` | ✅ |
| **Privacy Policy URL** | `https://pixel-herbarium.app/privacy-policy` | ✅ |
| **版本号** | `1.0.0` | `app.json` |
| **年龄分级** | `4+` | — |

> 英文本地化（可选，扩大搜索覆盖）：内容见 `docs/aso/app-store-metadata-en.md`

---

## Step 3：上传截图

见 `screenshot-plan.md` 获取截图流程。

| 设备 | 截图数量 | 尺寸要求 |
|------|---------|---------|
| iPhone 16 Pro Max (6.9") | 5-8 张 | 1320 × 2868 px |
| iPhone 14 Plus (6.5") | 可复用 6.9" | 自动缩放 |

截图内容脚本见 `docs/aso/app-store-metadata-ja.md` → スクリーンショット文案（6枚）。

---

## Step 4：App Privacy（隐私数据标签）

App Store Connect → App Privacy → Edit

按 `compliance-checklist.md` 中的隐私数据表格逐项填写：

| 需填写 | 数据类型 | 用途 |
|------|---------|------|
| ✅ | 联系信息 → 电子邮件地址 | 账户（用户身份关联）|
| ✅ | 联系信息 → 姓名 | 账户（用户身份关联）|
| ✅ | 位置 → 精确位置 | App 功能（用户身份关联）|
| ✅ | 照片或视频 → 照片 | App 功能（不关联用户）|
| ✅ | 标识符 → 设备 ID | 开发者的广告或营销（推送 token，不关联）|
| ✅ | 使用数据 → App 使用情况 | 分析（不关联用户）|

---

## Step 5：审核笔记（Review Notes）

> 审核员在测试时需要的额外信息（非必填但强烈推荐）

```
Test Account: 使用 "Hide My Email" Apple ID 登录
Test Flow:
1. Launch app → Sign in with Apple
2. Browse spring plant collection (60 species)
3. Tap any plant → Flower language card (flip animation)
4. Tap Share button → Generate Share Poster → Save to library
5. Season indicator visible at top of home screen

Notes:
- AI plant identification requires camera + internet connection
- Location permission is optional; declining does not block any core feature
- Push notifications are opt-in only
```

---

## Step 6：发布设置

- **发布方式**：选择"手动发布"（审核通过后自己确认上线，避免意外自动上线）
- **分阶段发布**：可选 7 天分阶段（新 App 第一次建议直接 100%）
- **可用地区**：优先日本（JPY 定价），其次中国台湾/香港/新加坡

---

## 常见问题

**Q: app.json 中的 `name: "花図鉑"` 与 App Store 名称不同？**
A: 正常。`app.json → name` 是设备主屏显示名（应简短），App Store 完整名称在 Connect 中单独设置。

**Q: 提交后还能 OTA 更新吗？**
A: JS/UI 改动可以用 `npx eas update --branch production` 推 OTA，无需重新提交。
  原生配置改动（权限/Bundle ID/原生模块）需要新 build + 新版本提交。

**Q: TestFlight 和 App Store 版本分开吗？**
A: TestFlight 用 distribution: internal（Ad Hoc），App Store 用 production profile。
  当前 build `33421d40` 是 preview（internal），正式提交需用 production profile 构建。
