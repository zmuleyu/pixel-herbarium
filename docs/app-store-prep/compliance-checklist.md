# App Store 上架合规检查清单

> 基于 Appiary 内置合规检查思路定制，提交前逐项核查。
> 参考：[App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

## 1. 技术合规

- [ ] **加密声明**：`app.json → ios.infoPlist.ITSAppUsesNonExemptEncryption: false` ✓ 已配置
- [ ] **Bundle ID 一致**：`app.json` 中 `com.pixelherbarium.app` = App Store Connect 中的 Bundle ID
- [ ] **版本号格式正确**：`version: "1.0.0"`（语义化版本），buildNumber ≥ 1
- [ ] **支持最低 iOS 版本**：Expo SDK 55 支持 iOS 16+，在 App Store Connect 设置 "iOS 16.0 or later"
- [ ] **仅 Portrait 方向**：`orientation: "portrait"` ✓ 已配置
- [ ] **iPad 未支持**：`supportsTablet: false` ✓ 已配置（无需 iPad 截图）

---

## 2. 权限声明

> 每项权限必须：(1) 在 app.json 中声明用途 (2) 实际功能中确实使用 (3) 两者描述一致

- [ ] **相机权限** `NSCameraUsageDescription`：app.json ✓ → 植物拍照功能已实现
- [ ] **位置权限** `NSLocationWhenInUseUsageDescription`：app.json ✓ → GPS 标记功能已实现
- [ ] **照片库读取** `NSPhotoLibraryUsageDescription`：app.json ✓ → 从相册选图已实现
- [ ] **照片库写入**（expo-media-library）：`savePhotosPermission` ✓ → Share Poster 保存已实现
- [ ] **推送通知**（expo-notifications）：通知权限运行时请求，无需 infoPlist 条目 ✓
- [ ] ⚠️ **核查**：未在应用中实际使用的权限（如 `RECORD_AUDIO` on Android）需确认是否有真实需求

---

## 3. Apple Sign In 合规

- [ ] `usesAppleSignIn: true` 已在 `app.json` 配置 ✓
- [ ] Apple Sign In 是**唯一**第三方登录（满足"所有第三方登录必须同等提供 Apple Sign In"要求）✓
- [ ] Apple Sign In 按钮样式符合 [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)（黑色/白色/轮廓三选一）
- [ ] 用户删除账户功能已实现（Apple 审核自 2022 年强制要求）

---

## 4. 隐私数据标签（App Store Connect 必填）

> 在 App Store Connect → App Privacy 中填写

| 数据类型 | 是否收集 | 用途 | 与用户关联 |
|---------|---------|------|-----------|
| 电子邮件地址 | ✅ | 账户（Apple Sign In） | 是 |
| 姓名 | ✅ | 账户显示名称 | 是 |
| 精确位置 | ✅（可选） | 植物发现记录 | 是 |
| 照片或视频 | ✅ | 植物识别 | 否（不存储用户照片） |
| 设备 ID | ✅ | 推送通知 token | 否 |
| 使用数据 | ✅ | 应用功能分析 | 否 |
| 联系人 | ❌ | — | — |
| 财务信息 | ❌ | — | — |

- [ ] 以上表格已在 App Store Connect Privacy Nutrition Label 中填写完成
- [ ] 隐私政策 URL 已填写（见 `privacy-policy.md` 中的 hosting 方案）

---

## 5. 内容与年龄分级

- [ ] 年龄分级：**4+**（无暴力/性内容/赌博/恐怖内容）
- [ ] 应用描述中无竞品名称（PictureThis、GreenSnap 等不可出现在描述中）
- [ ] 无误导性功能声明（广告中的功能必须在当前版本中可用）
- [ ] ⚠️ **核查广告中提及的功能是否当前版本均已实现**：
  - 植物 AI 识别 → 已实现？
  - 像素艺术生成 → 已实现？
  - 花言叶翻卡 → 已实现 ✓
  - Share Poster → 已实现 ✓
  - 季节系统 → 已实现 ✓
  - 同城地图（热力图）→ 已实现？⚠️ 确认
  - LINE 花束赠送 → 已实现？⚠️ 确认（v1.0 未实现则须从描述移除）
  - 月 5 次免费识别 → IAP 未实现时需调整描述

---

## 6. 元数据完整性

- [ ] App 名称（App Store Connect）：`花図鉑 — ピクセルアート花図鑑`（≤30字）
  - 注：app.json 中 `name: "花図鉑"` 为设备主屏显示名，App Store 名在 Connect 中单独设置
- [ ] 副标题：`花を撮って、ピクセルアートに変えよう`（≤30字）
- [ ] 描述：日文 ≤4000字，英文 ≤4000字 → 见 `docs/aso/` 目录
- [ ] 关键词：日文 ≤100字 ✓
- [ ] 宣传文本：≤170字（可随时更新，无需审核）
- [ ] **Support URL**：必须有效且可访问（可填 `https://cybernium.cn` 或专属支持页）
- [ ] **Privacy Policy URL**：见 `privacy-policy.md` 中确定的 hosting URL
- [ ] 截图：至少覆盖 6.9"（iPhone 16 Pro Max），见 `screenshot-plan.md`
- [ ] App Icon：已在 `assets/icon.png` 配置 ✓（1024×1024 PNG，无圆角，无透明）

---

## 7. 上架前最终验证

- [ ] 真机测试核心流程：启动 → 登录（Apple Sign In）→ 植物识别 → 收集 → 花言叶 → Share Poster
- [ ] 测试 App 冷启动（非 dev server 状态，使用 preview 或 production build）
- [ ] 测试无网络状态下的错误处理
- [ ] 确认 App 不在启动时崩溃（审核员会首先测试这个）
- [ ] App Store Connect 中所有必填字段无红色警告

---

## 提交后

- [ ] TestFlight 内部测试通过（当前 build `33421d40` 等待中）
- [ ] 填写审核笔记（Review Notes）：说明 Apple Sign In 测试账号 + 特殊功能使用路径
- [ ] 选择发布方式：手动发布（审核通过后自己确认上线）
