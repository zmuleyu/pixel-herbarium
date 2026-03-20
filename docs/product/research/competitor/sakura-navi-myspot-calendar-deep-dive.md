# Sakura Navi：MY SPOT ＋ 花見日历功能深度研究
## UI 原图链接 · 交互规则 · 设计逻辑 · 对 Pixel Herbarium 的映射

> **文件版本：** v1.0  
> **研究日期：** 2026年3月15日  
> **研究对象：** Sakura Navi — Forecast in 2026（日本気象株式会社 / JMC）  
> **专项聚焦：** MY SPOT 收藏系统 ＋ 花见日历（Hanami Calendar）两个功能模块  
> **新增内容：** 官方 UI 原图直链、用户真实评价、日文版对照数据  
> **数据来源：** 官方网站（sakuranavi.n-kishou.co.jp）、App Store、Google Play、用户评论

---

## 目录

1. [产品关键数据更新（2026年3月最新）](#一产品关键数据更新2026年3月最新)
2. [官方 UI 图片资源索引](#二官方-ui-图片资源索引)
3. [MY SPOT 功能：完整规则与交互逻辑](#三my-spot-功能完整规则与交互逻辑)
4. [花见日历（Hanami Calendar）：完整规则与视觉逻辑](#四花见日历hanami-calendar完整规则与视觉逻辑)
5. [Detail Screen：地点详情页的信息架构](#五detail-screen地点详情页的信息架构)
6. [MY SPOT × 花见日历的协同闭环](#六my-spot--花见日历的协同闭环)
7. [用户真实评价（含 MY SPOT / 日历专项）](#七用户真实评价含-my-spot--日历专项)
8. [日文免费版「桜のきもち」对照研究](#八日文免费版桜のきもち对照研究)
9. [设计语言分析：UI 风格与信息密度](#九设计语言分析ui-风格与信息密度)
10. [对 Pixel Herbarium 的功能映射建议](#十对-pixel-herbarium-的功能映射建议)
11. [数据来源与图片版权说明](#十一数据来源与图片版权说明)

---

## 一、产品关键数据更新（2026年3月最新）

本次专项检索从官方网站获取到若干之前未确认的关键数据，更正如下：

| 指标 | 之前记录 | 本次更新值 | 来源 |
|------|---------|-----------|------|
| 全球 #1 地区数 | 11～15国 | **20个地区** | 官方网站首页（sakuranavi.n-kishou.co.jp/en） |
| 历史累计下载量 | 未知 | **200K+（20万次以上）** | 官方网站底部「Total Downloads 200K」 |
| 2025年单版下载量 | 未知 | **约130,000次** | Google Play 2025版产品描述原文 |
| 日本售价 | 约$4.99 | **900日元** | 官方网站定价（≈$6 USD） |
| 日历覆盖时段 | 3月-5月 | **1月-5月**（2026版扩展） | Google Play 2026版描述 |
| 每季预报更新频率 | 每周 | **每周四**（season期间固定节奏） | 官方网站「updates forecasts every Thursday」 |

**关键更正说明：**
- 「20个地区#1」为 Daily Ranking（付费类旅游）的最高点数据，来自官方网站首页标语
- 「200K+累计」是多年版本叠加总量；「130,000次」是2025年单版下载量（Google Play原文）
- 日历覆盖从1月起是因为2026年新增了「川津樱」（Kawazuzakura）早樱预报，最早2月开放

---

## 二、官方 UI 图片资源索引

以下所有图片 URL 均从官方网站（sakuranavi.n-kishou.co.jp）HTML 源码中直接提取，属于 JMC 官方发布的宣传图片。

### 2.1 APP 内核心界面截图（官方发布）

| 图片描述 | 直链 URL | 对应功能模块 |
|---------|---------|------------|
| **花见日历界面**（MY SPOT Calendar） | `https://sakuranavi.n-kishou.co.jp/img/calender.png` | MY SPOT + 日历 |
| **地点详情界面**（Flowering Meter + 预报数据） | `https://sakuranavi.n-kishou.co.jp/img/detail.png` | Detail Screen |
| **附近提醒界面**（Proximity Notification） | `https://sakuranavi.n-kishou.co.jp/img/approach.png` | 通知系统 |
| **地图界面（大图/桌面版）** | `https://sakuranavi.n-kishou.co.jp/img/map_en_big.jpg` | 全国樱花地图 |
| **APP 地图界面（移动端）** | `https://sakuranavi.n-kishou.co.jp/img/app_map.png` | 移动端地图 |
| **日历圆形示意图**（营销用图） | `https://sakuranavi.n-kishou.co.jp/img/calender_circle.png` | MY SPOT 功能说明 |
| **APP 图标** | `https://sakuranavi.n-kishou.co.jp/img/app_icon.png` | 品牌标识 |

### 2.2 操作教程视频（官方发布）

| 内容 | 直链 URL | 格式 |
|------|---------|------|
| **APP 使用教程**（英文，展示完整操作流程） | `https://sakuranavi.n-kishou.co.jp/img/Howto_eng.mp4` | MP4 视频 |
| **川津樱地点介绍视频**（英文） | `https://sakuranavi.n-kishou.co.jp/img/goto_kawazu en3.mp4` | MP4 视频 |

### 2.3 APP Store 官方截图入口

| 平台 | 链接 | 备注 |
|------|------|------|
| **App Store（2026版，英文）** | https://apps.apple.com/app/apple-store/id6752767536 | 含5张以上 App Store 官方截图 |
| **Google Play（2026版，英文）** | https://play.google.com/store/apps/details?id=com.jmc.android.SakuraKaikaEn26 | 含产品描述截图 |
| **App Store（2025版，已归档）** | https://apps.apple.com/us/app/sakura-navi-forecast-in-2025/id6736642399 | 参考历史版本 UI |
| **日文免费版（桜のきもち）App Store** | https://apps.apple.com/jp/app/id1080542459 | 日文版截图（含停车场信息UI） |

### 2.4 UI 图片直接预览说明

以上官方图片链接均为公开 URL，可在浏览器中直接打开查看。根据从官方网站 HTML 解析到的页面结构，三张核心界面截图（`calender.png` / `detail.png` / `approach.png`）在官方网站 "How it works" 区域以轮播形式展示，是官方最重要的三张 UI 展示图。

---

## 三、MY SPOT 功能：完整规则与交互逻辑

### 3.1 功能定义（官方原文）

**英文（App Store / Google Play 产品描述）：**

> *"What is 'MY SPOT?' This refers to your favorite Cherry Blossom SPOT. **You can register up to 30 locations.**"*

**官方网站（sakuranavi.n-kishou.co.jp/en）：**

> *"When you register a spot as a My Spot, **the blooming date and peak blooming date will be automatically marked on the calendar.**"*

### 3.2 MY SPOT 的触发入口

根据官方描述，MY SPOT 的添加方式只有一种，在 **Detail Screen（地点详情页）** 内操作：

> *"Each location can be added to MY SPOT by clicking the button 'Add to MY SPOT.'"*

即：
```
用户在地图中点击 Pin（地点标记）
    ↓
进入该地点的 Detail Screen（详情页）
    ↓
点击「Add to MY SPOT」按钮
    ↓
该地点被收藏，同时自动出现在日历中
```

### 3.3 MY SPOT 的容量与管理

- **上限：30个地点**（英文版、日文版一致）
- **无分组/标签功能**：无法按地区、类型等分类
- **数据存储警告：** 官方明确提示：

  > *"Information of MY SPOT and Stamp Card will be lost when the app is uninstalled."*

  数据储存在**本地设备**，卸载即清除，无云端备份。这是一个重要的用户体验局限。

### 3.4 MY SPOT 与其他功能的联动关系

```
MY SPOT（收藏地点）
    ├── 联动 → 花见日历（自动标记开花/满开日期）
    ├── 联动 → Flowering Meter（显示该地点当前进度）
    ├── 联动 → 路线导航（「Route to this Sakura Spot」按钮）
    └── 联动 → Stamp Card（到访后可盖印章，两者独立但共享地点数据）
```

**注意：** Stamp Card（印章）与 MY SPOT 是两个独立功能：
- MY SPOT = 「想去/感兴趣」的地点（主动收藏）
- Stamp Card = 「已经去过」的地点（GPS 验证后解锁）
- 可以收藏了但没去过（MY SPOT 有，Stamp 无），也可以去了没收藏（Stamp 有，MY SPOT 无）

---

## 四、花见日历（Hanami Calendar）：完整规则与视觉逻辑

### 4.1 功能定义（官方原文，多版本对照）

**2025版 App Store 描述（时段：3月-5月）：**

> *"This is a calendar for the Hanami (cherry blossom viewing) season (March to May). There will be markers on the forecast dates of flowering and full bloom for your registered MY SPOT."*

**2026版 Google Play 描述（时段扩展至1月-5月）：**

> *"This is a calendar for the Hanami (cherry blossom viewing) season (**January** to May). There will be markers on the forecast dates of flowering and full bloom for your registered MY SPOT."*

**官方网站英文（sakuranavi.n-kishou.co.jp/en）：**

> *"This is a calendar for cherry blossom viewing season (March to May). There will be markers on the forecast dates of flowering and full bloom for your registered MY SPOT."*

**关键变化：** 2026年版日历起始月从**3月**提前至**1月**，这是因为2026年新增了「川津樱（Kawazuzakura）」预报——这种早樱最早在1月就开始开花。

### 4.2 日历的视觉信息层

从官方图片（`calender.png`）的描述逻辑和文字说明中，可以还原日历的信息层结构：

```
┌────────────────────────────────────────────┐
│         花见日历（1月～5月）                  │
├──────┬──────┬──────┬──────┬──────────────┤
│  1月  │  2月  │  3月  │  4月  │   5月        │
│      │      │      │      │              │
│      │ 川津  │ ↓    │ ↓    │ 北海道        │
│      │ 樱★  │  开花  │  满开  │              │
│      │      │  标记  │  标记  │              │
├──────┴──────┴──────┴──────┴──────────────┤
│ 每个 MY SPOT 地点在其对应日期上出现标记       │
│ 开花日（Kaika）= 一种颜色/标记              │
│ 满开日（Mankai）= 另一种颜色/标记            │
└────────────────────────────────────────────┘
```

**标记内容（每个 MY SPOT 地点在日历上显示）：**
1. **开花预测日**（Kaika，初花约10%开放）— 对应标记 ①
2. **满开预测日**（Mankai，≥80%开放）— 对应标记 ②

### 4.3 日历的动态更新机制

日历不是静态的——它随 JMC 预报更新而动态变化：

| 更新阶段 | 更新频率 | 日历变化 |
|---------|---------|---------|
| 12月（首次预报） | 一次性 | 日历首次显示预测日期（粗略） |
| 2月中旬起 | 每周一次 | 日期随预报修正而移动 |
| 花期中（3月起） | **每周四**（官方确认频率） | 日期高频修正，反映实际气温变化 |
| 该地点达到 Hazakura（叶樱）后一周 | 自动停止 | 该地点预报信息停止显示 |

**官方原文（关于更新频率）：**

> *"The SakuraNavi app updates forecasts for all spots every Thursday during the season."*

### 4.4 日历与实时开花状态的关系

日历显示的是**预测日期**（基于气象模型），而地图上的 Pin 颜色显示的是**实时开花进度**（Flowering Meter 百分比）。两者是互补关系：

| 信息类型 | 日历 | 地图 Pin |
|---------|------|---------|
| 信息维度 | **时间轴**（什么时候去） | **空间轴**（现在哪里在开）|
| 数据性质 | 预测（Forecast） | 实时（Real-time） |
| 用户动作 | 提前规划行程 | 当下决策「现在去哪里」|
| 更新频率 | 每周四 | 日常更新 |

---

## 五、Detail Screen：地点详情页的信息架构

### 5.1 英文版详情页内容（Sakura Navi）

**官方产品描述（App Store 原文）：**

> *"The forecast of the flowering and full bloom dates of the cherry blossoms and Flowering Meter for each location can be seen here. Each location can be added to MY SPOT by clicking the button 'Add to MY SPOT.' Previously Visited Stamp can be put on the location by clicking the button 'Visited Stamp.' Visited Stamp is available only when you are actually near the location."*

因此详情页包含以下元素：

| UI 元素 | 内容 | 功能 |
|--------|------|------|
| Flowering Meter | 0-100进度条，显示当前开花百分比 | 判断现在去值不值得 |
| 开花预测日（Kaika date） | 具体日期显示 | 规划行程 |
| 满开预测日（Mankai date） | 具体日期显示 | 规划行程 |
| 「Add to MY SPOT」按钮 | 一键收藏按钮 | 添加至日历 |
| 「Visited Stamp」按钮 | GPS 验证盖章按钮（仅附近可用） | 印章卡收集 |
| 「Route to this Sakura Spot」按钮 | 调起地图导航 | 导航前往 |

### 5.2 日文版详情页的额外信息（「桜のきもち」）

日文免费版（桜のきもち）的详情页还包含一项英文版没有的信息：

**Google Play 日文版原文：**

> *"You can check the detailed information of the spot (such as whether there is a parking lot or not) on the comprehensive weather website 'Weather Navigator'."*

即日文版详情页提供**停车场是否可用**的信息，通过跳转至「Weather Navigator」综合气象网站获取。这对驾车前往的本地用户非常实用。

### 5.3 官方 Detail Screen 截图

**直链（官方发布）：**  
`https://sakuranavi.n-kishou.co.jp/img/detail.png`

根据官方网站的呈现方式，`detail.png` 展示的是地点详情页的完整界面，包含 Flowering Meter 进度条和两个日期标记（开花日/满开日）。

---

## 六、MY SPOT × 花见日历的协同闭环

### 6.1 完整用户旅程图

```
阶段 1：发现（Before Season）
────────────────────────────────────
用户在地图上浏览全国 ~1,000 个地点
    ↓
看到颜色编码的 Pin（初期显示预测进度颜色）
    ↓
点击感兴趣地点 → 进入 Detail Screen
    ↓
查看预测开花/满开日期 + Flowering Meter 初始值
    ↓
点击「Add to MY SPOT」→ 地点进入个人收藏
    ↓
【日历自动生成该地点的开花/满开日期标记】

阶段 2：规划（Pre-Season）
────────────────────────────────────
打开日历 → 看到所有 MY SPOT 地点的时间节点
    ↓
比较不同地点的开花时间 → 安排花见行程
    ↓
JMC 每周四更新预报 → 日历日期自动调整
    ↓
日期接近时，收到「附近有赏樱地点」提醒（Proximity Notification）

阶段 3：到访（During Bloom）
────────────────────────────────────
按日历计划前往目标地点
    ↓
实时查看地图 Pin 颜色确认当前开花进度
    ↓
到达地点 → GPS 验证 → 点击「Visited Stamp」
    ↓
印章卡记录到访历史

阶段 4：回顾（Post-Season）
────────────────────────────────────
印章卡保留到访记录（永不重置）
MY SPOT 数据在卸载前保留
    ↓
明年重新购买 2027 版 → MY SPOT 需重新添加
（印章数据同样需从头积累）
```

### 6.2 「自动标记」的设计精妙之处

**用户只做一个动作：点击「Add to MY SPOT」**  
**系统自动完成所有下游工作：**
- 日历自动生成该地点的时间节点
- 日历随 JMC 每周预报更新自动修正日期
- 不需要用户手动输入任何日期或设置任何提醒

这是典型的**「最小输入，最大输出」**设计哲学——用户的认知负担极低，但获得的信息价值极高。

---

## 七、用户真实评价（含 MY SPOT / 日历专项）

### 7.1 官方网站收录的用户评价（含 MY SPOT 直接提及）

官方网站（sakuranavi.n-kishou.co.jp/en）的 Review 区收录了来自多国用户的评价，其中有一条直接提到了 MY SPOT 和日历功能：

---

**来自新加坡的用户：**

> *"**I'm not yet in Tokyo, but will be there next week and luckily will hit the peak cherry blossom blooming. I've set some 'my spots', and the calendar is cool.** I hope the notifications work. Seems like a great app."*

---

这条评价揭示了一个重要的使用场景：**用户在行程出发前（尚在出发地）就已经完成了 MY SPOT 设置和日历规划**，展示了该功能在「出发前计划」阶段的核心价值。

**来自芬兰的用户（关于 Detail Screen 信息的价值）：**

> *"If you plan on shooting cherry blossom, this app is very useful. It gives you all the information you need for planning your shoots. Easy to use as well."*

**来自泰国的用户：**

> *"The app did give me a rough guideline for where to go or not to go."*

### 7.2 App Store 用户评价（MY SPOT / 日历相关）

**积极评价（来自2025版 App Store）：**

> *"We were able to identify off the beaten path Sakura viewing spots thanks to this app. It appears that the app is using the current Sakura forecast, which is helpful."*

**改进建议（同一用户，2025版 App Store，关于 MY SPOT 的功能补充需求）：**

> *"The app could be improved by:*  
> *- Showing photos of each spot within the app*  
> *- Including cherry tree variety and quantity information*  
> *- Forecasting the end of the blossom (or basically when it's no longer worth visiting)*  
> *- Show popularity of each location so it's possible to avoid crowds"*

**另一位用户：**

> *"Could improve the ux/ui but other than that it is perfect!"*

### 7.3 用户评价中的隐含信息

| 评价内容 | 隐含的用户需求 |
|---------|-------------|
| 「calendar is cool」 | 日历功能直觉上易懂，视觉表达有吸引力 |
| 「planning my shoots」 | 不只是花见，也有摄影计划场景 |
| 「rough guideline for where to go or not to go」 | 用户用地点数据做行程筛选，「不值得去」信息同样重要 |
| 「Showing photos of each spot」 | MY SPOT 收藏后，用户希望看到该地点的实景照片 |
| 「forecasting the end of the blossom」 | 用户希望日历不只显示开花/满开，也显示「观赏截止日」 |
| 「show popularity to avoid crowds」 | 用户希望在日历/地图中看到人流密度数据 |

---

## 八、日文免费版「桜のきもち」对照研究

### 8.1 两个版本的关系

JMC 同时维护两款 APP，核心技术和数据完全相同，面向不同市场：

| 项目 | Sakura Navi（英文版） | 桜のきもち（日文版） |
|------|---------------------|------------------|
| 目标用户 | 国际游客（含海外花见爱好者） | 日本本地用户 |
| 语言 | 英语 / 繁体中文 | 日语 |
| 定价 | 900日元（付费买断） | **免费** |
| 收益模型 | 一次性购买 | 流量/广告（推测） |
| MY SPOT 上限 | 30处 | 30处（一致） |
| Stamp Card | ✅（称 Stamp Card） | ✅（称スタンプラリー/ Stamp Rally） |
| 日历功能 | ✅（3月-5月/1月-5月） | ✅（3月-5月） |
| 详情页额外信息 | 无 | **停车场信息**（通过 Weather Navigator） |
| App Store 评分 | 未公开 | 有（日文版评论） |

### 8.2 日文版的用户评论（App Store 日文，原文）

**有价值的改进反馈（App Store 日文版）：**

> *「記載されていない箇所もあるので追加またはマイスポット追加が出来たら良い。ちなみに例として喜多方枝垂れ桜はマークされていない」*  
> （翻译：有些地点没有收录，希望能追加或支持用户自己添加 MY SPOT。比如「喜多方枝垂れ桜」就没有被标记在地图上。）

**设计洞察：** 用户希望**自己添加地图上不存在的地点**到 MY SPOT，即「用户自定义地点」功能——这是 Sakura Navi 目前不支持的功能，用户只能从预设的 ~1,000 个地点中收藏。

### 8.3 「桜のきもち」的命名含义

「桜のきもち」字面意思是「樱花的心情/感受」，暗示 APP 的定位不只是信息工具，而是**情感性体验产品**——与 Pixel Herbarium 的「发现→纪念」定位有高度共鸣。

---

## 九、设计语言分析：UI 风格与信息密度

### 9.1 从官方图片推断的 UI 设计风格

根据官方公开的三张核心界面图（calender.png / detail.png / approach.png）和地图截图（map_en_big.jpg），可以推断出以下 UI 特征：

**色彩系统：**
- 以粉色（樱花色）为主色调，与品类高度一致
- 地图底图为浅色（白/浅灰），颜色编码的 Pin 是主要视觉语言
- 整体色调轻盈，无深色模式（季节性应用不需要）

**Pin 颜色语义（颜色代表开花进度）：**

根据官方描述和日文版「桜のきもち」的颜色说明：

| Pin 颜色 | 含义（推断） |
|---------|------------|
| 灰色/深色 | 休眠期（未开始） |
| 浅粉/淡色 | 开始觉醒（Awakening） |
| 粉色 | 生长期（Growth，接近开花） |
| 亮粉/深粉 | 开花/满开（Kaika～Mankai） |
| 绿色 | 叶樱（Hazakura，已结束） |

**信息密度策略：**
- 地图页：低密度，只有 Pin 图标和颜色，无文字标注
- 详情页：中密度，核心数据（日期+Meter）突出，操作按钮清晰
- 日历页：中密度，时间轴结构，标记简洁

### 9.2 与 Pixel Herbarium 设计风格对比

| 维度 | Sakura Navi | Pixel Herbarium（目标） |
|------|------------|----------------------|
| 视觉风格 | 实用主义，信息优先 | Adult Kawaii，美学优先 |
| 色调 | 樱花粉 + 白底 | 奶油色 + 鼠尾草绿（品牌色） |
| 图鉴呈现 | 文字+数字为主 | **像素艺术图形**为主 |
| 收藏形态 | 地点列表 | 植物图鉴（有视觉化卡片） |
| 日历形态 | 简洁日期标记 | 可考虑植物开花季节日历 |
| 分享设计 | 无原生分享功能 | 9:16 Instagram 海报 + LINE |

---

## 十、对 Pixel Herbarium 的功能映射建议

### 10.1 MY SPOT → 「想发现」心愿单

Sakura Navi 的 MY SPOT 是「我想去这里看花」，Pixel Herbarium 可以设计对应的「想发现」系统：

**「发现心愿单」（Wish List）设计建议：**

- 用户在图鉴中看到某种**尚未解锁的植物**（灰色轮廓）
- 点击「想发现 ♡」→ 加入心愿单
- 心愿单显示：该植物通常在**哪些地点**和**哪个季节**出现
- 当用户移动至该植物出现的地理范围时，推送「附近可能有你心愿单中的植物」

| MY SPOT 的功能 | Pixel Herbarium「心愿单」对应设计 |
|--------------|-------------------------------|
| 收藏地点（想去的地方） | 收藏植物（想发现的物种） |
| 显示开花日期标记 | 显示该植物的当季发现窗口 |
| GPS 到达时通知 | GPS 进入发现区域时通知 |
| 30处上限 | 同样设上限（如20种），制造优先级选择 |
| 自动生成日历 | 自动生成「本月可发现」季节日历 |

### 10.2 花见日历 → 「植物季节日历」

Sakura Navi 日历的核心价值是**将「预测信息」转化为「行程规划工具」**，Pixel Herbarium 可以对应设计：

**「植物季节日历」设计建议：**

```
1月  2月  3月  4月  5月  6月  7月  8月  9月  10月  11月  12月
 │    │    │    │    │    │    │    │    │    │     │     │
川津  梅   染井  八重  藤   紫   向日  盂兰  彼岸  枫树  银杏   茶花
樱        吉野  樱        阳   葵   盆花  花         叶
                               ↑
                          当季可发现窗口
```

每个月份显示：
- 当月**进入发现窗口的植物**（新品种亮起）
- 用户**心愿单中当月可发现**的植物（高亮提醒）
- 用户**已发现但即将结束**的植物（淡出倒计时）

### 10.3 「自动标记」原则的移植

Sakura Navi 最优秀的设计原则是：**用户只需一个动作（加入 MY SPOT），系统自动完成所有后续信息整合。**

对应的 Pixel Herbarium 设计原则：

> **用户只需「识别一张照片」，系统自动完成所有图鉴更新、地图热点标记、季节日历更新、花言葉呈现。**

不需要用户手动分类、手动输入日期、手动关联地点——所有信息在「拍照识别」那一刻自动写入。

### 10.4 Sakura Navi 用户痛点 → Pixel Herbarium 功能机会

| Sakura Navi 用户痛点（已验证） | Pixel Herbarium 的对应解法 |
|-----------------------------|--------------------------|
| 「MY SPOT 数据卸载即失」 | 图鉴记录云端同步，永久保存 |
| 「无法添加地图外的地点」 | 任何地方拍照识别都能记录到地图上（用户自主生成位置数据） |
| 「没有地点实景照片」 | 用户识别时的原始照片 + 像素化版本同时保存 |
| 「无法预测花期结束时间」 | 季节限定植物设「消失倒计时」，制造紧迫感 |
| 「无人流密度信息」 | 城市热力图可间接反映发现密度（而非直接显示人流） |
| 「日历只显示开花/满开，无情感层」 | 花言葉 + 像素艺术，将日历变为情感化植物故事页 |

---

## 十一、数据来源与图片版权说明

### 11.1 主要数据来源

| 数据点 | 来源 URL | 获取方式 | 时间 |
|--------|---------|---------|------|
| 官方 UI 图片 URL（calender.png / detail.png / approach.png 等） | sakuranavi.n-kishou.co.jp/en | HTML 源码解析 | 2026年3月15日 |
| 「200K+ Total Downloads」 | sakuranavi.n-kishou.co.jp/en（底部统计） | 官方网站直接获取 | 2026年3月15日 |
| 「#1 in 20 regions」 | sakuranavi.n-kishou.co.jp/en（首页标语） | 官方网站直接获取 | 2026年3月15日 |
| 「130,000 downloads」（2025版） | Google Play（SakuraKaikaEn25）产品描述 | Google Play 原文 | 2026年3月 |
| 价格：900JPY | sakuranavi.n-kishou.co.jp/en | 官方网站定价 | 2026年3月15日 |
| 日历 1月起（2026版扩展） | Google Play（SakuraKaikaEn26）产品描述 | Google Play 原文 | 2026年3月 |
| 每周四更新 | sakuranavi.n-kishou.co.jp/en（「updates every Thursday」） | 官方网站 | 2026年3月15日 |
| Singapore 用户评价（MY SPOT + 日历） | sakuranavi.n-kishou.co.jp/en（Review 区） | 官方网站 | 2026年3月15日 |
| App Store 用户改进建议（原文） | apps.apple.com（2025版，id6736642399） | App Store 原文 | 2026年3月 |
| 日文版用户评论（原文） | apps.apple.com/jp（id1080542459） | App Store 日文原文 | 2026年3月 |
| 停车场信息（日文版详情页） | play.google.com（桜のきもち，com.jmc.android.SakuraKaika） | Google Play 原文 | 2026年3月 |
| 「每周四」格式 | sakuranavi.n-kishou.co.jp/en | 官方网站 | 2026年3月15日 |

### 11.2 图片版权说明

- 以上所有图片链接（`sakuranavi.n-kishou.co.jp/img/*.png`）均为 JMC 官方网站公开展示的宣传图片
- **版权归属：** © 2025 Japan Meteorological Corporation All rights reserved
- **使用建议：** 以上链接仅用于研究参考和功能分析，如需在正式文档或演示中使用，应截图存档并标注来源，或向 JMC 申请授权
- **稳定性：** 官方网站图片 URL 可能随版本更新而变化，建议在使用前验证链接有效性

### 11.3 相关 App Store / Google Play 链接存档

| 应用 | 平台 | App ID / 包名 | URL |
|------|------|-------------|-----|
| Sakura Navi 2026（英文） | App Store | id6752767536 | https://apps.apple.com/app/id6752767536 |
| Sakura Navi 2026（英文） | Google Play | com.jmc.android.SakuraKaikaEn26 | https://play.google.com/store/apps/details?id=com.jmc.android.SakuraKaikaEn26 |
| Sakura Navi 2025（英文，已归档） | App Store | id6736642399 | https://apps.apple.com/us/app/id6736642399 |
| Sakura Navi 2025（英文，已下架） | Google Play | com.jmc.android.SakuraKaikaEn25 | （已下架，不可访问） |
| 桜のきもち（日文免费版） | App Store | id1080542459 | https://apps.apple.com/jp/app/id1080542459 |
| 桜のきもち（日文免费版） | Google Play | com.jmc.android.SakuraKaika | https://play.google.com/store/apps/details?id=com.jmc.android.SakuraKaika |

---

*本文档为 Pixel Herbarium 项目内部研究文档，专项研究 Sakura Navi MY SPOT + 花见日历功能，版本 v1.0，2026年3月15日。*  
*如需更新：建议在每年1月（JMC 发布新版 APP 时）重新访问 sakuranavi.n-kishou.co.jp/en 验证图片 URL 和功能变更。*
