# Pixel Herbarium（花図鉑）— 开发状态全览

> 最后更新：2026-03-15 · 当前版本：v1.0.0（pre-TestFlight）· 最近完成：Chunk 27（Profile Friends入口）

---

## 一、项目定位

**花図鉑** 是一款面向日本20-35岁城市女性的植物发现与像素艺术收集应用。

核心体验：用手机相机拍摄身边的植物 → AI识别种类 → 生成像素艺术图 → 积累进个人「花図鉑」图鉴。结合GPS、季节系统、社交赠礼机制，形成温柔诗意的收集循环。

### 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Expo 55（React Native 0.83） |
| 路由 | Expo Router（文件路由，`src/app/`） |
| 后端 | Supabase（PostgreSQL + Edge Functions + Auth + Storage） |
| 状态管理 | Zustand |
| 国际化 | i18next（日语主，英语次） |
| 地图 | react-native-maps + expo-location |
| 推送 | expo-notifications + Expo Push API |
| 构建 | EAS Build（`eas.json` 已配置，待 TestFlight） |
| 测试 | Jest + @testing-library/react-hooks |

---

## 二、完整目录结构

```
pixel-herbarium/
├── src/
│   ├── app/
│   │   ├── _layout.tsx          根布局（Auth守卫 + Onboarding检查 + 推送初始化）
│   │   ├── onboarding.tsx       首次启动3幕引导
│   │   ├── recap.tsx            当季收获总结页
│   │   ├── privacy.tsx          隐私设置（地图可见性 / 数据导出 / 删除账号）
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   └── login.tsx        Apple / Email 双登录
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx      底部导航栏（5个标签）
│   │   │   ├── discover.tsx     拍照发现主屏
│   │   │   ├── herbarium.tsx    6×10图鉑网格 + 季节回顾入口
│   │   │   ├── map.tsx          GPS城市发现地图
│   │   │   ├── social.tsx       好友 + 花束双标签社交屏
│   │   │   └── profile.tsx      个人资料 + 统计卡片
│   │   ├── plant/
│   │   │   └── [id].tsx         植物详情（日历 / 都道府县 / 备注 / 分享）
│   │   └── friend/
│   │       └── [id].tsx         朋友图鉑只读视图
│   ├── components/
│   │   ├── ErrorBoundary.tsx    全局错误边界（包裹 <Slot>）
│   │   ├── OfflineBanner.tsx    离线检测横幅（动画下滑）
│   │   └── SharePoster.tsx      图鉑分享海报（截图 + 原生分享）
│   ├── constants/
│   │   ├── theme.ts             颜色 / 字体 / 间距 / 圆角系统
│   │   └── plants.ts            TOTAL_PLANTS=60 / MONTHLY_QUOTA=5 等常量
│   ├── hooks/
│   │   ├── useCapture.ts        拍照 + GPS + 反作弊 + 识别调用链
│   │   ├── useDiscovery.ts      单次发现流程状态机
│   │   ├── useHerbarium.ts      用户图鉑（已收集植物集合）
│   │   ├── usePlantDetail.ts    植物详情 + 发现历史 + 备注更新
│   │   ├── useSeasonRecap.ts    当季发现汇总 + 去重 + 最稀有植物
│   │   ├── useFriends.ts        好友关系（accepted/sent/received分类）
│   │   ├── useBouquets.ts       花束收发 + 植物数据批量关联
│   │   ├── useProfile.ts        用户资料（显示名 / 头像 / 配额）
│   │   ├── useNearbyDiscoveries.ts  周边5km发现列表
│   │   ├── usePushToken.ts      推送token注册（首次登录后）
│   │   └── useNetworkStatus.ts  网络状态（Supabase ping + AppState监听）
│   ├── i18n/
│   │   ├── ja.json              日语翻译（主）
│   │   └── en.json              英语翻译（备）
│   ├── services/
│   │   ├── supabase.ts          Supabase 客户端初始化
│   │   ├── auth.ts              signInWithApple / signInWithEmail / signOut
│   │   └── antiCheat.ts         GPS冷却 + 月度配额验证
│   ├── stores/
│   │   └── auth-store.ts        Zustand 认证状态（session / user / loading）
│   ├── types/
│   │   └── supabase.ts          Supabase 自动生成的数据库类型
│   └── utils/
│       ├── date.ts              当前季节判断 / 开花窗口检查
│       ├── geo.ts               GPS坐标模糊化（±100m）/ 距离计算
│       └── validation.ts        用户输入验证
├── supabase/
│   ├── functions/
│   │   ├── identify/            AI植物识别（调用视觉API）
│   │   ├── pixelate/            像素艺术图生成
│   │   ├── verify/              反作弊验证（GPS + 频率）
│   │   └── notify/              季节性推送通知（Expo Push API批量发送）
│   ├── migrations/              14个SQL迁移（见第五章）
│   └── seed/                    60种植物种子数据
├── __tests__/                   16个测试套件（165 tests）
├── eas.json                     EAS Build配置（development/preview/production）
├── app.json                     Expo配置（expo-notifications plugin已就位）
└── CLAUDE.md                    项目技术手册（英文简版）
```

---

## 三、屏幕与路由（11条路由）

| 路由 | 文件路径 | 行数 | 主要功能 |
|------|----------|------|---------|
| `/(tabs)/discover` | app/(tabs)/discover.tsx | ~310 | 相机取景 → 拍照 → GPS获取 → 反作弊 → AI识别 → 像素化 → 入图鉑；首次发现特效；冷却提示；**月度剩余配额显示**；配额耗尽时按钮变暗+温柔提示「来月また咲きます 🌿」 |
| `/(tabs)/herbarium` | app/(tabs)/herbarium.tsx | ~190 | 6×10植物网格（已发现/未发现）；锁定格点击显示开花提示；季节回顾按钮 |
| `/(tabs)/map` | app/(tabs)/map.tsx | ~155 | GPS定位 + MapView；周边5km发现标记（**稀有度彩色圆点**：★绿/★★蓝/★★★紫）；点击标记显示植物信息浮层；右下角图例；刷新按钮 |
| `/(tabs)/social` | app/(tabs)/social.tsx | ~445 | 好友标签（搜索/申请/接受/拒绝）；花束标签（收件箱/已发送/撰写花束）；植物选择3-5种 |
| `/(tabs)/profile` | app/(tabs)/profile.tsx | ~170 | 显示名编辑；收集进度条；当季回顾卡片（→recap）；月度配额卡片；**Friends快捷入口**（→social）；隐私设置入口；退出登录 |
| `/(auth)/login` | app/(auth)/login.tsx | ~120 | Apple登录（主）；Email登录/注册（次）；欢迎文案 |
| `/onboarding` | app/onboarding.tsx | ~164 | 首次启动3幕横向滑动引导；dot指示器；跳过+下一步/开始按钮；完成后写入SecureStore |
| `/recap` | app/recap.tsx | ~180 | 当季（春/夏/秋/冬）收获总结；季节emoji标题；最稀有发现卡片；植物缩略图网格 |
| `/plant/[id]` | app/plant/[id].tsx | ~327 | 植物全名（日/英/拉丁）；花言葉；12个月开花日历；都道府县分布芯片；发现历史列表（含备注编辑）；分享海报 |
| `/friend/[id]` | app/friend/[id].tsx | ~135 | 朋友的6×10图鉑只读展示；收集进度计数；**显示朋友名称**（URL参数传递）；**花束赠送快捷按钮**（→social/bouquets）；返回导航 |
| `/privacy` | app/privacy.tsx | ~150 | 地图可见性开关（持久化到DB）；数据导出（JSON → expo-sharing）；删除账号（软删除30天 + 即时退出登录） |

---

## 四、自定义 Hook（11个）

### 数据获取类

| Hook | 职责 | 关键Supabase调用 |
|------|------|----------------|
| `useHerbarium` | 获取用户已收集的所有植物ID集合 | `discoveries.select('plant_id').eq('user_id')` |
| `usePlantDetail` | 单植物详情 + 该用户发现历史 + 备注更新 | `plants.single()` + `discoveries.order()` + `discoveries.update()` |
| `useSeasonRecap` | 当季发现列表（JOIN plants），按植物去重 | `discoveries.select('...plants!inner...').gte().lt()` |
| `useNearbyDiscoveries` | 周边5km他人发现（带GPS模糊化）；**包含rarity字段** | `nearby_discoveries RPC` |
| `useProfile` | 用户资料读写（显示名/头像/配额） | `profiles.single()` + `profiles.update()` |
| `useFriends` | 好友关系三分类（已接受/待我确认/我已发出）+ 用户搜索 | `friendships.select().or()` + `profiles.ilike()` |
| `useBouquets` | 花束收发：收件箱（pending received）+ 已发送；植物批量enrichment | `bouquets.or().order()` + `plants.in()` |

### 系统功能类

| Hook | 职责 | 核心逻辑 |
|------|------|---------|
| `useCapture` | 整个拍照→识别流程状态机 | 调用 `antiCheat.ts` + Edge Function `/identify` + `/pixelate` |
| `useDiscovery` | 单次发现的生命周期状态（idle/checking/identifying/saving/success/error） | 协调 useCapture + Supabase写入 |
| `usePushToken` | 用户登录后注册推送token | `Notifications.getExpoPushTokenAsync()` + `push_tokens.upsert()` |
| `useNetworkStatus` | 每30秒 + AppState恢复时检测网络 | 向Supabase REST根路径发`HEAD`请求 |

---

## 五、数据库 Schema（14个迁移）

| # | 文件 | 内容摘要 |
|---|------|---------|
| 001 | `001_enable_extensions.sql` | 启用 PostGIS（地理坐标支持） |
| 002 | `002_create_plants.sql` | `plants` 表：60种植物，`rarity INT(1-3)`，`available_window DATERANGE`（NULL=全年），`pixel_sprite_url`，`bloom_months INT[]`，`prefectures TEXT[]` |
| 003 | `003_create_discoveries.sql` | `discoveries` 表：`user_id`，`plant_id`，`latitude/longitude FLOAT`，`pixel_url`，`user_note TEXT`，`created_at` |
| 004 | `004_create_collections.sql` | ~~`collections` 表~~ （已弃用，发现记录改用 discoveries 去重代替） |
| 005 | `005_create_friendships.sql` | `friendships` 表：`requester_id`，`addressee_id`，`status('pending','accepted','rejected')`，双向唯一约束 |
| 006 | `006_create_bouquets.sql` | `bouquets` 表：`sender_id`，`receiver_id`，`plant_ids INT[]`，`message TEXT`，`status`，`expires_at`（7天有效期） |
| 007 | `007_create_user_quotas.sql` | `user_quotas` 表：`month DATE`，`used_count INT`，月度配额控制（MONTHLY_QUOTA=5） |
| 008 | `008_rls_policies.sql` | 所有表的行级安全策略（RLS）：用户只能访问/修改自己的数据 |
| 009 | `009_check_cooldown_rpc.sql` | `check_cooldown(user_id, lat, lng)` RPC：校验50m半径内7天冷却期 |
| 010 | `010_profiles.sql` | `profiles` 表：`id（= auth.users.id）`，`display_name`，`avatar_seed`，`updated_at` |
| 011 | `011_profiles_map_visible.sql` | `profiles` 加 `map_visible BOOLEAN DEFAULT true`（地图可见性设置） |
| 012 | `012_nearby_map_visible.sql` | 修改 `check_cooldown` RPC，过滤 `map_visible=false` 的用户 |
| 013 | `013_push_tokens.sql` | `push_tokens` 表：`user_id`，`token TEXT`，`platform('ios','android')`，`UNIQUE(user_id, token)`，RLS |
| 014 | `014_soft_delete.sql` | `profiles` 加 `deletion_requested_at TIMESTAMPTZ`（软删除：30天后执行实际删除） |

---

## 六、Edge Functions（4个）

| 函数 | 路径 | 职责 |
|------|------|------|
| `identify` | `supabase/functions/identify/` | 接收图片base64 → 调用外部植物识别API → 返回匹配的 `plant_id` 和置信度 |
| `pixelate` | `supabase/functions/pixelate/` | 接收图片 → 生成像素艺术风格图 → 上传到 Supabase Storage → 返回 URL |
| `verify` | `supabase/functions/verify/` | 反作弊二次校验（与客户端 `antiCheat.ts` 协同）：验证GPS坐标真实性 + 频率限制 |
| `notify` | `supabase/functions/notify/` | 接收 `{season: 'spring'\|'summer'\|'autumn'\|'winter'}` → 查询所有 `push_tokens` → 批量调用 Expo Push API；需 `service_role` Key 鉴权 |

**季节通知文案（硬编码日语）：**
- 🌸 春：「春の花が咲き始めました。今日はどんな花に出会えるでしょう？」
- 🌻 夏：「夏の花が咲いています。まだ見ぬ植物がどこかで待っています。」
- 🍂 秋：「秋の草花の季節です。色づく季節に、花図鉑を開いてみてください。」
- ❄️ 冬：「冬の植物を探しに。寒い季節にも、静かに咲く花があります。」

---

## 七、测试覆盖（16套件 / 165个测试）

| 套件 | 测试数 | 覆盖内容 |
|------|--------|---------|
| `constants/theme.test.ts` | — | 颜色系统、字体、间距常量完整性 |
| `i18n/i18n.test.ts` | 5 | ja/en key对称性；tab名称；稀有度标签 |
| `utils/date.test.ts` | 10 | `isInBloomWindow`（开花窗口判断）；季节判断（春夏秋冬边界） |
| `utils/geo.test.ts` | 8 | GPS模糊化（±100m范围）；距离计算（isWithinRadius） |
| `utils/validation.test.ts` | — | 用户输入验证函数 |
| `stores/auth-store.test.ts` | — | Zustand认证状态初始化/更新 |
| `services/antiCheat.test.ts` | 8 | 冷却期校验（边界值）；月度配额（新用户/耗尽/剩余）；Supabase错误抛出 |
| `hooks/useCapture.test.ts` | — | 拍照流程状态机 |
| `hooks/useDiscovery.test.ts` | — | 单次发现生命周期 |
| `hooks/useHerbarium.test.ts` | — | 图鉑数据加载与收集计数 |
| `hooks/useNearbyDiscoveries.test.ts` | — | 周边发现列表与位置获取 |
| `hooks/useProfile.test.ts` | — | 用户资料读取与更新 |
| `hooks/usePlantDetail.test.ts` | 10 | 初始loading；空参数跳过；植物+发现数据形态；错误处理；备注乐观更新；plantId变化重请求 |
| `hooks/useSeasonRecap.test.ts` | 10 | 季节窗口合法性；加载状态；数据映射；多植物；去重（同plant_id保留首次）；null数据容错 |
| `hooks/useFriends.test.ts` | 16 | 关系三分类（accepted/sent/received）；friend字段指向正确；搜索；sendRequest/acceptRequest/declineRequest |
| `hooks/useBouquets.test.ts` | 15 | 收件箱/发件箱过滤；plant enrichment；跨花束去重plantId；空plant_ids跳过批量查询；mutations |

**总计：165 tests，16 suites，全部通过**

> Chunk 22（地图稀有度标记）新增 `useNearbyDiscoveries.test.ts` rarity 断言；Chunk 27 无新测试（纯导航UI）

---

## 八、关键设计约束

### 产品约束
| 约束 | 值 |
|------|-----|
| 植物总数 | 60种（30★常见 + 20★★少见 + 10★★★季节限定） |
| 免费月配额 | 5次识别/月 |
| 冷却半径 | 50m（同地点7天内不可重复发现） |
| GPS模糊化 | ±100m（保护用户隐私） |
| 地图搜索半径 | 5000m |
| 地理限制 | 仅日本境内可发现（GPS验证） |
| 推送频率 | 每季最多3次 |

### UI / 调性约束
- **配色**：Adult Kawaii——奶油色背景（`#FAF6F0`）+ 鼠尾草绿主色（`#7BA05B`）+ 绯红色强调（`#E85D75`）
- **字体**：HiraginoMaruGothicProN（标签/标题）+ 系统字体（正文）
- **语气**：温柔、诗意、不焦虑；季节结束用「来年また咲きます」，而非「你错过了」
- **绝对禁止**：倒计时、红色紧迫感、"GET!"/"UNLOCKED!" 等重游戏化表达

### 技术约束
- 所有用户可见文案必须走 `i18next`，不可硬编码（Edge Function通知文案除外）
- 颜色始终引用 `theme.ts` 常量，不写死 hex 值
- 稀有度用整数 `1/2/3` 存储，不用字符串
- `available_window DATERANGE` 为 `NULL` 表示全年可见；仅 ★★★ 植物设置季节限制

---

## 九、EAS Build 配置

`eas.json` 已创建，包含三个profile：

| Profile | 用途 | 分发方式 |
|---------|------|---------|
| `development` | 本地调试（带 Dev Client） | Internal，iOS模拟器 |
| `preview` | TestFlight内测 | Internal，真机 |
| `production` | App Store正式发布 | autoIncrement版本号 |

**待用户操作（不需要写代码）：**
```bash
eas login                              # 登录 Expo 账号
# 在 eas.json submit.production.ios 填写：
#   appleId / ascAppId / appleTeamId
git tag v1.0.0
eas build --profile preview --platform ios   # 构建 TestFlight IPA
```

---

## 十、路线图

### 近期（TestFlight前必须）
- [x] EAS Build 配置（`eas.json`）
- [x] 账号删除功能（App Store审核要求）
- [x] 数据导出功能
- [ ] **EAS Build 实际执行**（等待用户提供 Expo + Apple Developer 账号）

### 中期（TestFlight后迭代）
- [ ] ★★★ 位置类型匹配算法（需要真实用户地点数据）
- [ ] 城市发现热力图（统计各区域发现密度）
- [ ] 订阅付费墙（解锁无限识别次数）+ Apple IAP
- [ ] GPS邻近通知（走过正在开花的植物附近时提醒）
- [ ] 季节过渡动画精修（春→夏→秋→冬页面切换特效）

### 远期
- [ ] Android 版本（目前仅配置iOS）
- [ ] 多城市活动系统（「桜まつり」等限定事件）
- [ ] 植物图鉑实体周边（ポストカード / シール）
