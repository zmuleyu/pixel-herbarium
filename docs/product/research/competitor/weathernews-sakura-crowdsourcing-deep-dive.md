# Weathernews × Sakura Project：众包数据飞轮深度研究
## 从「10,000名志愿者」到「改变日本天气预报行业」的完整路径

> **文件版本：** v1.0  
> **研究日期：** 2026年3月  
> **研究对象：** Weathernews, Inc. ——「樱花项目」（Sakura Project）及其Sakura Channel  
> **核心问题：** 一个樱花季众包项目如何演化为公司最重要的消费者业务？数据飞轮的构建路径是什么？  
> **数据来源：** PCWorld、TechCrunch、Japan Times、Japan Today / SoraNews24、Harvard Business School（HBS Case 617-053）、IGNITE、Otaquest

---

## 目录

1. [公司基本信息](#一公司基本信息)
2. [樱花项目的起源：从危机到机遇](#二樱花项目的起源从危机到机遇)
3. [关键数字：规模与影响力](#三关键数字规模与影响力)
4. [Sakura Channel：功能架构完整拆解](#四sakura-channel功能架构完整拆解)
5. [众包数据飞轮：运转机制图解](#五众包数据飞轮运转机制图解)
6. [Virtual Hanami：数字内容的延伸](#六virtual-hanami数字内容的延伸)
7. [哈佛商学院视角：学术验证](#七哈佛商学院视角学术验证)
8. [TechCrunch 视角：行业影响力](#八techcrunch-视角行业影响力)
9. [飞轮成功的关键因素分析](#九飞轮成功的关键因素分析)
10. [与传统气象机构的竞争关系](#十与传统气象机构的竞争关系)
11. [对 Pixel Herbarium 的设计映射](#十一对-pixel-herbarium-的设计映射)
12. [风险与局限：飞轮的脆弱点](#十二风险与局限飞轮的脆弱点)

---

## 一、公司基本信息

### 1.1 Weathernews, Inc. 概览

| 项目 | 详情 |
|------|------|
| **公司名称** | ウェザーニューズ株式会社（Weathernews Inc.） |
| **总部** | 日本千叶市（东京）；全球运营 |
| **证券上市** | 东京证券交易所（东证） |
| **业务定位** | 自称「全球最大私营气象信息服务公司」 |
| **核心差异化** | **众包（Crowdsourcing）气象数据模型** |
| **消费者产品** | Weathernews Touch（iOS/Android） |
| **国际产品** | Sunnycomb（2013年进入美国市场）|

### 1.2 规模数据

| 指标 | 数值 | 来源 |
|------|------|------|
| Weathernews Touch 累计下载 | **1,300万次** | PCWorld（引用 Weathernews 官方）|
| 日本日活用户规模 | **约800万** | PCWorld（Weathernews 官方声明）|
| 每日用户报告量 | **约130,000条** | IGNITE 数字营销报告 |
| 全球数据覆盖 | 140个国家（Weathermob 并购后） | TechCrunch |

---

## 二、樱花项目的起源：从危机到机遇

### 2.1 背景：官方气象厅退出樱花预报

日本气象厅（Japan Meteorological Agency, JMA）曾连续半个多世纪发布全国樱花开花预报，但在 **2009年宣布停止**，理由是「专注于其他核心气象服务」，同时政府削减预算。

这一「官方退场」制造了一个巨大的市场空白：

> *"The agency provided cherry blossom forecasts for over half a century, based on sample trees and historical records, but stopped in 2009 to focus on other services. Since then, companies have stepped in with forecasts of their own."*  
> — PCWorld

在此之前（约2007-2008年），Weathernews 就已经开始用众包方式切入这个领域，并在官方退出后迅速成为市场主导者之一。

### 2.2 Sakura Project 的诞生（2007年前后）

**Japan Times（2008年）报道**提供了项目初期最详细的数据：

> *"More than **10,000 volunteers** across the country took part in the Sakura Project in its inaugural year last spring, according to Weathernews."*

> *"This year, there were **17,831 registered participants** as of Friday, and the number is expected to increase as the blooming season approaches, said Yuka Yoda, spokeswoman for Weathernews."*（第二年数据）

> *"Japanese are very, very interested in when sakura will start blooming. **Every participant is enjoying watching the sakura every day** and sharing the information with others."*  
> — Yuka Yoda，Weathernews 发言人

这段话点出了众包成功的核心：**参与者本身就有参与动机，他们不是在「为公司打工」，而是在享受自己喜欢做的事。**

### 2.3 项目演化时间线

| 年份 | 里程碑 |
|------|--------|
| **~2007** | 樱花项目首年启动，10,000+ 志愿者参与 |
| **~2008** | 第二年参与者增至 17,831 人，已超越政府机构的单点精度 |
| **2009** | 日本气象厅退出樱花预报，市场空白扩大 |
| **2013** | Weathernews 推出 Sunnycomb，开始美国市场扩张 |
| **2015** | 收购 Weathermob（拥有 100,000 月活，140个国家），全球化提速 |
| **2017** | 哈佛商学院收录 Weathernews 案例（HBS Case 617-053） |
| **2026** | 樱花项目进入「**第20年**」，累计收到 **200万条**用户上报记录 |

### 2.4 第20年的里程碑数据（2026年）

**Japan Today / SoraNews24（2026年1月）报道：**

> *"Using weather and temperature data, and over **2 million reports** sent in by participants of the 'Sakura Project', a nationwide record of observations **now in its 20th year**, Weathernews has long been a trusted source for predicting the blooming period of the Somei-Yoshino cherry blossoms."*

**核心数字对比：**

| 阶段 | 年份 | 参与志愿者/报告量 |
|------|------|-----------------|
| 首年 | ~2007 | 10,000+ 名参与者 |
| 第二年 | ~2008 | 17,831 名注册参与者 |
| 成熟期 | 近年 | 11,200 名活跃上报用户（Sakura Channel 专项） |
| 第20年累计 | 2026 | **200万条**总报告记录 |

---

## 三、关键数字：规模与影响力

### 3.1 活跃数据汇总

| 指标 | 数值 | 数据来源 |
|------|------|---------|
| Sakura Project 历史积累 | **200万条**上报记录 | Japan Today（2026年1月） |
| 项目持续年数 | **第20年**（2026年） | Japan Today（2026年1月） |
| Sakura Channel 专项上报用户 | **11,200人** | PCWorld（Weathernews 发言人） |
| 覆盖花见地点 | **700处**名所 | PCWorld |
| 每日全平台报告总量 | **130,000条** | IGNITE 报告 |
| Weathernews Touch 下载量 | **1,300万次** | PCWorld（Weathernews 官方）|
| 日本用户规模 | **约800万** | PCWorld |

### 3.2 数字背后的结构关系

```
全平台每日报告（130,000条）
    ↑
    包含：天气报告 / 花粉报告 / 樱花上报 / 台风报告 等
    ↑
其中 Sakura Channel 专项（季节性）
    ↑
    来自 11,200名 核心樱花上报贡献者
    ↑
    分布全国 700处 花见名所
    ↑
20年累计形成 200万条 历史观测记录
    ↑
    历史数据 × 当年气温数据 = 精准本地化预报
```

---

## 四、Sakura Channel：功能架构完整拆解

### 4.1 核心功能描述（PCWorld 报道）

> *"It provides forecasts, based on user reports, for when cherry blossoms will bloom at 700 famous viewing locations across Japan. Users can see **hanami calendars** and get **alerts** about when their favorite groves of cherry trees will burst into pink-white flowers. They can also choose from preferences such as **public parks, cherry-lined roads and spots known for nighttime revelry under the boughs**."*

### 4.2 功能模块拆解

#### ① 众包开花预报（核心差异化）

- 基于全国 11,200 名用户的实时上报数据
- 覆盖 700 处花见名所（远超政府机构覆盖密度）
- 预测精度因本地数据密度而超越传统气象站

**与竞品的根本区别（Weathernews 发言人原话）：**

> *"Some other developers simply tell you whether trees are blooming or not in each prefecture, but about 11,200 users across the country are sending us information about local cherry trees and we take advantage of that input."*

关键对比：竞品是「都道府县级」（大粒度），Weathernews 是「地点级」（小粒度）。

#### ② 花见日历（Hanami Calendar）

- 用户设置收藏地点后，系统自动生成按时间轴排列的花见行程日历
- 显示各收藏地点的预测开花/满开日期
- 支持设置特定地点的提醒

#### ③ 偏好分类系统

用户可按以下类型筛选赏樱地点：

- 公园（公共空间，适合野餐）
- 樱花大道（连续樱花道，适合散步摄影）
- 夜樱场所（有灯光照明，适合夜间花见）

#### ④ 樱花模拟器（Sakura Simulator）

> *"A 'sakura simulator' shows a low-res view of pink petals gradually taking over cities such as Tokyo as users click through the calendar from late March through early April, the usual season for sakura."*  
> — PCWorld

功能描述：以动画形式模拟樱花「前线」从南往北推进的过程，帮助用户直觉性理解「花前」的时空走势。

#### ⑤ Virtual Hanami VR（疫情期间特别功能）

Weathernews 在社会聚集受限期间推出「Hanami VR」网站：

**OtaQuest 报道（2020年）：**

> *"The website is called 'Hanami VR' and consists of a web interface and a series of YouTube VR videos that allow essentially anyone with a cardboard VR headset to virtually visit any of the parks throughout Japan which are popular for Hanami gatherings. It even shows what the current weather is, how many sakura are blossoming and constantly updated photos of what the blossoming is looking like in all of the available parks."*

这一功能包含：
- **实时现场照片**（持续更新）
- **当前天气数据**
- **开花百分比进度**
- **360度全景VR视频**（使用 Ricoh Theta 相机拍摄）
- **延时摄影视频**（展示一周内花开/花落过程）

---

## 五、众包数据飞轮：运转机制图解

### 5.1 飞轮的核心结构

Weathernews 的数据飞轮之所以能自我强化，是因为每个环节都为下一个环节提供输入：

```
┌─────────────────────────────────────────────────────────┐
│                 Weathernews Sakura 数据飞轮               │
└─────────────────────────────────────────────────────────┘

    [1] 用户上报本地樱花状态（照片+位置+进度估计）
                    ↓
    [2] 算法整合 11,200 名分布全国的贡献者数据
                    ↓
    [3] 生成比官方更精准的「地点级」本地化预报
         （其他竞品只能做到「都道府县级」）
                    ↓
    [4] 精准预报 → 更多用户下载（口碑传播）
         → 更多用户信任 → 更愿意参与上报
                    ↓
    [5] 上报用户增多 → 数据密度提升 → 预报更精准
                    ↓
         [回到步骤2，飞轮自我加速]
                    ↓
    [6] 20年后：200万条历史记录成为护城河
         → 任何新进入者需要相同时间才能复制
```

### 5.2 飞轮的三个速度加速器

**加速器 ① 用户情感驱动（参与内驱力）**

参与者不是被金钱激励，而是因为「本来就在看樱花」，上报是顺手之举。发言人 Yoda 的评价点破了这个逻辑：

> *"Every participant is enjoying watching the sakura every day and sharing the information with others."*

这意味着边际贡献成本极低——用户参与不需要额外动机。

**加速器 ② 数据稀缺性（竞争优势护城河）**

TechCrunch 采访 Weathernews 首席创新官 Julia LeStage 的关键表述：

> *"Weathernews has already changed forecasting in Japan using crowdsourced data, but **they are the only ones in the world that have that model.**"*

强调：这一模式的独特性本身就是防御壁垒。

**加速器 ③ 社会信任积累（第20年效应）**

连续20年精准预报，形成了「日本人每年都找 Weathernews 看樱花预报」的社会习惯，新进入者无法在短时间内复制这一信任积累。

### 5.3 飞轮规模演化曲线（可追溯数据）

```
参与者规模
    ^
17,831|         ·
      |        · ·
10,000|      ·     ·
      |    ·         ·  ·  ·  ·  ·  ·  ·  [稳定期~11,200]
      |  ·
      +---+---+---+---+---+---+---+---+---→ 年份
      首年 +1年                              第20年
                                        累计200万条报告
```

**注：** 中间年份数据未公开，曲线形态为推断，端点数据为实际记录。

---

## 六、Virtual Hanami：数字内容的延伸

### 6.1 功能诞生背景

2020年，日本政府限制聚集活动，传统花见受到影响。Weathernews 将「无法亲临」的用户需求转化为产品机会。

**OtaQuest 评测：**

> *"Where it doesn't really replicate the exact feeling of being at a Hanami, it hits the spot of being able to go to the park to look at the beautiful sakura blossoms that happen only during a handful of days throughout the year."*

### 6.2 功能要素

| 功能要素 | 技术实现 | 用户体验 |
|---------|---------|---------|
| 360度全景视频 | Ricoh Theta 360相机 | 可用 VR 眼镜观看，也可在手机浏览器拖拽视角 |
| 延时摄影视频 | 多部手机现场拍摄 | 几分钟内看到一周花开/花落进程 |
| 实时现场照片 | 用户众包上传 | 显示花卉当前实际状态（区别于预测） |
| 天气数据叠加 | Weathernews 实时气象 | 知道现在去是否有好天气 |
| 开花进度显示 | Flowering Meter 数据 | 实时知道某公园的开花百分比 |

### 6.3 对「无法亲临者」的需求验证

Virtual Hanami 的出现，直接验证了一个重要的用户心理：

**即使无法亲临，人们仍然愿意通过数字内容「参与」花见仪式。**

这个洞察对 Pixel Herbarium 有直接价值：像素图鉴不是对真实花见的替代，而是对「我参与了这一刻」的数字纪念——与 Virtual Hanami 满足的是同一层次的情感需求，但方式完全不同。

---

## 七、哈佛商学院视角：学术验证

### 7.1 案例基本信息

- **案例编号：** HBS Case 617-053
- **标题：** "Weathernews"
- **作者：** Karim R. Lakhani & Akiko Kanno
- **首发：** 2017年1月（修订：2017年8月）
- **主题标签：** Crowdsourcing / Operations / Globalization / Weather / Forecasting and Prediction / Global Strategy

### 7.2 案例核心叙述（HBS 官网原文）

> *"Tomohiro Ishibashi (Bashi), chief executive officer for B to S, and Julia Foote LeStage, chief innovation officer of Weathernews Inc., were addressing a panel at the HBS Digital Summit on creative uses of big data. They told the summit attendees about how the **Sakura (cherry blossoms) Project**, where the company asked users in Japan to report about how cherry blossoms were blooming near them day by day, had opened up opportunities for the company's consumer business in Japan."*

> *"The project ultimately garnered positive publicity and became a foothold to building the company's **crowdsourcing weather-forecasting service in Japan.** **It changed the face of weather forecasting in Japan.** Bashi and LeStage wondered whether the experience could be applied to the U.S. market."*

### 7.3 三个关键结论的学术背书

| 结论 | HBS 案例支持 |
|------|-------------|
| Sakura Project 是公司众包战略的「起点」 | "became a foothold to building the company's crowdsourcing weather-forecasting service" |
| Sakura Project 的成功具有行业颠覆级别的影响 | "It changed the face of weather forecasting in Japan" |
| 该模式具备全球复制潜力，但存在本地化挑战 | "Bashi and LeStage wondered whether the experience could be applied to the U.S. market" |

### 7.4 「改变了日本天气预报行业」的具体含义

在 HBS 案例和 TechCrunch 报道的共同描述中，这一影响体现在：

1. **数据来源多元化**：打破了政府气象站垄断气象观测数据的格局
2. **精度提升**：基于本地志愿者的实时上报，比基于历史数据的传统预报更准确
3. **观念改变**：让气象界接受「众包数据可以和官方数据互补甚至超越」的理念
4. **商业模式验证**：证明消费者愿意免费贡献数据以换取更好的服务

---

## 八、TechCrunch 视角：行业影响力

### 8.1 TechCrunch 收购报道（2015年）的核心观点

TechCrunch 在报道 Weathernews 收购 Weathermob 时，采访了首席创新官 Julia Foote LeStage，以下引用均来自该报道：

**关于众包与传统气象数据的冲突：**

> *"Traditionally the weather story has been told by scientists and they are used to getting data from weather stations operated by airports and governments... Weathernews has already changed forecasting in Japan using crowdsourced data, but they are the only ones in the world that have that model."*

**关于从日本向美国复制的挑战：**

> *"In Japan, Weathernews did very well, so everyone there knows the power of crowdsourced weather. But in the U.S., even though the market is big compared to Japan, people still don't recognize the power of crowdsourcing, especially in the weather industry."*  
> — Tomohiro Ishibashi（Weathernews CEO）

**关于长期愿景：**

> *"I see weather data as a basic infrastructure for everyone, like water or the Internet or electricity. Our final goal is to make this data open to everyone and easy to use."*

### 8.2 樱花案例被用作面向投资者/媒体的核心说明案例

在 TechCrunch 报道中，Weathernews CEO 在解释众包价值时**选择了樱花案例**作为旗帜性示例：

> *"As an example of how Weathernews is used by Japanese consumers, Ishibashi points to cherry blossom season, a major tourist event throughout the country. Weathernews crowdsourcing tools allow users to upload photos, which, when combined with other weather data, make it easier for travelers and venue operators to make plans."*

**意义：** 即便面向国际投资者和科技媒体，樱花项目仍然是最能直观说明众包价值的「故事载体」——既有文化共鸣（全球都知道日本樱花），又有数据说服力（精准度超过官方）。

---

## 九、飞轮成功的关键因素分析

### 9.1 与其他众包项目的对比分析

哈佛数字数据设计学院（D3）的分析指出：

> *"Another difference is that Weathernews tried to align the crowd behind a common cause... It's possible that a common purpose instilled a set of values in Weathernews' crowd that decreased destructive behavior."*

**Weathernews 众包飞轮成功的5个核心条件：**

| 条件 | Weathernews 如何满足 |
|------|---------------------|
| **共同目标** | 「让所有人都能把握最佳花见时机」——利己且利他 |
| **低参与门槛** | 只需拍一张花蕾照片发邮件（初期）/上传报告（移动端后） |
| **即时回报** | 用户看到自己的上报被纳入预报，感受到「我的贡献有价值」 |
| **社会仪式感** | 花见是日本国民仪式，参与上报本身是对这一仪式的积极参与 |
| **持续激励** | 每年循环，用户年年参与，成为生活习惯 |

### 9.2 「用户充分享受而不知自己在贡献数据」的设计精髓

Weathernews 发言人的原话是飞轮成功的最简洁注解：

> *"Every participant is enjoying watching the sakura every day and sharing the information with others."*

这句话揭示了理想众包飞轮的关键特征：**用户的「享受行为」本身就是「数据贡献行为」，两者完全重叠，不需要任何额外动机设计。**

对比大多数 APP 要求「看广告赚积分」等强制性激励，Weathernews 的模式显然更可持续。

---

## 十、与传统气象机构的竞争关系

### 10.1 三方竞争格局（2008年日本樱花预报市场）

**Japan Times 2008年报道描述了三方并立格局：**

> *"But now the agency has some competition: the Japan Weather Association and Weathernews Inc. The pair are trying to crack into the market by giving sakura lovers more accurate and detailed predictions."*

| 机构 | 方法 | 优势 | 劣势 |
|------|------|------|------|
| 日本気象庁（官方，2009年退出） | 历史数据 + 固定观测点 | 权威性 | 精度粗，覆盖点少，无法应对政府预算削减 |
| 日本气象协会（Japan Weather Association） | 数值模型预测 | 系统化 | 缺乏本地实时数据 |
| **Weathernews（私营）** | **众包 + 数值模型** | **本地精度高，用户互动强** | 依赖用户持续参与 |

### 10.2 政府退出的「真空效应」

2009年气象厅退出，恰恰成为 Weathernews 和 JMC（Sakura Navi的开发方）的发展机遇：

- **Weathernews**：用众包数据填补空白，建立消费者口碑
- **JMC**：用「私营专业机构 + 1000个观测点」的付费 APP 模式填补空白

两家公司采用不同路线，分别占据了「免费众包」和「付费精准预报」两个市场位置。

---

## 十一、对 Pixel Herbarium 的设计映射

### 11.1 飞轮的核心逻辑对照

| Weathernews Sakura 飞轮 | Pixel Herbarium 类比飞轮 |
|------------------------|------------------------|
| 用户上报樱花开花状态 | 用户拍摄并识别植物（自动生成位置标记） |
| 数据汇聚成地点级精准预报 | 数据汇聚成城市植物热力图 |
| 精准预报吸引更多用户 | 丰富地图吸引更多用户探索 |
| 更多上报 → 更精准 | 更多发现 → 地图更丰富 → 更多 FOMO |
| 20年历史数据成为护城河 | 用户图鉴数据库成为护城河（无法被复制） |

### 11.2 「11,200 个种子贡献者」对 Pixel Herbarium 的启示

Weathernews 的飞轮起点不是 1,300 万下载量，而是**11,200名樱花专项贡献者**。

对 Pixel Herbarium 的直接推论：

> **不需要大量用户才能让城市地图「看起来有内容」。**  
> 100-200名东京种子用户的发现记录，即可在几个核心赏樱地点形成密集热点，足以向后续用户传达「这里已经有人发现了很多东西」的视觉信号。

**种子用户 → 热点地图的最小可行路径：**

```
50名种子用户 × 平均 10次发现 = 500个植物发现点
    ↓
在3-5个核心地点（上野/新宿御苑/目黒川）形成可见热点
    ↓
热点地图截图成为社交分享内容
    ↓
新用户看到「其他人在这里发现了很多」→ FOMO → 下载
    ↓
用户增加 → 更多发现 → 更密集热点 → 飞轮加速
```

### 11.3 「参与行为即享受行为」的设计原则

Weathernews 成功的核心：参与者上报时就已经在享受花见，上报是附带动作，不需要额外奖励。

**Pixel Herbarium 版本：**

用户在花见时拍摄植物，这是他们**本来就要做**的事（65%的用户拍照是为了记录美好时刻）。Pixel Herbarium 将这个「本来就有」的行为，通过 AI 识别 + 像素生成，升华为「发现→收集→纪念」的闭环体验。

| 行为 | 传统（无 APP） | 有 Pixel Herbarium |
|------|-------------|-------------------|
| 看到美丽植物 | 拍照 → 存相册 → 可能遗忘 | 拍照 → 识别 → 像素化 → 加入图鉴 → 永久纪念 |
| 与朋友分享 | 发给微信群 → 快速刷过 | 生成 9:16 像素海报 → Instagram Story → 病毒传播 |
| 记录「我来过这里」 | 无机制 | 城市地图留下发现痕迹 → 印章 |

### 11.4 Virtual Hanami 对「数字延伸」的验证

Weathernews 的 Virtual Hanami 功能证明了：

> 即使无法亲临，人们仍然有「参与花见仪式」的情感需求，并愿意通过数字内容满足它。

**Pixel Herbarium 版本的数字延伸：**

- 无法当季去日本的海外用户 → 可欣赏他人分享的像素图鉴，感受「远程花见」
- 已错过满开的用户 → 可在城市地图上浏览别人的发现记录，重温花见记忆
- 非花见季节 → 可探索其他季节植物，全年保持连接感

---

## 十二、风险与局限：飞轮的脆弱点

了解 Weathernews 模式的局限，有助于 Pixel Herbarium 在设计时提前规避：

### 12.1 已知局限

| 局限 | Weathernews 的体现 | Pixel Herbarium 的预防措施 |
|------|-------------------|--------------------------|
| **季节性活跃度** | 花见季外用户大幅沉默 | 60种四季植物设计，全年保持活跃触点 |
| **地理集中性** | 核心贡献者集中在关东/关西大城市 | 先聚焦东京，渐进扩展；城市地图本身驱动城市探索 |
| **用户老化** | 早期贡献者随时间逐渐不活跃 | 新季节 + 新稀有植物持续刷新动机 |
| **数据质量参差** | 用户上报精度因人而异 | AI 识别 + 置信度评分，降低人工判断误差 |
| **全球复制困难** | 美国市场推广受阻（文化不同） | 专注日本市场深耕，再考虑跨市场 |

### 12.2 Weathernews 全球化受挫的教训

TechCrunch 报道点出了全球化的核心障碍：

> *"In the U.S., even though the market is big compared to Japan, people still don't recognize the power of crowdsourcing, especially in the weather industry."*

**对 Pixel Herbarium 的启示：** 花言葉文化层是深度本土化的核心，这既是护城河（无法被外国竞品复制），也意味着海外市场扩张需要重新设计文化层，不能直接平移。

---

## 附录：数据来源索引

| 数据点 | 原始来源 | 可信度 |
|--------|---------|--------|
| 首年 10,000+ 志愿者 | Japan Times（2008年3月15日）「Pinpointing 'sakura' arrival」 | ⭐⭐⭐⭐⭐ 档案新闻 |
| 第二年 17,831 注册参与者 | Japan Times（2008年3月15日），引用 Weathernews 发言人 Yuka Yoda | ⭐⭐⭐⭐⭐ 官方引用 |
| 11,200 名活跃上报用户 | PCWorld，引用 Weathernews 发言人（原文） | ⭐⭐⭐⭐⭐ 官方引用 |
| 700处花见地点覆盖 | PCWorld | ⭐⭐⭐⭐ |
| 1,300万次下载 | PCWorld，引用 Weathernews 官方 | ⭐⭐⭐⭐⭐ 官方 |
| 800万日本用户 | PCWorld，引用 Weathernews 官方 | ⭐⭐⭐⭐⭐ 官方 |
| 130,000条每日报告 | IGNITE（大阪数字营销机构）报告 | ⭐⭐⭐ |
| 200万条累计报告 | Japan Today / SoraNews24（2026年1月20日），引用 Weathernews 官方 | ⭐⭐⭐⭐⭐ 一手 |
| 项目第20年 | Japan Today / SoraNews24（2026年1月20日），引用 Weathernews 官方 | ⭐⭐⭐⭐⭐ 一手 |
| HBS 案例学术评价 | Harvard Business School Case 617-053（Lakhani & Kanno, 2017） | ⭐⭐⭐⭐⭐ 学术来源 |
| TechCrunch 收购报道 | TechCrunch（2015年5月20日）「Weathernews Inc Japan Acquires Weathermob」 | ⭐⭐⭐⭐⭐ 科技媒体 |
| Virtual Hanami 评测 | OtaQuest（2020年），「Bring the Sakura Trees to Your House」 | ⭐⭐⭐⭐ |
| Harvard D3 众包对比分析 | D3.harvard.edu「Tay: crowdsourcing a PR nightmare」 | ⭐⭐⭐⭐ |

---

*本文档为 Pixel Herbarium 项目内部研究文档，专项研究 Weathernews Sakura 众包飞轮机制，版本 v1.0，2026年3月。*
