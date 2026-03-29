# Progress — pixel-herbarium
Updated: 2026-03-29

## 当前阶段
v1.1.0 build 4 已提交 ASC ✅ → 等 TestFlight 分发 → App Store 审核

## 待办
- [ ] 验证 GHA Run 4（23697990357）截图内容：home渐变/diary页/settings v1.1.0
- [ ] Run 4 通过后：`node scripts/screenshot-compose.mjs` 生成合成图
- [ ] 手动在 ASC 替换旧 4 张截图 → 上传新 3 张
- [ ] ASC build 4 处理完成 → TestFlight 分发给内部测试员验证
- [ ] TestFlight 验证通过后提交 App Store 审核
- [ ] Apr 01 EAS 配额重置后执行 `eas build --profile development --platform ios`（装 Dev Build）
- [ ] Layer 3: 弹窗/权限/引导 UI 规范落地
- [ ] Layer 4: v2 水印编辑器 + 图鉑系统

## 已完成（本次 session）
- [x] 截图序列改为 3-screen：home→checkin(diary)→settings，删除 footprint 步骤
- [x] screenshot-consistency-check.sh 新建（4项检查）+ release.yml advisory step
- [x] screenshot-build.yml: SCREENSHOT_MODE→EXPO_PUBLIC_SCREENSHOT_MODE（修复3次run失败的根本原因）
- [x] index.html / support.html / privacy-policy.html 更新为 build 4 diary 定位
- [x] GitHub Pages (main 分支) 同步更新，三页 pixel-herbarium.com 已更新

## 已完成（历史）
- [x] v1.1.0 build 3：3个 UI bug 修复 + preview+release PASS + ASC
- [x] 788→790 tests，104 suites · iOS 构建迁移 GHA 原生 xcodebuild
- [x] GHA 截图管线修复 + ASC 4 张截图上传
- [x] app-review Phase A/B/C PASS
- [x] DB migration 026/027/028 推送生产
