# Postmortem: Apple App Store 审核拒绝 — Guideline 2.1(a) App Completeness

**日期：** 2026-04-01
**严重程度：** P0（发布阻断）
**提交版本：** v1.1.0 build 4
**审核设备：** iPhone 17 Pro Max / iOS 26.4（Apple 内部测试设备）
**Submission ID：** ab346555-6ad1-4b3d-8de2-f3922d93ede1
**修复 commits：** `2b2531c` → `2e093b4` → `534c6be` → `baf1a3e` → `f91ceda` → `9bba2ca` → `fe8e5ee`

---

## 审核原始意见

Apple 审核员报告了以下三个问题：

> **Guideline 2.1(a) - Performance - App Completeness**
> - "Return" buttons did not function.
> - Privacy setting screen did not load.
> - There was no Sign ups feature as mentioned in your Review Notes.
>
> **Guideline 2.1(a) - Information Needed**
> - Unable to access all app features. Need demo account credentials.

---

## 根因分析

### Bug 1：隐私设置页面加载卡死（P0）

**文件：** `src/app/privacy.tsx:31-46`

**根因：** `load()` 函数无 `try/catch`，Supabase 查询失败（网络错误、缺少 profile 行等）时，`setLoading(false)` 永远不会执行，用户看到无限 spinner。

额外问题：游客用户（`user === null`）命中 `if (!user) return` 时，同样没有调用 `setLoading(false)`，导致游客也会在隐私设置页看到 spinner。

```typescript
// 修复前 — setLoading(false) 在正常路径末尾，失败时永远不执行
async function load() {
  const { data } = await (supabase as any).from('profiles')...
  if (data != null) { ... }
  setLoading(false);  // ← 查询抛出时永远不到这里
}

// 修复后 — finally 保证无论成功/失败都执行
async function load() {
  try {
    const { data, error } = await ...
    if (error) throw error;
    ...
  } catch (e) {
    console.warn('Privacy: failed to load profile settings', e);
  } finally {
    setLoading(false);  // ← 始终执行
  }
}
```

**类似历史问题：** `2026-03-18-infinite-spinner.md` — `_layout.tsx` 冷启动 spinner 死锁，同样是 `setLoading(false)` 无法执行的模式。

---

### Bug 2：返回按钮在空 navigation stack 下失效（P1）

**文件：** `src/app/privacy.tsx:114`、`src/app/guide.tsx:34`

**根因：** `router.back()` 未检查 navigation stack 是否为空。Apple 审核员可能通过 deep link 或从设置 App 直接跳转进入 `/privacy` 或 `/guide` 页面，此时 stack 为空，`router.back()` 无处返回，按钮表现为"不响应"。

```typescript
// 修复前
onPress={() => router.back()}

// 修复后 — 提取为命名函数，stack 为空时降级到 settings
function handleBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/settings');
  }
}
```

---

### Bug 3：无邮箱注册入口（P0）

**根因：** 登录页面只有登录流程，没有注册入口。`signUpWithEmail()` 函数存在于 `src/services/auth.ts:35`，但从未在 UI 中暴露。

Review Notes 中描述了用户可以登录，但审核员尝试用邮箱创建账号时找不到入口，导致：
1. 无法注册 → 无有效凭证
2. 用既有凭证尝试登录 → "Invalid login credentials"
3. 进而无法访问需要登录的功能（如隐私设置）

**修复：** 新建 `src/app/(auth)/signup.tsx` 注册页面，在登录页底部添加"メールで登録"入口链接。

---

### Bug 4：ASC 未提供有效审核凭证（P0）

**根因：** Review Notes 的测试账号部分描述了 Apple Sign In 流程，未提供具体的邮箱/密码凭证。由于 Apple Sign In 使用审核员自己的 Apple 账号，审核员无法预填凭证，遇到任何问题时没有备选的邮箱账号可用。

---

## 修复方案

| Bug | 修复文件 | Commit | 类型 |
|-----|---------|--------|------|
| 隐私页 spinner 死锁 | `src/app/privacy.tsx` | `2b2531c` | 代码 |
| privacy.tsx 返回按钮 | `src/app/privacy.tsx` | `2e093b4` | 代码 |
| guide.tsx 返回按钮 | `src/app/guide.tsx` | `534c6be` | 代码 |
| 新增注册页面 | `src/app/(auth)/signup.tsx` | `baf1a3e` | 代码 |
| 登录页注册入口 | `src/app/(auth)/login.tsx` | `f91ceda` | 代码 |
| i18n 注册相关 key | `src/i18n/ja.json`, `en.json` | `9bba2ca` | 代码 |
| 注册按钮空输入禁用 | `src/app/(auth)/signup.tsx` | `fe8e5ee` | 代码 |

---

## 模式识别：审核设备环境的特殊性

Apple 审核员使用内部测试设备（iPhone 17 Pro Max / iOS 26.4），行为可能与市售设备不同：

- **Navigation stack 起点不同：** 审核员可能通过 TestFlight 内部链接直接跳转到特定页面，stack 为空
- **网络环境不同：** 审核设备可能通过代理访问，Supabase 查询响应更慢或失败
- **账号状态：** 审核员没有预先创建的账号，需要 App 内提供注册入口或在 Review Notes 中提供完整凭证

---

## 教训与规则

### 1. 所有 `setLoading(false)` 必须在 `finally` 中

凡是有异步操作 + loading 状态的地方：

```typescript
// 错误模式
async function load() {
  const { data } = await query();
  setState(data);
  setLoading(false);  // 异常时永远不执行
}

// 正确模式
async function load() {
  try {
    const { data, error } = await query();
    if (error) throw error;
    setState(data);
  } catch (e) {
    console.warn('failed to load', e);
    // 不 throw，使用默认值
  } finally {
    setLoading(false);  // 始终执行
  }
}
```

### 2. 所有返回按钮必须使用 `canGoBack()` 守卫

凡是使用 `router.back()` 的地方，都应该提取为 `handleBack` 函数：

```typescript
function handleBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/settings');  // 或其他合理的 fallback
  }
}
```

### 3. Review Notes 必须包含邮箱/密码凭证

每次提审前，必须在 ASC 的 App Review Information 中填写：
- **Demo Account Username（邮箱）**
- **Demo Account Password**
- **Review Notes** 中明确说明所有登录方式的测试路径

### 4. 注册流程必须在 App 内可见

如果 App 有账号系统（邮箱登录），必须有 App 内的注册入口，不能依赖外部网站或审核员已知账号。

---

## 预防机制（已集成到流程）

本次事件推动了以下流程改进：

1. **`pre-release.md` checklist 新增项**：
   - 所有 loading 状态的异步函数必须有 `finally { setLoading(false) }` 结构
   - 所有 `router.back()` 调用必须有 `canGoBack()` 守卫
   - 审核凭证：ASC App Review Information 必须填写邮箱/密码
   - 注册流程：登录页必须有可见的注册入口

2. **`rejection-playbook.md` 更新**：
   - 新增 Guideline 2.1(a) App Completeness 快速修复指南
   - 追加本次被拒历史记录

3. **`review-notes.md` 更新**：
   - 补充邮箱注册流程说明
   - 明确填写 Demo Account 凭证指引

---

*Postmortem v1.0 · 2026-04-01*
