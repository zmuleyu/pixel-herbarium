# Progress — pixel-herbarium
Updated: 2026-03-23

## 当前阶段
v1.1.0 app-review Phase A/B PASS · GHA screenshot-build workflow 已改写（xcodebuild 直接构建），待触发新 run

## 待办
- [ ] 触发新 GHA screenshot-build run（`gh workflow run screenshot-build.yml --repo zmuleyu/pixel-herbarium --ref dev`）
  - 成功 → 下载 IPA → `gh run download <run_id>` → 放入 e2e/current/ → /screenshots compose
  - 失败 → 读日志继续排查 xcodebuild 配置
- [ ] app-review Phase C：截图生成后继续（C14 ASC 字段确认、C-jp2 日文检查）
- [ ] app-review Phase D：production build + Reviewer Run + eas submit
- [ ] DB migration：apply 026/027/028 到 Supabase production
- [ ] Petal Press 盖章动画优化（spec 已写，效果待改进）
  - 分析小红书原始视频（`69bd239b0000000023022590`，需修复 XHS cookies）
  - 研究专业动效工具（Lottie/Rive/Skia）
  - 参考工具包：`C:\Users\Admin\Desktop\分析\xhs-analyzer.zip`
- [ ] Layer 3: 弹窗/权限/引导 UI 规范落地
- [ ] Layer 4: v2 水印编辑器 + 图鉑系统

## 已完成
- [x] Task 1.1+1.2：ajisai/himawari/momiji 3季数据（251条）+ migrations 026/027/028 + SPOT_REGISTRY接入
- [x] app-review Phase A PASS (563 tests) · Phase B PASS
- [x] B fix：app.json 补 NSPhotoLibraryAddUsageDescription
- [x] GHA screenshot-build.yml 创建（dev branch trigger）
- [x] Swift 6 严格并发修复：expo-build-properties + SWIFT_STRICT_CONCURRENCY=minimal
- [x] App Icon / Splash / TabBarIcon 品牌化
- [x] brand.accent #D4537E 双层色系
- [x] Petal Press brainstorming 完成：spec + context doc + HTML 原型预览 + code review

## 截图恢复命令
```
gh run view 23405055269 --repo zmuleyu/pixel-herbarium
gh run download 23405055269 --repo zmuleyu/pixel-herbarium --dir ~/Downloads/screenshot-ipa
```
