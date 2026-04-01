# ASC Configuration Gate Checklist

> App Store Connect 配置门。提交 Review 前，每个字段必须填写并打勾。任何一项未完成均视为阻塞。

---

## 必填字段（8 项）

### CS1 · 内容版权（Content Rights）

- [ ] 「Does your app contain, display, or access third-party content?」选项已选择
- [ ] 若使用第三方内容（花卉图鉴/花语数据），确认已获得授权或使用 CC 兼容许可

### CS2 · 定价（Pricing）

- [ ] 价格设定为 **$0.00 USD**（免费）
- [ ] 所有销售地区价格层级确认为 Tier 0 / Free

### CS3 · 销售范围（Availability）

- [ ] 日本（JP）已勾选为销售地区
- [ ] 全球上架或仅日本先行已按发布策略配置（当前：日本先行）

### CS4 · 隐私标签（Privacy Nutrition Labels）

- [ ] 「Data Collection」已如实填写：
  - 相机使用：设备内处理，不上传至服务器 → 选 "Data Not Collected"（若不上传）
  - 崩溃日志（Crashlytics）：选 "Crash Data"，用途 "App Functionality"
- [ ] 所有标签与实际代码行为一致（已对照 `privacy-policy-ja.md` 验证）

### CS5 · 年龄分级（Age Rating）

- [ ] 问卷已完成，无成人内容 / 赌博 / 暴力等敏感项
- [ ] 最终评级为 **4+**

### CS6 · 构建版本（Build）

- [ ] 正确的构建版本已上传并关联到当前版本（Version）
- [ ] 构建版本的 `buildNumber` 与 `app.json` 一致
- [ ] 构建状态为 "Ready to Submit"（非 Processing）

### CS7 · 类别（Category）

- [ ] 主类别已选择 **Lifestyle**
- [ ] 次类别（可选）已选择 **Reference** 或留空

### CS8 · URL（Support & Privacy Policy）

- [ ] Support URL：已填写，HTTP 200，SSL 有效
- [ ] Privacy Policy URL：已填写，HTTP 200，SSL 有效（`https://` 开头）
- [ ] 两个 URL 均使用相同根域名（一致性检查）

---

## 截图上传

### 6.5" iPhone（1284 × 2778 px）

- [ ] 截图 1：Home Tab（満開の桜 + 花カード グリッド）
- [ ] 截图 2：Diary Tab（印章记录列表）
- [ ] 截图 3：Settings Tab 或 Stamp Editor 详情页
- [ ] 截图顺序与 ASC 预览顺序一致（Home 在首位）
- [ ] 所有截图均为 PNG 格式，无黑边，无测试账号信息

---

## Review Notes（审核说明）

- [ ] Review Notes 已填写（中文或英文均可，但英文更清晰）
- [ ] 说明内容包括：
  - 账号创建/登录方式（Apple Sign In 流程）
  - 核心功能路径（Home → 花を撮る → 识别 → Stamp）
  - 权限说明（相机仅用于植物识别，不持久存储）
  - 若有测试账号，提供 email/password

---

## 最终验证

- [ ] ASC 版本页面显示 「准备提交」状态无橙色/红色感叹号
- [ ] 点击「添加以供审核」后无阻断性弹窗或错误提示
- [ ] 提交后在 ASC「版本历史」中确认状态变为 "Waiting for Review"

---

*Checklist v1.0 · 2026-03-29*
