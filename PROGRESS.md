# Progress — pixel-herbarium
Updated: 2026-03-29

## 当前阶段
v1.1.0 build 4 已提交 ASC ✅ → 等 TestFlight 分发 → App Store 审核

## 待办
- [ ] ASC build 4 处理完成 → TestFlight 分发给内部测试员验证
- [ ] TestFlight 验证通过后提交 App Store 审核
- [ ] preview-build.yml EAS配额预警 step 待 commit + push
- [ ] Apr 01 EAS 配额重置后执行 `eas build --profile development --platform ios`（装 Dev Build）
- [ ] 装完 Dev Build 后验证 `npx expo start --dev-client` 热重载正常
- [ ] Layer 3: 弹窗/权限/引导 UI 规范落地
- [ ] Layer 4: v2 水印编辑器 + 图鉑系统

## 已完成（本次 session）
- [x] Check-in tab 重写为日记浏览页（DiaryScreen）
- [x] 拍照向导迁移至 /checkin-wizard（非 tab 路由）
- [x] guide.tsx 添加自定义返回按钮（Slot 布局下 Stack.Screen 无效）
- [x] Home 页视觉优化：seasonName 居中 + 3-stop 渐变
- [x] buildNumber 3→4 + tsc/jest 全绿
- [x] GHA preview-build + release 全 PASS
- [x] Submit to ASC 成功（run 23687394903）
- [x] 三层验证体系文档化（5 个记忆/skill 文件更新 + ios-local-preview-workflow.md 新建）
- [x] preview-build.yml 新增 EAS 配额预警 step

## 已完成（历史）
- [x] v1.1.0 build 3：3个 UI bug 修复 + preview+release PASS + ASC
- [x] 788→790 tests，104 suites · iOS 构建迁移 GHA 原生 xcodebuild
- [x] GHA 截图管线修复 + ASC 4 张截图上传
- [x] app-review Phase A/B/C PASS
- [x] DB migration 026/027/028 推送生产
