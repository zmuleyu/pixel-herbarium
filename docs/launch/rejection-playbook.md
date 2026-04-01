# Rejection Playbook — Pixel Herbarium (AHB)

> 审核被拒处理 SOP。收到拒信后按顺序执行，不跳步骤。

---

## 1. 标准恢复流程（10 步）

```
Step 1  进入 App Store Connect → Resolution Center
        读取完整拒绝原因 + Guideline 编号
        下载所有审核截图（通常 3-5 张）
        ↓
Step 2  定位 Guideline
        · 已知原因 → 查本文件「常见 Guideline 速查」表
        · 新原因   → 查 Apple Review Guidelines 官方文档（当前版本）
        ↓
Step 3  判断修复范围
        · 仅 Metadata（截图/描述/隐私标签）→ 不需要新 Build
        · 代码改动 → 需要新 Build + 新 buildNumber
        ↓
Step 4  全量扫描同类模式（修代码前必做）
        · 不要只修 Apple 点名的文件，先 grep 整个 codebase 找同类 pattern
        · 列出完整清单，确认零遗漏后再动第一行代码

        # 返回按钮类问题
        grep -rn "router\.back()" src/app/ | grep -v "canGoBack"
        # loading spinner 类问题
        grep -rn "setLoading(true)" src/hooks/
        # 对每一个 grep 结果确认是否有 try/catch/finally 保护

        · 同时用 gemini or other LLM 分析所有审核截图：
          截图中的每个交互点（按钮/链接/加载）都需要确认已修复
        ↓
Step 5  执行修复
        · 代码修复：写失败测试 → 修复实现 → 通过测试
        · Metadata 修复：在 ASC 直接编辑，不提交新 Build
        ↓
Step 6  机械验证（提交 build 前必做）
        # 零同类遗漏
        grep -rn "router\.back()" src/app/ | grep -v "canGoBack"  # 应为空
        # 类型检查
        npx tsc --noEmit                                           # 0 errors
        # 全量测试
        npx jest --ci                                             # 全部通过
        ↓
Step 7  gemini or other LLM review（提交 build 前必做）
        · 提供 git diff + 所有审核截图 + 拒审原因给 LLM
        · 确认以下三点后才能进入 Step 8：
          □ 每张截图中可见的交互都已修复
          □ 无同类遗漏模式
          □ Resolution Center 回复与每个修复点一一对应
        ↓
Step 8  在 Resolution Center 起草回复（英文）
        · 使用本文件「英文回复模板」
        · 每个 bug 对应一个修复说明 + 验证步骤
        · 必须包含 Demo Account 凭证
        ↓
Step 9  提交新 Build
        · Metadata 修复 → Resolution Center 回复即可触发重审
        · 代码修复 → 触发 Preview Build → 成功后触发 Release Build
          → ASC 填写 Demo Account → 提交以供审核
          → 发送 Resolution Center 回复
        ↓
Step 10 迭代记录
        · 将本次被拒原因 + 修复方案追加到本文件末尾「AHB 历史被拒记录」区块
        · 更新「常见 Guideline 速查」表（如有新 pattern）
```

> **核心原则：Step 4（全量扫描）→ Step 7（LLM review）必须在触发 build 之前完成。
> 过早触发 build 是最常见的浪费——修两轮 = 两倍时间成本。**

---

## 2. 常见 Guideline 速查

| Guideline | 名称 | 典型原因 | 快速修复 |
|-----------|------|---------|---------|
| **2.1(a)** | App Completeness — 功能不完整 | 返回按钮失效（空 navigation stack）；loading 页死锁（setLoading 未在 finally 调用）；缺少注册入口；未提供 Demo Account 邮箱/密码 | 所有 `router.back()` 必须加 `canGoBack()` 守卫；所有 loading 状态的异步函数必须用 `finally { setLoading(false) }`；登录页必须有邮箱注册链接；ASC Review Notes 必须填写 Demo Account 邮箱+密码 |
| **2.1** | App Completeness | 崩溃 / 性能问题 / 功能不完整 | 真机全流程测试；接入 Crashlytics；在最旧支持 iOS 版本验证 |
| **2.3** | Accurate Metadata | 截图与实际 UI 不符；描述了未实现的功能 | 截图必须反映 3-tab 当前 UI；删除未上线功能的描述文案 |
| **3.1.1** | In-App Purchase | 外部支付链接；缺少 Restore Purchases 按钮 | **AHB 无 IAP**，若拒绝需确认无外部付款引导；本项目无 "Restore Purchases" 需求 |
| **4.0** | Sign In with Apple | 有第三方登录（LINE）但未提供 Apple Sign In | **AHB 已实现 Apple Sign In**，拒绝时确认 `auth-flow.md` 实现完整，entitlement 配置正确 |
| **4.2** | Minimum Functionality | 功能过于单薄；感觉像网站封装 | 确保植物识别→印章→Diary 全链路可用；深化离线缓存和本地内容 |
| **5.1.1** | Privacy — Data Collection | 权限描述缺失或不准确；无账号删除入口；Privacy Policy 不可访问 | 补充 `NSCameraUsageDescription` 日语描述；Settings Tab 提供账号删除入口（≤2 步）；确认 Privacy Policy URL SSL 有效 |
| **5.1.2** | Privacy — Data Use | 采集数据超出描述范围 | 对照 Privacy Nutrition Labels 与实际代码，确保一致 |

---

## 3. Resolution Center 英文回复模板

```
Thank you for the review feedback regarding Guideline [X.X].

We have addressed this issue in the updated [build / metadata]:

1. [Specific change made — e.g., "Added account deletion flow in Settings Tab (2 taps)"]
2. [Where the reviewer can verify — e.g., "Settings → Delete Account → Confirm"]

Steps to verify:
1) Open the app → [exact navigation path]
2) [Action to take]
3) [Expected result — e.g., "Account deletion confirmation dialog appears"]

Test account (Apple Sign In not required for this verification):
  Email: [test@example.com]
  Password: [testpassword123]

We believe this update fully addresses the concern raised in Guideline [X.X].
Please let us know if you need any additional information.
```

---

## 4. Bug Fix Submissions 快捷通道

> 来源：Apple Developer Forums — Tips from App Review (Dec 2025)

### 何时可用

当 App 更新版本被拒，且问题**不涉及法律或安全风险**时，Apple 审核员可能会在拒信顶部显示：

> **Bug Fix Submissions**
> The issues we've identified below are eligible to be resolved on your next update.

### 操作方式

收到上述提示后，在 Resolution Center **回复**（不是重新提交）：

```
Thank you for the review feedback.

We acknowledge the issues identified. We will resolve [Issue 1] and [Issue 2] in our next update submission.

We plan to submit the fix within [timeframe, e.g., "3 business days"].
```

### 适用场景 vs 不适用场景

| 适用 | 不适用 |
|------|--------|
| 小 bug（UI 异常、功能降级）| 崩溃 / 安全漏洞 |
| 文案/截图不准确 | 隐私违规 |
| 次要功能缺失 | 法律合规问题 |

### 注意

- 接受 Bug Fix Submissions 后，**必须**在下次提交中真正修复，否则审核员会记录
- 不适合拖延高优先级问题；紧急修复仍应走正常重新提交流程

---

## 5. 申诉指南

### 何时申诉（Appeal）

- 审核员误解了 App 的功能（例如，将植物识别误判为违禁内容扫描）
- 被引用的 Guideline 明显不适用于本 App 类型
- 有充分证据证明 App 符合规范，审核员存在事实性错误

### 何时直接修复（Fix & Resubmit）

- 问题客观存在（崩溃、权限描述缺失、截图不准确）
- 修复比申诉更快（申诉处理通常比重审更慢）
- 拒绝原因模糊但修复成本低

### 申诉步骤

1. ASC → Resolution Center → 点击「Appeal」
2. 每次提交只有一次申诉机会，写之前确认论点充分
3. 申诉语气保持中立、客观，基于事实和 Guideline 条文
4. 不使用情绪化表述（「不公平」「巨大损失」「请再考虑」）
5. 申诉中引用具体 Guideline 编号：「We believe the app complies with Guideline X.X because...」

### 请求与审核员通话

> 来源：Apple Developer Forums — Tips from App Review (Dec 2025)

文字沟通无法解决歧义时，可在 Resolution Center 的回复窗口请求电话：

```
We would like to request a call with an Apple representative to discuss this review.
Preferred time: [Weekday, timezone, e.g., "Tuesday 10:00–12:00 JST"]
Preferred language: Japanese / English
Contact: [Your name and phone number]
```

- 通话请求通过 **Reply to App Review** 提交（不是单独渠道）
- Apple 会尽力配合时区，但无法保证精确时间
- 适用场景：功能误判、复杂交互难以文字描述、需要展示真机操作

---

## 6. AHB 项目注意事项

### Apple Sign In 必须存在（LINE 触发强制要求）

- AHB 已集成 LINE Login（第三方登录），根据 Guideline 4.0，**Apple Sign In 是强制要求**
- 提交前确认 `auth-flow.md` 中 Apple Sign In 实现完整
- `app.json` 中 `ios.entitlements` 已包含 `com.apple.developer.applesignin`

### 账号删除入口（≤ 2 步）

- Guideline 5.1.1 要求账号删除操作不超过 2 步
- 正确路径：Settings Tab → 「アカウント削除」→ 确认弹窗 → 删除完成
- 删除流程中必须包含数据清除说明（符合 Privacy Policy）

### Privacy Policy URL 必须 SSL

- Privacy Policy URL 必须以 `https://` 开头，SSL 证书有效
- 运行 `bash scripts/pre-submit/check-urls.sh` 验证
- 被拒原因包含「privacy policy URL」时优先检查 SSL 而非内容

### 截图必须反映 3-tab 结构

- 当前 AHB 为 3-tab（Home / Diary / Settings），截图必须体现此结构
- 若 UI 更新后 Tab 结构变化，截图必须同步更新
- Guideline 2.3 拒绝时首先检查截图与当前 Build 是否一致

---

## 7. AHB 历史被拒记录

> 每次被拒后在此追加记录，供后续参考。

| 日期 | Build | Guideline | 原因摘要 | 修复方案 | 教训 |
|------|-------|-----------|---------|---------|------|
| 2026-04-01 | build 4 | 2.1(a) | ①返回按钮无响应（空 stack）②隐私设置页无限 spinner ③无邮箱注册入口 ④缺少 Demo Account 凭证 | **第一轮（不完整）**：privacy/guide canGoBack 守卫 + finally loading + 新增 signup.tsx + login 入口 + Demo Account SQL 创建 | 未做全量 grep 扫描，遗漏 6 处 router.back() + 5 个 hook，导致必须打 build 5 |
| 2026-04-01 | build 5 | 2.1(a) | 同上（补全遗漏） | **第二轮（完整）**：settings/recap/checkin-wizard/friend/plant 共 6 处 router.back() 加 canGoBack() 守卫；usePlantDetail/useHerbarium/useSeasonRecap/useBouquets/useFriends 共 5 个 hook 加 try/catch/finally；signup.tsx 注册后自动登录（demo account 直达 home）；LLM review 确认截图覆盖 | 根因：第一轮修复前未执行全量 pattern 扫描，未做 LLM review。新流程已将两步纳入 Step 4/7 |

---

*Playbook v1.2 · 2026-04-01*
