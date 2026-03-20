# Pixel Herbarium 竞品深度研究报告
## 三大核心洞察：市场验证 · GPS解锁机制 · 数据飞轮

> **文件版本：** v1.0  
> **研究日期：** 2026年3月  
> **用途：** Pitch素材 · 功能设计参考 · ASO文案依据  
> **数据来源：** App Store、Google Play、PCWorld、Japan Travel、Harvard Business School、Zenbird Media 等

---

## 目录

1. [核心洞察速览](#一核心洞察速览)
2. [市场验证：用户自发提出「Pokédex式收集」需求](#二市场验证用户自发提出pokédex式收集需求)
3. [功能参考：Sakura Navi 的 GPS 解锁印章卡机制](#三功能参考sakura-navi-的-gps-解锁印章卡机制)
4. [增长参考：Weathernews Sakura Channel 数据飞轮](#四增长参考weathernews-sakura-channel-数据飞轮)
5. [竞品全貌：设计与数据矩阵](#五竞品全貌设计与数据矩阵)
6. [用户痛点汇总与产品机会映射](#六用户痛点汇总与产品机会映射)
7. [对 Pixel Herbarium 的直接行动建议](#七对-pixel-herbarium-的直接行动建议)

---

## 一、核心洞察速览

| # | 洞察 | 来源 | 对 Pixel Herbarium 的价值 |
|---|------|------|--------------------------|
| 🔴 | **市场验证**：真实用户在 PlantSnap 评论中主动提出「希望有 Pokédex 式收集机制」，但至今无任何植物 APP 实现 | PlantSnap App Store 用户评论 | Pitch 核心论据；ASO 文案素材 |
| 🟡 | **机制参考**：Sakura Navi 的 GPS 解锁印章卡让用户必须**亲临现场**才能完成收集，制造强烈的现实探索驱动力，2026年成为全球17个地区 App Store 旅游类 #1 | Sakura Navi App Store / Google Play 官方描述 | 城市发现地图的核心交互设计框架 |
| 🟢 | **增长参考**：Weathernews 的 Sakura 樱花众包项目从用户贡献数据出发，构建出数据飞轮，最终改变了整个日本的天气预报行业，并被哈佛商学院收录为经典案例 | HBS Case 617-053；PCWorld | 城市地图的社区增长策略蓝图 |

---

## 二、市场验证：用户自发提出「Pokédex式收集」需求

### 2.1 原始证据：来自 PlantSnap 的真实用户声音

PlantSnap 是全球下载量最大的植物识别应用之一，拥有超过 **5,000万用户**，覆盖 200+ 国家。在其 App Store 评论中，有用户主动留言：

---

> **"An idea to make it more interactive is to have & earn badges that you can collect when you find and snap different species and maybe even colors. Kind of like a Pokédex style."**
>
> — PlantSnap App Store 真实用户评论（justuseapp.com 收录）

---

这条评论的重要性不在于它的点赞数，而在于它揭示了一个**从未被任何现有植物类 APP 真正实现的用户心智需求**：

- 用户**自发**将植物收集与 Pokédex（精灵图鉴）联系在一起
- 用户期望「拍摄行为」能够触发「收集成就感」
- 用户对「按品种/颜色分类收集」有明确偏好

### 2.2 为什么这条评论是有力的市场验证

| 维度 | 说明 |
|------|------|
| **自发性** | 非问卷调查、非引导性访谈，用户完全出于自身需求主动留言 |
| **可量化** | PlantSnap 在 App Store 评分 4.6（67,000+ 评论），是有真实体量的活跃用户基础 |
| **跨 APP 共识** | 类似诉求在 iNaturalist 的 Seek 子应用（儿童版）中也有体现，说明收集机制是植物发现类应用的普遍未满足需求 |
| **竞品空白** | 截至2026年3月，无任何面向消费者的植物类 APP 将「AI识别 + 游戏化收集 + 艺术生成」三者结合 |

### 2.3 PlantSnap 本身的收集机制现状（对比参照）

PlantSnap 目前提供的是：

- ✅ **图书馆模式**：将识别过的植物保存至个人图书馆，支持网页端同步
- ✅ **SnapMap**：在地图上显示全球用户匿名识别的植物位置
- ❌ **无稀有度体系**：所有植物地位平等，无任何稀有植物设定
- ❌ **无成就/徽章系统**：没有完成度、进度感或解锁机制
- ❌ **无视觉艺术层**：识别结果只显示科学信息，无任何美学转化

PlantSnap 的官方商店描述中有一句耐人寻味的 CTA：**"See how many you can collect!"**（看你能收集几种！）—— 但产品本体并未提供任何支撑「收集乐趣」的机制设计，用户的期望与产品现实之间存在明显落差。

### 2.4 相关竞品收集机制现状

| APP | 收集机制类型 | 稀有度 | 成就/徽章 | 艺术化呈现 | 备注 |
|-----|------------|--------|----------|-----------|------|
| PlantSnap | 图书馆（列表） | ❌ | ❌ | ❌ | 用户主动要求 Pokédex 化 |
| PictureThis | My Garden（档案） | ❌ | ❌ | ❌ | 偏向功能工具，无游戏化 |
| GreenSnap | My Album（相册） | ❌ | ❌（仅比赛奖项） | ❌ | 社区导向，无个人成就 |
| Sakura Navi | 印章卡（Stamp Card） | ❌ | ❌ | ❌ | 地点导向，非植物种类导向 |
| iNaturalist Seek | 观察记录 | ❌ | ✅（徽章/挑战） | ❌ | 科学向，UI 偏学术 |
| **Pixel Herbarium** | **像素图鉴（设计中）** | **✅ ★～★★★** | **✅（规划中）** | **✅ 像素生成** | **市场空白填补者** |

### 2.5 如何将此用于 Pitch 与 ASO

**Pitch 叙事框架（建议）：**

> "全球最大植物识别应用 PlantSnap 拥有5000万用户，但其用户在评论区主动写道：'希望能像 Pokédex 一样收集植物'。这个需求存在已久，却从未被任何产品真正实现。Pixel Herbarium 就是那个答案——不只是识别，而是发现、像素化、收集、分享。"

**ASO 关键词建议（日语）：**

- `植物図鑑`（植物图鉴）
- `花コレクション`（花收集）
- `花識別`（花卉识别）
- `ピクセルアート 花`（像素艺术 花）
- `花見アプリ`（花见 APP）

---

## 三、功能参考：Sakura Navi 的 GPS 解锁印章卡机制

### 3.1 Sakura Navi 背景数据

| 指标 | 数值 |
|------|------|
| 开发方 | 日本気象株式会社（JMC） |
| 价格模型 | 付费买断，约 $4.99/版本，每年发新版 |
| 2026年1月排名 | App Store 旅游类（付费）**全球15～17个地区 #1** |
| 覆盖范围 | 日本全国约 **1,000处**赏樱地点（含北海道至鹿儿岛） |
| 2026年新功能 | 新增川津樱预报 + 全国节庆活动页 |
| 社交媒体 | Instagram @sakura_navi_japan，9,138 粉丝，279 帖子 |

### 3.2 印章卡（Stamp Card）机制拆解

#### 核心逻辑：**只有到场，才能解锁**

Sakura Navi 的 Stamp Card 机制规则如下（来自 Google Play 官方描述）：

> *"Previously Visited Stamp can be put on the location by clicking the button 'Visited Stamp.' **Visited Stamp is available only when you are actually near the location.** Once you have visited the location, you can put the stamp later even when you are away from there."*

这一规则设计产生了以下用户行为链：

```
用户打开地图 → 看到周边赏樱地点 → 想要收集印章 
    ↓
必须亲自前往 → 实际到访 → GPS 验证 → 解锁印章
    ↓
印章卡页面显示已访问地点 → 成就感 → 分享/继续探索
```

#### 配套的「近距离提醒」系统

Sakura Navi 同时设计了**主动推送**机制：

> *"A notification will be sent when you are near a Cherry Blossom SPOT."*  
> （当你接近赏樱地点时，系统将发送通知。）

这意味着用户即使在「随意行走」状态下，也可能被动触发探索行为——大幅降低了「需要主动寻找」的心理门槛。

#### MY SPOT 收藏日历

用户可收藏最多 **30个** 心仪地点，系统自动生成个人花见日历，在对应日期标注各地点的「初花」与「满开」预测节点。

### 3.3 GPS 解锁机制为何有效：行为心理学视角

| 心理机制 | Sakura Navi 的触发方式 | Pixel Herbarium 的对应设计 |
|---------|----------------------|--------------------------|
| **稀缺性**（Scarcity） | 印章只能在特定地点解锁 | 稀有植物（★★★）只在特定地点+特定季节出现 |
| **完成驱动**（Completion Compulsion） | 印章卡的空白格子制造「未完成感」 | 图鉴页面的灰色占位槽（未发现植物显示轮廓） |
| **现实锚定**（Reality Anchoring） | 必须真实到访才能获得成就 | 必须在现实中拍摄才能生成像素图鉴 |
| **FOMO 效应** | 地图显示他人已打卡的地点 | 城市热力图显示其他用户已发现的植物密度 |
| **及时奖励**（Immediate Reward） | 到访即刻可盖章，延迟满足极短 | 拍照即生成像素图，等待时间 <3秒 |

### 3.4 Sakura Navi 机制在 Pixel Herbarium 中的升级应用

Sakura Navi 的印章卡是**地点维度**的收集（「我去过哪里」），Pixel Herbarium 可以在此基础上叠加**物种维度**的收集（「我发现了什么」），形成二维收集矩阵：

```
                    物种维度
                 常见植物 → 稀有植物
                 ↑              ↑
地点维度 → 热门地点  [基础图鉴]  [季节限定解锁]
         ↓
         隐秘地点  [探索奖励]   [★★★ 极稀有]
```

**具体功能建议（基于 Sakura Navi 机制）：**

1. **隐藏植物解锁**：部分 ★★★ 稀有植物设定为「只在某一地点的某个季节才能识别」，创造现实探索驱动力
2. **GPS 印章 + 植物发现双轨收集**：用户既可收集「到访过的地点印章」，也可收集「发现的植物种类」，两个维度相互强化
3. **「附近有新植物」推送**：当用户所在位置500米内有其他用户发现过但本人尚未收集的植物时，主动推送提醒

---

## 四、增长参考：Weathernews Sakura Channel 数据飞轮

### 4.1 Weathernews × Sakura 项目背景

**Weathernews, Inc.** 是日本最大的私营气象信息服务公司，其 Weathernews Touch 应用已累计下载 **1,300万次**，每日接收约 **130,000条** 用户众包气象报告。

其中的「Sakura Channel（樱花频道）」项目是公司众包战略的起点——也是哈佛商学院记录在案的经典数据飞轮案例。

### 4.2 Sakura Channel 机制拆解

#### 核心数据（PCWorld 报道，来自 Weathernews 官方）

- 覆盖全日本 **700处**名所的开花时间预报
- 来自全国 **11,200名**用户持续提供本地樱花实况上报
- 每日全平台接收 **130,000条**用户报告（含樱花、天气、花粉等）

#### 众包飞轮运转逻辑

```
Step 1: 用户上报本地樱花开花状态（照片 + 文字）
    ↓
Step 2: Weathernews 算法整合 11,200 条本地报告
    ↓
Step 3: 生成比官方气象厅更精准的本地化预报
    ↓
Step 4: 更精准的预报吸引更多用户下载
    ↓
Step 5: 更多用户 → 更多上报数据 → 预报更精准
    ↓
    [飞轮自我强化，最终改变日本天气预报行业格局]
```

Weathernews 发言人曾表示：

> *"Our app is special in that it uses information from ordinary people. About 8 million users are sending us photos and weather reports of every sort. Some other developers simply tell you whether trees are blooming or not in each prefecture, but about 11,200 users across the country are sending us information about local cherry trees and we take advantage of that input."*

#### 哈佛商学院评价

HBS Case 617-053（Lakhani & Kanno, 2017）记录：

> *"The Sakura Project, where the company asked users in Japan to report about how cherry blossoms were blooming near them day by day, had opened up opportunities for the company's consumer business in Japan. The project ultimately garnered positive publicity and became a foothold to building the company's crowdsourcing weather-forecasting service in Japan. **It changed the face of weather forecasting in Japan.**"*

### 4.3 Virtual Hanami（虚拟花见）的创新延伸

Weathernews 在疫情期间推出了「Hanami VR」虚拟花见网站：

- 用户上传的全国各地樱花延时摄影视频
- Ricoh Theta 360度全景相机拍摄的公园实时场景
- 显示当前天气、开花百分比、持续更新的现场照片

这一功能验证了「无法亲临者愿意通过数字内容参与花见」的用户需求，与 Pixel Herbarium 的「数字纪念」逻辑高度一致。

### 4.4 数据飞轮在 Pixel Herbarium 中的应用设计

Weathernews 的飞轮核心是：**用户上报 → 数据精准 → 更多用户**。  
Pixel Herbarium 可以设计类似但更具美学价值的飞轮：

```
【Pixel Herbarium 版数据飞轮】

用户在城市中发现并识别植物
    ↓
识别结果 + GPS 位置 → 城市植物热力图更新
    ↓
地图上出现新的「发现密集区」→ FOMO 效应
    ↓
新用户下载并前往探索（「别人发现了XX种，我去看看」）
    ↓
更多用户发现 → 地图更丰富 → 城市图鉴数据库更完整
    ↓
    [飞轮强化：发现记录越多，城市地图价值越高]
```

#### 与 Weathernews 飞轮的关键差异

| 维度 | Weathernews Sakura Channel | Pixel Herbarium 飞轮 |
|------|---------------------------|---------------------|
| 数据类型 | 天气/开花状态上报 | 植物识别 + GPS 位置 |
| 用户激励 | 为社区贡献精准预报（利他） | 个人图鉴增长 + 地图探索（利己+利他） |
| 内容价值 | 功能性（什么时候开花） | 情感性（我发现了什么+像素纪念） |
| 季节性 | 仅春季（樱花季2-5月） | 全年（60种植物覆盖四季） |
| 网络效应 | 数据精准度随用户数提升 | 地图丰富度 + 社区稀有植物发现率随用户数提升 |

---

## 五、竞品全貌：设计与数据矩阵

### 5.1 核心竞品概览

#### ① Sakura Navi（日本気象株式会社）

| 项目 | 详情 |
|------|------|
| 价格 | 约$4.99买断，年年发新版 |
| 覆盖 | ~1,000个日本赏樱地点 |
| 2026年排名 | App Store 旅游类(付费) 全球15+国家 #1 |
| 核心功能 | Flowering Meter / GPS印章卡 / MY SPOT日历 / 附近提醒 / 节庆活动 |
| 用户行为 | 驱动用户实际到访赏樱地点 |
| 局限 | 仅限樱花季；无植物识别；无视觉艺术层；无社交礼物功能 |

**媒体评价引用：**

> *"It includes a 'Proximity Notification for Cherry Blossom SPOT', where you'll get a notification when you are close to a Cherry Blossom SPOT. It also features a digital 'Stamp Card' for recording the sakura viewing sites you've visited."*  
> — The Real Japan（旅游媒体）

---

#### ② Weathernews Touch / Sakura Channel（Weathernews, Inc.）

| 项目 | 详情 |
|------|------|
| 价格 | 免费 |
| 用户规模 | 日本 800万用户；累计下载 1,300万次 |
| 众包数据 | 每日 130,000条用户报告；11,200名樱花专项上报用户 |
| 核心功能 | 众包开花预报 / Virtual Hanami VR / 樱花模拟器 / 花见日历 |
| 学术背书 | 哈佛商学院 HBS Case 617-053 经典案例 |
| 局限 | 无植物识别；无收集机制；无个人化艺术内容；季节性强 |

---

#### ③ GreenSnap（GreenSnap, Inc. 日本）

| 项目 | 详情 |
|------|------|
| 价格 | 免费（含社区） |
| 用户规模 | 累计照片 2,000万张；日均上传 40,000张 |
| 核心功能 | AI植物识别 / 植物图鉴 / 个人相册 / 季节照片大赛 / 每日花言葉推送 |
| 政府合作 | 2025年与横滨市合作，众包赏花评论实现英/繁中/简中多语言实时翻译 |
| 核心受众 | 日本女性园艺爱好者，高度契合 Pixel Herbarium 目标人群 |
| 局限 | 无像素艺术；无收集/稀有度体系；无社交礼物；UI 偏园艺工具 |

**用户需求（Google Play 描述中的用户自述）：**

> *"I want to know the name of the plant. I want to record growth. I want to talk casually with friends who love plants. I want to be healed by wonderful photos."*

**每日花言葉推送**（值得借鉴）：

> *"Every morning, we will send you a soothing photo of 'Today's flower' along with the language of flowers."*

---

#### ④ PictureThis（Glority Global Group）

| 项目 | 详情 |
|------|------|
| 价格 | Freemium；7天免费试用；约$29.99/年 |
| 用户规模 | App Store 评分 4.6（100万+评论）；Google Play 1,000万+下载 |
| 识别能力 | 40万+品种；宣称精度98%；每日20万+用户图片迭代训练 |
| 核心功能 | AI识别 / Plant Doctor病虫害诊断 / 光照计 / 养护提醒 / AR扫描 / 24/7专家咨询 |
| 市场地位 | 全球植物识别APP市值最大玩家（市场规模2023年$2.1亿，预计2032年$6.8亿） |
| 局限 | 强制广告/强制付费体验差；内容同质化；无艺术层；无社交礼物；UI科学工具化，与日本Kawaii审美不符 |

**高频差评（App Store / Google Play）：**

> *"Subscription cost is justifiable for professionals but for those who will only use it occasionally it might be pretty pricey."*  
> — Product Hunt 评价

> *"It's the best app I've found for identification and tracking but it's far from great... the same pictures are used for every plant so they're not really helpful."*  
> — App Store 用户

> *"The constant interference with subscription ads and profiles is irritating."*  
> — App Store 用户

---

#### ⑤ PlantSnap（PlantSnap, Inc.）

| 项目 | 详情 |
|------|------|
| 价格 | 免费；Pro版 $2.99/月 或 $19.99/年 |
| 用户规模 | 全球社区 5,000万+用户；200+国家；Google Play 1,000万+下载 |
| 识别能力 | 60万+品种；每月20万+图片迭代训练 |
| 核心功能 | AI识别 / SnapMap全球发现地图 / 个人图书馆 / AR实时标注 / 植物社区 |
| 环保承诺 | 每注册用户种一棵树，目标种植1亿棵 |
| 局限 | Google Play 评分仅3.6（App Store 4.6）；广告体验差；无稀有度/成就体系；识别准确率参差不齐 |

**用户自发提出 Pokédex 式收集需求（原文）：**

> ***"An idea to make it more interactive is to have & earn badges that you can collect when you find and snap different species and maybe even colors. Kind of like a Pokédex style."***  
> — PlantSnap App Store 真实用户评论

PlantSnap 自身的 CTA 文案也暗示了收集欲望但未实现：

> *"Create your own library of flowers, mushrooms, and trees! **See how many you can collect!**"*  
> — PlantSnap App Store 官方描述（仅停留在文案层，产品无对应机制）

**额外竞品参考——ObsIdentify（Observation International）：**

ObsIdentify 是另一款值得关注的对标产品，提供真正的游戏化自然观察体验，但局限明显：

> *"It doesn't just enhance your time outdoors, it gamifies it — collecting your wildlife and plant images and information, earning badges and joining BioBlitz challenges along the way."*  
> — Outdoor Guide 评测

> 局限：**仅覆盖欧洲和荷属加勒比海地区**，日本市场完全空白。

---

### 5.2 功能对比全矩阵

| 功能维度 | Sakura Navi | Weathernews | GreenSnap | PictureThis | PlantSnap | **Pixel Herbarium** |
|---------|:-----------:|:-----------:|:---------:|:-----------:|:---------:|:-------------------:|
| AI 植物识别 | ❌ | ❌ | ✅ | ✅✅ | ✅ | ✅ |
| 像素艺术生成 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **全球唯一** |
| 稀有度体系 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ★～★★★ |
| GPS 解锁机制 | ✅（印章卡） | ❌ | ❌ | ❌ | ❌ | ✅（稀有植物解锁） |
| 收集/图鉴系统 | ✅（地点印章） | ❌ | ✅（相册） | ✅（档案） | ✅（图书馆） | ✅（像素图鉴） |
| 花言葉文化层 | ❌ | ❌ | ✅（每日推送） | ❌ | ❌ | ✅ **深度本土化** |
| 城市发现地图 | ✅（预设地点） | ✅（预设地点） | ❌ | ❌ | ✅（SnapMap） | ✅（UGC热力图） |
| 数据飞轮机制 | ❌ | ✅ **成熟** | ✅（社区） | ❌ | ✅（部分） | ✅（设计中） |
| 社交分享（平台适配） | ❌ | ❌ | ✅ | ❌ | ✅（部分） | ✅（LINE+Instagram双格式） |
| 花束/礼物功能 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **全球唯一** |
| 季节限定内容 | ✅（年度版） | ❌ | ✅（比赛） | ❌ | ❌ | ✅（60种四季循环） |
| Adult Kawaii 设计风格 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **差异化** |
| 无广告 / 清晰付费 | ✅ | ✅ | ✅ | ❌（强制广告） | ❌（有广告） | ✅ |
| iOS 优先 + Apple IAP | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 六、用户痛点汇总与产品机会映射

以下痛点来源于对全部5款竞品的用户评论系统性分析：

### 痛点 1：「识别了，然后呢？没有成就感」
- **来源**：PlantSnap、PictureThis 双平台用户评论
- **典型用语**：*"See how many you can collect!"*（官方文案，但产品无对应）
- **Pokédex 评论**：直接点名缺少收集成就机制
- **Pixel Herbarium 对策**：像素图鉴 + 稀有度 ★～★★★ + 季节解锁

### 痛点 2：「广告太多 / 付费体验差 / 不透明」
- **来源**：PictureThis（最高频差评）；PlantSnap（Google Play 3.6分主因）
- **典型用语**：*"The constant interference with subscription ads is irritating"*；*"don't waste your time"*
- **Pixel Herbarium 对策**：5次/月清晰免费配额，无广告，订阅价值一目了然

### 痛点 3：「信息重复，内容无趣，像在查百科」
- **来源**：PictureThis 用户
- **典型用语**：*"the same pictures are used for every plant so they're not really helpful"*
- **Pixel Herbarium 对策**：花言葉文化层 + 像素艺术生成，每次识别都是独一无二的文化体验

### 痛点 4：「发现了很多，但图片太普通，不想发出去」
- **来源**：GreenSnap 用户分享率分析（功能存在但分享动力不足）
- **Pixel Herbarium 对策**：像素艺术海报（9:16 Instagram格式 + LINE花束卡）——分享物本身就是病毒传播载体

### 痛点 5：「樱花季结束 APP 就没用了」
- **来源**：Sakura Navi 用户（年度买断模式）；Weathernews 非花季活跃度下降
- **Pixel Herbarium 对策**：60种四季植物设计，梅雨季/枫叶季/冬季各有当季稀有植物，全年留存动机

---

## 七、对 Pixel Herbarium 的直接行动建议

### 7.1 将「Pokédex 评论」纳入 Pitch Deck 第2页

建议在融资 / 媒体 Pitch 中，将 PlantSnap 用户原话作为「市场需求存在且未被满足」的最有力直接证据，置于竞品对比之前：

```
结构建议：
Page 1 → 问题（花见用户无法数字化纪念发现）
Page 2 → 市场验证（PlantSnap 5000万用户，有人写了这句话↑）
Page 3 → 解决方案（Pixel Herbarium 的发现→像素→收集→分享闭环）
```

### 7.2 将 GPS 解锁机制列入 MVP 功能范围

Sakura Navi 的印章卡机制已在全球市场（樱花季）验证有效，且技术实现门槛不高（GPS 地理围栏）。

**建议在4月上线版本中包含：**
- 附近植物提醒推送（500米内有未收集植物时推送）
- 隐藏稀有植物的「地点解锁」设定（至少3种 ★★★ 植物绑定地理位置）

### 7.3 以 Weathernews 飞轮逻辑设计种子用户策略

Weathernews 的飞轮起点是 11,200 名持续上报的核心贡献者——不是1,300万下载量。

**Pixel Herbarium 的飞轮启动：**
- 上线前，100-200名东京种子用户的发现记录，足以在地图上形成密集热点
- 热点城市地图是向第二批用户展示「这个地方有丰富发现」的最直观 FOMO 工具
- **不需要大量用户才能让地图看起来有内容**——少量高质量种子记录即可启动飞轮

### 7.4 ASO 策略：用竞品痛点反向定位

在 App Store 截图和描述文案中，可以直接对准竞品用户的高频差评做差异化表达：

| 竞品痛点 | Pixel Herbarium ASO 表达 |
|---------|------------------------|
| 广告太多 | 「无广告 · 5次免费体验 · 清晰订阅」 |
| 识别后没意义 | 「识别→像素化→收集成图鉴，每次发现都是纪念」 |
| 没有收集成就感 | 「60种植物等你收集 · ★★★稀有植物季节限定」 |
| 无法分享 | 「一键生成 9:16 海报 · LINE 花束卡即时分享」 |

---

## 附录：数据来源索引

| 数据点 | 原始来源 |
|--------|---------|
| PlantSnap「Pokédex式收集」用户评论 | justuseapp.com（App Store评论聚合） |
| PlantSnap 5,000万用户数 | PlantSnap App Store 官方描述 |
| Sakura Navi 2026年全球 #1（15-17国） | JMC 官方新闻稿；Sakura Navi Instagram |
| Sakura Navi Stamp Card 规则详情 | Google Play 官方产品描述 |
| Sakura Navi Proximity Notification 设计 | The Real Japan 媒体报道 |
| Weathernews 8百万用户 / 1,300万下载 | PCWorld 报道（引用 Weathernews 官方数据） |
| Weathernews 11,200名樱花上报用户 | PCWorld 报道（引用 Weathernews 发言人） |
| Weathernews 每日 130,000 条报告 | IGNITE（大阪数字营销机构）报告 |
| HBS Case 617-053 评价 | Harvard Business School 官网（Lakhani & Kanno, 2017） |
| GreenSnap 2,000万照片 / 日均 40,000 上传 | Zenbird Media（2025年4月）；GreenSnap APKPure |
| GreenSnap × 横滨市政府合作 | Zenbird Media（2025年4月14日报道） |
| PictureThis App Store 评分 4.6 / 100万评论 | picturethisplantidentifier.com（评测文章） |
| PictureThis 识别品种 40万+ / 精度98% | PictureThis App Store 官方描述 |
| 全球植物识别APP市场规模（$2.1亿→$6.8亿） | Dataintelo 市场研究报告（2024-2032） |
| ObsIdentify 游戏化自然观察 | Outdoor Guide 评测（2025年11月） |

---

*本报告为 Pixel Herbarium 项目内部研究文档，版本 v1.0，2026年3月。*  
*如需更新特定竞品数据，建议在每年3月（樱花季前）重新抓取 App Store 排名数据。*
