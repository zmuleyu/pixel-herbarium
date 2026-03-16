# Pixel Herbarium — TestFlight 准备进度

Updated: 2026-03-17

## 已完成（本 session 自动执行）

- [x] `npm run build:validate` — 270 tests PASS, 0 TS errors
- [x] eas-cli v18.4.0 加入 devDependencies，本地可用
- [x] Supabase Auth redirect URLs 已通过 Management API 设置：
  - `pixelherbarium://`
  - `pixelherbarium://**`
  - `exp://pixel-herbarium`
- [x] Supabase Edge Function secrets 已确认（2026-03-14 设置）：
  - `PLANTNET_API_KEY` ✅
  - `REPLICATE_API_TOKEN` ✅
  - `SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY / DB_URL` ✅

## 用户必须在本地 Terminal 手动完成

### Step 1 — Expo 账号登录（不依赖 Apple，现在就做）

```bash
cd D:\projects\Games\gardern\pixel-herbarium

# 1. 登录 Expo（会打开浏览器）
./node_modules/.bin/eas login

# 2. 链接项目到 EAS（会在 app.json 添加 extra.eas.projectId）
./node_modules/.bin/eas init

# 3. 设置 EAS secret（Supabase anon key）
./node_modules/.bin/eas secret:create \
  --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZGdudWVheWNhdG1remtieHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTEwMTIsImV4cCI6MjA4OTA2NzAxMn0.ShB7IWQCZ1L3OQi53PqbVVNIJmvUSml0t7Dy15g_clg" \
  --scope project

# 4. 验证
./node_modules/.bin/eas secret:list
```

### Step 2 — Apple Developer Program（等待审批 24-48h）

- [ ] 注册 https://developer.apple.com/programs/enroll/（$99/年）
- [ ] 审批通过后获取 **Team ID**（10 位字母数字）
- [ ] 访问 https://appstoreconnect.apple.com → New App → BundleID: `com.pixelherbarium.app`
- [ ] 获取 **ascAppId**（数字，在 App Information 页面）
- [ ] 启用 Capabilities: Sign In with Apple + Push Notifications
- **完成后告诉 Claude**: appleId, ascAppId, appleTeamId

### Step 3 — Claude 自动完成（待 Step 1+2）

凭据到手后，Claude 会自动：
- 填写 `eas.json` submit section
- 执行 `npm run build:preview:ios`

## 执行优先级

```
今天：Step 1（Expo 登录 + EAS init + secret）— 约 10 分钟
等待：Apple Developer 审批（24-48h）
审批后：提供 appleId/ascAppId/appleTeamId → Claude 完成后续
```

## 代码就绪检查表

| 项目 | 状态 |
|------|------|
| 270 tests passing | ✅ |
| TypeScript 0 errors | ✅ |
| EAS Build config (eas.json) | ✅ |
| app.json (bundleId/permissions/plugins) | ✅ |
| Supabase redirect URLs | ✅ |
| Supabase Edge secrets | ✅ |
| EAS submit credentials | ⏸ 待 Apple 审批 |
| EAS secret (anon key) | ⏸ 待 eas login |
| EAS project linked (projectId) | ⏸ 待 eas init |
