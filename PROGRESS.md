# Progress — pixel-herbarium
Updated: 2026-03-21

## 当前阶段
v1.1.0 GHA 构建管线迁移完成 · Build IPA 进行中（Run 23370592595）

## 待办
- [ ] 检查 GHA Run 23370592595 结果（`gh run view 23370592595`）
- [ ] 成功 → 验证 TestFlight 收到 binary → 打 v1.1.0 tag 正式发布
- [ ] 失败 → 读 GHA 日志诊断（完整日志可用）
- [ ] 截图准备：demo-data.ts + canvas 合成 + ASC 上传
- [ ] Layer 3: 弹窗/权限/引导 UI 规范落地
- [ ] Layer 4: v2 水印编辑器 + 图鉴系统

## 已完成（本次 session）
- [x] App Icon SVG 设计（雅致图鉴本+植物学樱花+像素点缀）
- [x] 22 平台 PNG 导出（iOS 13尺寸 + Android 6尺寸 + Favicon 3尺寸）
- [x] Splash Screen 品牌化（1284×2778）
- [x] TabBarIcon 自定义 SVG 组件（home/checkin/settings）
- [x] brand.accent #D4537E + brand.dark #A05070 双层色系
- [x] ICON_STYLE.md 规范 + export-icons.mjs 工具 + icon-preview.html
- [x] 563 tests passing · app.json 零变更

## 参考文档
- Spec: `docs/superpowers/specs/2026-03-21-brand-visual-system-design.md`
- 日本APP规范: `~/Downloads/ph_asc_screenshots/日本APP功能说明与弹窗设计规范.md`
- v2产品指引: `~/Downloads/ph_asc_screenshots/赏花日记APP_产品设计指引_v2.md`
