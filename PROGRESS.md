# Progress — pixel-herbarium [AHB]
Updated: 2026-04-01

## 当前阶段
v1.1.0 build 5 打包中（GHA run #23828426088，2026-04-01 触发）→ 等待 ASC 上传完成后填写 Demo Account 提交审核

## 待办（重新提交前）
- [x] 创建 Supabase Demo Account：`review@pixelherbarium.app` ✅（已通过 SQL 创建，email 已确认，profile 自动生成）
  - 密码：`ReviewPass2024!`
- [x] 触发 GHA release.yml 打 build 5 ✅（run #23828426088，in_progress）
- [ ] 等待 GHA build 5 完成 → 确认 ASC 收到新 build
- [ ] ASC → App Review Information → Demo Account：填写邮箱 + 密码
- [ ] Resolution Center 回复修改说明（使用 docs/launch/rejection-playbook.md Section 3 模板）
- [ ] 提交审核

## 待办（审核通过后）
- [ ] 更新 rejection-playbook.md 历史记录"结果"列为"审核通过"
- [ ] MEMORY.md AHB 状态更新为 v1.1.0 已上线
- [ ] Layer 3: 弹窗/权限/引导 UI 规范落地
- [ ] Layer 4: v2 水印编辑器 + 图鉑系统

## 已完成（本次 session — 2026-04-01）
- [x] privacy.tsx — setLoading 移至 finally，guest 分支补调，canGoBack() 守卫提取为 handleBack()
- [x] guide.tsx — handleBack() + canGoBack() 守卫
- [x] signup.tsx — 新建邮箱注册页（try/catch/finally、密码校验、空输入禁用）
- [x] login.tsx — 新增"メールで登録"注册入口链接
- [x] i18n ja/en — 新增 4 个 auth key
- [x] 新建 postmortem：docs/dev/postmortems/2026-04-01-appstore-review-rejection-2-1a.md
- [x] rejection-playbook v1.1（+2.1a速查行、+Section 4 Bug Fix Submissions、+通话模板、+首条历史记录）
- [x] pre-release checklist v1.1（+Section 5，9 条 App Review Compliance 项，含 5.5 官方 Notes 指引）
- [x] review-notes（+双账号状态对照表、+Option A 邮箱登录、+注册流程说明、+地区设计说明）

## 已完成（历史）
- [x] v1.1.0 build 4 Submit to ASC ✅ + GHA全链路PASS + 截图上传
- [x] 发版工作流固化：7阶段RELEASE-WORKFLOW.md + 3个pre-submit脚本 + /release skill + release-guard hook
- [x] 788→790 tests，104 suites · iOS 构建迁移 GHA 原生 xcodebuild
- [x] GHA 截图管线修复 + ASC 4 张截图上传
- [x] DB migration 026/027/028 推送生产
