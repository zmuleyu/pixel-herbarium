# Progress — pixel-herbarium
Updated: 2026-03-27

## 当前阶段
v1.1.0 app-review Phase C ✅ 完成 → Phase D 准备中

## 待办
- [ ] ⚠️ ASC截图手动排序（用户手动）：01-home→position1, 02-checkin→position2
- [ ] app-review Phase D：`/app-review --phase D` → production build + Reviewer Run + eas submit
- [ ] DB migration：apply 026/027/028 到 Supabase production（Sync监督型）
- [ ] Layer 3: 弹窗/权限/引导 UI 规范落地
- [ ] Layer 4: v2 水印编辑器 + 图鉑系统

## 已完成（本次 session）
- [x] GHA simctl launch hang修复 + Simulator.app路径修复（e2deeb5）
- [x] screenshot-compose.mjs 更新：03-footprint + 删除05-onboarding（0faa6e5）
- [x] CI run 23640819862 成功：4张截图上传ASC 6.9" slot（已合成1320×2868）
- [x] docs/screenshot-pipeline.md 创建：264行完整截图管线文档（2d09a80）
- [x] app-review Phase C 截图验收完成

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
