# GitHub Actions iOS Build

结论：
- `preview-build.yml` 使用原生 `xcodebuild archive/export` 生成 Ad Hoc IPA。
- `release.yml` 使用同一原生链路生成 App Store IPA，再执行 `eas submit`。
- `screenshot-build.yml` 只走 simulator 路径，不需要 signing。
- 所有链路均不使用 `eas build --local`。

## GitHub Secrets 清单

| Secret 名称 | 已存在 | 来源 / 生成方法 |
|-------------|--------|----------------|
| `APPLE_CERTIFICATE_P12_BASE64` | ✅ | Keychain Access → 导出 Distribution Certificate → .p12 → `base64 -i dist.p12 \| pbcopy` |
| `APPLE_CERTIFICATE_PASSWORD` | ✅ | 导出 .p12 时设置的密码 |
| `ADHOC_PROVISIONING_PROFILE_BASE64` | ✅ | Apple Developer Portal → Profiles → Ad Hoc → 下载 .mobileprovision → `base64 -i profile.mobileprovision \| pbcopy` |
| `IOS_APPSTORE_PROFILE_BASE64` | ❌ 待添加 | Apple Developer Portal → Profiles → App Store → 下载 .mobileprovision → `base64 -i profile.mobileprovision \| pbcopy` |
| `KEYCHAIN_PASSWORD` | ✅ | 任意随机字符串（`openssl rand -base64 24`） |
| `APPLE_TEAM_ID` | ✅ 已写入 | `68JA8V8NC2`（固定值，来自 app.json） |
| `EXPO_TOKEN` | ✅ | expo.dev → Account Settings → Access Tokens |
| `EXPO_APPLE_APP_SPECIFIC_PASSWORD` | ✅ | appleid.apple.com → App-Specific Passwords |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | eas.json 中的 anon key（非 service_role） |

## 唯一待补的 Secret

`IOS_APPSTORE_PROFILE_BASE64`：仅 `release.yml` 需要（production build + submit）。

生成步骤：
1. Apple Developer Portal → Certificates, IDs & Profiles → Profiles
2. 类型选 **App Store Connect**，Bundle ID 选 `com.pixelherbarium.app`
3. 下载 `.mobileprovision` 文件
4. `base64 -i ~/Downloads/PixelHerbarium_AppStore.mobileprovision | pbcopy`
5. GitHub → Settings → Secrets → New secret → `IOS_APPSTORE_PROFILE_BASE64`

## 首轮触发顺序

按这个顺序：

1. **`preview-build.yml`** — 最先验证签名链路（Ad Hoc，风险最小）
2. **`screenshot-build.yml`** — 验证 simulator 路径（已有成功记录）
3. **`release.yml`** — 最后，需要先补 `IOS_APPSTORE_PROFILE_BASE64`

## 失败排查顺序

| 失败阶段 | 优先检查 |
|---------|---------|
| `ios-keychain-signing.sh` 报 missing secrets | 确认 secret 名称拼写（区分大小写） |
| `pod install` 失败 | `patch-xcode26-compat.sh --pre-pod` 是否执行 |
| `xcodebuild archive` signing 报错 | profile UUID 是否与 bundle ID 匹配；profile 是否包含设备 UDID（Ad Hoc） |
| `xcodebuild archive` folly 编译错误 | `patch-xcode26-compat.sh --post-pod` 是否执行 |
| `eas submit` 401 | `EXPO_TOKEN` 是否有效；`EXPO_APPLE_APP_SPECIFIC_PASSWORD` 是否过期 |

## Notes

- `preview-build.yml` 触发后约 40-60 分钟出包
- Ad Hoc IPA 只能安装在 provisioning profile 中注册的设备（UDID `00008140-000E21011182801C`）
- iOS 16+ 首次安装 Ad Hoc：设置 → 隐私与安全性 → 开发者模式 → 开启 → 重启
- TestFlight 分发不需要开发者模式
