# Pixel Herbarium — TestFlight 准备进度

Updated: 2026-03-17

## 已完成 ✅

- [x] `npm run build:validate` — 270 tests PASS, 0 TS errors
- [x] eas-cli v18.4.0 加入 devDependencies
- [x] Supabase Auth redirect URLs 已设置（Management API）：
  - `pixelherbarium://` / `pixelherbarium://**` / `exp://pixel-herbarium`
- [x] Supabase Edge secrets 已确认（PLANTNET_API_KEY + REPLICATE_API_TOKEN + URL/KEY）
- [x] EAS 账号登录（cbnium / zmuleyu@gmail.com）
- [x] EAS 项目链接（projectId: `74427c7e-dba6-4061-9cc9-3651d09fae01`）
- [x] EAS env `EXPO_PUBLIC_SUPABASE_ANON_KEY` 已设置（production + preview）
- [x] `eas.json` 修复（移除空 submit 字段避免校验错误）

## 唯一剩余阻塞项：Apple Developer Program

### 步骤（按顺序）

1. **注册** https://developer.apple.com/programs/enroll/（$99/年，需 Apple ID）
2. **等待** 24-48h 审批
3. **获取 Team ID**：developer.apple.com/account → Membership Details → Team ID（10位）
4. **创建 App**：appstoreconnect.apple.com → My Apps → + → New App
   - Platform: iOS / Bundle ID: `com.pixelherbarium.app` / SKU: `pixel-herbarium`
   - 创建后记录页面上的 **App ID（数字）**
5. **启用 Capabilities**：Identifiers → `com.pixelherbarium.app` → Sign In with Apple + Push Notifications

### 完成后告诉 Claude（3 个值）

```
appleId: your.email@example.com
ascAppId: 1234567890        ← App Store Connect 数字 ID
appleTeamId: ABCDEFGHIJ     ← 10 位字母数字
```

Claude 会自动：
- 填写 `eas.json` submit section
- 执行 `npm run build:preview:ios`（约 15 分钟构建）

## 发布就绪状态

| 项目 | 状态 |
|------|------|
| 270 tests passing | ✅ |
| TypeScript 0 errors | ✅ |
| EAS Build config | ✅ |
| EAS 项目链接 | ✅ projectId: 74427c7e |
| EAS env SUPABASE_ANON_KEY | ✅ production + preview |
| Supabase redirect URLs | ✅ |
| Supabase Edge secrets | ✅ |
| Apple Developer Program | ⏸ 等待注册 + 审批 |
| eas.json submit credentials | ⏸ 待 Apple 凭据 |
