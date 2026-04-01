# Pre-Release Development Verification Checklist

> S2 开发验证门。提交 ASC 前按顺序完成所有项目。

---

## 1. 自动化测试

- [ ] `pnpm jest --ci` — 全部 suites PASS，0 failures
- [ ] `npx tsc --noEmit` — TypeScript 类型检查无错误

---

## 2. 本地验证

### L1 · Expo Go（快速冒烟）

- [ ] `npx expo start` 启动无报错
- [ ] Expo Go 扫码加载成功，三个 Tab 正常渲染
- [ ] Metro bundler 无 red screen / yellow warning 积压

### L2 · Dev Build（接近生产环境）

- [ ] Dev Build 在 iOS 模拟器或真机上安装成功
- [ ] 无 native crash on launch
- [ ] Deep link / 权限请求弹窗行为正常

---

## 3. 真机冒烟测试

> 在真实 iPhone 上（非模拟器）执行以下流程，每项打勾确认。

### 启动

- [ ] 冷启动（完全杀进程后重新打开）< 3s 进入 Home Tab
- [ ] Splash screen 正常显示后消失，不卡白屏

### 核心流程

- [ ] Home Tab → 点击「花を撮る」→ 相机权限弹窗出现（首次）或直接进入相机（已授权）
- [ ] 拍照 / 选图 → 植物识别结果页正常加载
- [ ] 识别结果 → 进入 Stamp Editor → 印章预览正常渲染
- [ ] Stamp Editor → 保存 → 返回 Diary Tab 确认记录出现

### Diary Tab

- [ ] Diary Tab 加载花卉记录列表，无空白卡片
- [ ] 点击单条记录进入详情，印章图和花语文字正确显示
- [ ] 下拉刷新不报错

### Settings Tab

- [ ] Settings Tab 渲染正常（版本号显示正确）
- [ ] 隐私政策链接可跳转（Safari 内打开 SSL 正常）

### 断网场景

- [ ] 关闭 Wi-Fi/移动数据后冷启动，无崩溃（显示 offline 提示或缓存内容）
- [ ] 断网状态下触发网络请求，显示错误提示而非空白

### 权限拒绝场景

- [ ] 在系统设置中拒绝相机权限后，进入「花を撮る」显示引导说明，不崩溃
- [ ] 在系统设置中拒绝相册权限后，选图操作给出友好提示，不崩溃

---

## 4. 代码质量

- [ ] i18n key 对等：`ja.json` 与 `en.json` 中的所有 key 数量和名称一致，无缺失
- [ ] 权限描述（`NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription`）使用日语，内容准确描述用途
- [ ] 所有顶层路由均有 `ErrorBoundary` 包裹，不存在裸露的 async throw
- [ ] Review Prompt：`requestReview()` 调用处已设置 cooldown（同一用户不重复在 30 天内弹窗）
- [ ] `app.json` 中 `version` 和 `buildNumber` 均已递增（相对于上次 git tag）
- [ ] `bash scripts/pre-submit/check-version.sh` 返回 exit 0
- [ ] `bash scripts/pre-submit/check-urls.sh` 返回 exit 0（Privacy / Support URL SSL 有效）
- [ ] `bash scripts/pre-submit/check-secrets.sh` 返回 exit 0（12 个 GitHub Secrets 均存在）

---

## 5. App Review Compliance（2026-04-01 新增）

> 根据 v1.1.0 Guideline 2.1(a) 被拒事件新增。提交前必须全部打勾。

### 5.1 Loading 状态安全

- [ ] 所有含异步操作 + loading 状态的函数，`setLoading(false)` 必须位于 `finally` 块中，不得仅在正常路径末尾调用
- [ ] 游客用户（`user === null`）的早返回分支，同样必须调用 `setLoading(false)`

### 5.2 返回按钮安全

- [ ] 所有使用 `router.back()` 的 TouchableOpacity，必须先检查 `router.canGoBack()`
- [ ] `canGoBack()` 为 false 时，提供合理的 fallback（通常为 `router.replace('/(tabs)/settings')`）

### 5.3 注册流程可见性

- [ ] 登录页（`(auth)/login.tsx`）底部有明显的邮箱注册入口（链接到 `(auth)/signup`）
- [ ] 注册页（`(auth)/signup.tsx`）可以在不预置账号的情况下完成注册流程
- [ ] 注册按钮在邮箱或密码为空时处于禁用状态

### 5.4 ASC Review Notes & 审核凭证

- [ ] ASC → App Review Information → Demo Account：**Username（邮箱）** 和 **Password** 均已填写
- [ ] Review Notes 中包含邮箱注册的操作路径说明
- [ ] Demo Account 使用邮箱/密码登录（不依赖 Apple Sign In，因审核员账号无法预填）
- [ ] Review Notes 的 Notes 字段分别说明了**游客模式**和**登录模式**的测试路径（AHB 有两种账号状态）
- [ ] 若 App 行为仅在特定地区可用（如日本限定樱花景点），已在 Notes 中说明地区限制原因

### 5.5 新 App vs 版本更新的 Notes 要求

> 来源：Apple Developer Forums — Tips from App Review (Dec 2025)

**首次提交（新 App）需在 Notes 中说明：**
- [ ] App 的业务模式（免费/内购/订阅）
- [ ] App 的概念和核心使用场景
- [ ] 若功能有地区限制，说明原因

**版本更新需在 Notes 中说明：**
- [ ] 本次更新的主要变更内容（What's New）
- [ ] 重要新功能的具体测试路径（「新功能在哪里找」）

---

*Checklist v1.1 · 2026-04-01*
