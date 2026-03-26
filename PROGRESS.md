# Progress — pixel-herbarium
Updated: 2026-03-26

## 当前阶段
v1.1.0 app-review Phase C 进行中 · 截图已完成(4 PNGs in e2e/current/) · 下一步 compose → ASC upload

## 待办
- [ ] `/screenshots compose` → 选择引擎(appshot/canvas/store-mcp) → 生成营销截图
- [ ] app-review Phase C：C14 ASC 字段确认、C-jp2 日文检查
- [ ] app-review Phase D：production build + Reviewer Run + eas submit
- [ ] DB migration：apply 026/027/028 到 Supabase production
- [ ] Layer 3: 弹窗/权限/引导 UI 规范落地
- [ ] Layer 4: v2 水印编辑器 + 图鉑系统

## 已完成（本次 session）
- [x] GHA screenshot-build.yml 修复：signal驱动 + .env.local 注入（04002be）
- [x] GHA run #23583941082 成功：4 screenshots 下载到 e2e/current/（c4a1467）
- [x] Claude Code hook 超时加固（4脚本，与 pixel-herbarium 无直接关联）

## 已完成（历史）
- [x] Task 1.1+1.2：ajisai/himawari/momiji 3季数据（251条）+ migrations 026/027/028 + SPOT_REGISTRY接入
- [x] app-review Phase A PASS (563 tests) · Phase B PASS
- [x] B fix：app.json 补 NSPhotoLibraryAddUsageDescription
- [x] GHA screenshot-build.yml 创建（dev branch trigger）
- [x] Swift 6 严格并发修复：expo-build-properties + SWIFT_STRICT_CONCURRENCY=minimal
- [x] App Icon / Splash / TabBarIcon 品牌化
- [x] brand.accent #D4537E 双层色系
- [x] Petal Press brainstorming 完成：spec + context doc + HTML 原型预览 + code review
- [x] Petal Press 动效实装（2026-03-23）：PetalPressAnimation.tsx + StampPreview 集成 + haptics.stampPress + 4 tests

## 截图恢复命令
```
gh run view 23405055269 --repo zmuleyu/pixel-herbarium
gh run download 23405055269 --repo zmuleyu/pixel-herbarium --dir ~/Downloads/screenshot-ipa
```
