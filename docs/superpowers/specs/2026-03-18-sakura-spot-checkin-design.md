# 桜スポット打卡功能设计文档

**文档日期**：2026-03-18
**状态**：Draft v4 — spec-reviewer Round 2 修订后待用户审阅
**适用版本**：v2.0（下一主版本，春季功能扩展）
**设计背景**：面向日本目标用户，结合 3月发布时机与赏樱文化，新增基于真实地点到访的印章收集玩法，深化 PH 的「在地探索」核心循环。

---

## 一、设计背景与目标

### 问题陈述
PH v1 的核心循环是「发现植物 → 收集入图鉴 → 分享」。用户通过 GPS 在任意地点发现植物，但缺乏**目的地驱动**的出行动机。日本赏花文化天然具备「スタンプラリー」（印章收集巡游）的行为土壤，但 v1 没有承接这一需求的入口。

### 设计目标
1. **新增出行动机**：让用户因为 PH 而专程前往著名赏花名所
2. **增强留存**：印章册的「X/100 訪れた」进度驱动长期回访
3. **扩大传播**：印章收集进度可通过 LINE 分享，形成社交裂变
4. **调性一致**：完全符合 PH 「Adult Kawaii」设计原则，无焦虑感

### 成功指标
- 春季（3月20日–4月30日）内，DAU 中打卡 1 次以上的占比 ≥ 20%
- 印章分享卡片生成率 ≥ 10%（触发打卡的用户中）
- 春季功能相关 App Store 关键词：「桜スポット」「花見 アプリ」覆盖前 5 位

---

## 二、用户旅程

```
用户打开地图 Tab
      ↓
切换至「桜スポット」图层
      ↓
看到附近的樱花名所 PIN 点
   ├── 金色星形 PIN = 日本さくらの会「さくら名所100選」
   └── 粉色圆形 PIN = 其他收录地点（Phase 1 扩充）
      ↓
实地前往，进入 500m 范围
      ↓
PIN 脉冲动效 + 底部浮现「打卡する」Sheet
   Sheet 内容：地点名 / 稀有度标签 / 当前开花状态 / 打卡按钮
      ↓
点击「打卡する」→ GPS 验证
      ↓ (通过)
全屏花瓣飘落动画（1.5s，ease-in-out）
      ↓
印章卡片从底部滑入展示
   ├── 普通打卡：粉色印章，sage green 边框
   ├── tags.includes('名所100選')：额外金框 + 地点专属像素画（~20处有定制画）
   └── BloomStatus='peak'（満開）期间打卡：印章附加金色光晕 + 轻微震动反馈
      ↓
提示：「図鑑のスタンプ帳に保存されました」
      ↓
图鉴 Tab → 桜スポット 视图 → 对应格子变亮
```

---

## 三、数据设计

### 3.1 新表：`sakura_spots`

> **与现有代码对齐**：SQL schema 须与 `src/types/hanami.ts::FlowerSpot` 接口和 `src/data/seasons/sakura.json` 种子数据保持一致。`FlowerSpot` 使用 4-date `BloomWindow` 模型、`category: SpotCategory`、`treeCount`、`tags` 等字段。

```sql
CREATE TABLE sakura_spots (
  id               INTEGER PRIMARY KEY,       -- FlowerSpot.id（数值型，匹配 sakura.json）
  season_id        TEXT NOT NULL DEFAULT 'sakura', -- FlowerSpot.seasonId
  name_ja          TEXT NOT NULL,             -- "上野恩賜公園"
  name_en          TEXT NOT NULL,             -- "Ueno Park"
  prefecture       TEXT NOT NULL,             -- "東京都"
  prefecture_code  INTEGER NOT NULL,          -- JIS X 0401 (01-47)
  city             TEXT NOT NULL,             -- "台東区"
  category         TEXT NOT NULL              -- SpotCategory
    CHECK (category IN ('park','river','shrine','castle','mountain','street','garden')),
  tree_count       INTEGER,                   -- 桜の本数（如 800）
  -- 4-date BloomWindow（比 2-date 更精确地映射 5 级开花状态）
  bloom_early_start TEXT,                     -- "03-20" (MM-DD) earlyStart
  bloom_peak_start  TEXT,                     -- "03-28" peakStart
  bloom_peak_end    TEXT,                     -- "04-05" peakEnd
  bloom_late_end    TEXT,                     -- "04-12" lateEnd
  lat              FLOAT NOT NULL,
  lng              FLOAT NOT NULL,
  tags             TEXT[] NOT NULL DEFAULT '{}', -- ["名所100選","夜桜","池"] 名所100選 标记用 tag
  description      TEXT,                      -- 地点描述
  custom_sprite_url TEXT,                     -- NULL = 使用模板印章
  access_note      TEXT,                      -- "JR上野駅 徒歩5分"
  sort_order       INTEGER,                   -- 印章册排列顺序
  best_time        TEXT,                      -- 最佳観賞時段（如 "日没後（ライトアップあり）"）
  facilities       TEXT[]                     -- 周辺施設（如 ["トイレ","売店","駐車場"]）
);

-- 地理列（与 discoveries.location_fuzzy 保持一致，使用 GEOGRAPHY 类型）
ALTER TABLE sakura_spots
  ADD COLUMN location GEOGRAPHY(Point, 4326)
    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED;

CREATE INDEX idx_sakura_spots_location
  ON sakura_spots USING GIST (location);
```

**与 `FlowerSpot` 类型映射**：

| SQL 列 | FlowerSpot 字段 | 说明 |
|--------|----------------|------|
| `id INTEGER` | `id: number` | 数值主键，匹配 sakura.json |
| `category TEXT` | `category: SpotCategory` | 替代原 `tier`，更通用 |
| `tags TEXT[]` | `tags: string[]` | `'名所100選'` 作为 tag 标记稀有度 |
| `bloom_early_start..bloom_late_end` | `bloomTypical: BloomWindow` | 4-date 模型 |
| `tree_count` | `treeCount` | 替代原 `sakura_count` |

**稀有度判断**：不再用 `tier = 'official_100'`，改用 `tags @> ARRAY['名所100選']`。
金色 PIN / 金框印章的条件：`spot.tags.includes('名所100選')`。

**种子数据**：直接从 `src/data/seasons/sakura.json` 导入，Phase 0 已有 100 条数据。
- **Phase 0（MVP）**：100 条，来源：日本さくらの会「さくら名所100選」（已在 sakura.json 中）
- **Phase 1（v2.1）**：扩充至 300–500，来源：OSM Overpass API + 各都道府县观光协会
- **Phase 2（持续）**：开放用户申请新增，运营审核后入库

### 3.2 新表：`spot_checkins`

```sql
CREATE TABLE spot_checkins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id         INTEGER NOT NULL REFERENCES sakura_spots(id),
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_mankai       BOOLEAN NOT NULL DEFAULT false,   -- 满開期間の打卡
  stamp_variant   TEXT NOT NULL DEFAULT 'normal'    -- 'normal' | 'mankai'
    CHECK (stamp_variant IN ('normal', 'mankai')),
  bloom_status_at_checkin TEXT                       -- 打卡時の開花状態
    CHECK (bloom_status_at_checkin IN ('pre','budding','partial','peak','falling','ended')),
  UNIQUE (user_id, spot_id)                         -- 每人每地点仅记录首次
);

-- RLS
ALTER TABLE spot_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own checkins"
  ON spot_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "checkins are publicly viewable"
  ON spot_checkins FOR SELECT USING (true);
```

### 3.3 開花状態判定（复用现有 `bloom.ts`）

> **不新建函数**：项目已有 `src/utils/bloom.ts::getBloomStatus()` 和 `src/types/hanami.ts::BloomStatus`，直接复用。

**现有 `BloomStatus` 6 级映射**（参照日本気象協会标准）：

| BloomStatus | 日本語 | 条件 | i18n key |
|-------------|--------|------|----------|
| `pre` | つぼみ（花蕾期） | `mmdd < earlyStart` | `bloom.pre` |
| `budding` | 咲き始め（初開） | `earlyStart ≤ mmdd < peakStart` | `bloom.budding` |
| `partial` | 三分咲き | 介于 budding 和 peak 之间（预留） | `bloom.partial` |
| `peak` | 満開 | `peakStart ≤ mmdd ≤ peakEnd` | `bloom.peak` |
| `falling` | 散り始め（花吹雪） | `peakEnd < mmdd ≤ lateEnd` | `bloom.falling` |
| `ended` | 見頃過ぎ | `mmdd > lateEnd` | `bloom.ended` |

**満開判定（奖励触发）**：
```typescript
import { getBloomStatus } from '@/utils/bloom';
// 満開 = BloomStatus 'peak'（peakStart ≤ 当日 ≤ peakEnd）
const isPeak = getBloomStatus(spot) === 'peak';
```

**不新建 `isMankai()` 或 `getBloomLevel()`**。
`bloom.ts` 的 `getBloomStatus()` 已基于 4-date `BloomWindow` 精确映射，无需重复实现。
`getBloomStatusColor()` 已提供每个状态的配色（与 PH theme 一致）。

### 3.4 打卡 Supabase RPC

```sql
-- 执行打卡（幂等：重复调用返回现有记录）
-- 返回 JSON 含 checkin 记录 + is_new_row 标志（用于判断是否首次打卡）
CREATE OR REPLACE FUNCTION checkin_spot(
  p_spot_id INTEGER,                 -- FlowerSpot.id（INTEGER，非 TEXT）
  p_is_peak BOOLEAN,                 -- getBloomStatus(spot) === 'peak'
  p_bloom_status TEXT DEFAULT NULL   -- BloomStatus 值（客户端传入 getBloomStatus() 结果）
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid     UUID  := auth.uid();
  v_uid_txt TEXT  := v_uid::TEXT;   -- user_quotas.user_id 是 TEXT 类型
  v_checkin spot_checkins;
  v_is_new  BOOLEAN;
BEGIN
  -- 尝试插入；利用 xmax 判断是否为新行（xmax=0 表示刚插入）
  INSERT INTO spot_checkins (user_id, spot_id, is_mankai, stamp_variant, bloom_status_at_checkin)
  VALUES (
    v_uid,
    p_spot_id,
    p_is_peak,
    CASE WHEN p_is_peak THEN 'mankai' ELSE 'normal' END,
    p_bloom_status
  )
  ON CONFLICT (user_id, spot_id) DO UPDATE
    SET checked_in_at = spot_checkins.checked_in_at   -- 不覆盖，仅触发 RETURNING
  RETURNING *, (xmax = 0) AS is_new INTO v_checkin, v_is_new;

  -- 仅首次打卡 + 満開 才给配额奖励
  IF v_is_new AND p_is_peak THEN
    -- 确保当月 quota 行存在（复用 007_create_user_quotas.sql 的 upsert 模式）
    INSERT INTO user_quotas (user_id, month, used, "limit")
    VALUES (v_uid_txt, to_char(now(), 'YYYY-MM'), 0, 5)
    ON CONFLICT (user_id, month) DO NOTHING;

    UPDATE user_quotas
    SET "limit" = "limit" + 1
    WHERE user_id = v_uid_txt                          -- 使用 TEXT 类型匹配
      AND month = to_char(now(), 'YYYY-MM');
  END IF;

  RETURN json_build_object(
    'checkin',    row_to_json(v_checkin),
    'is_new_row', v_is_new
  );
END;
$$;
```

---

## 四、UI 设计

### 4.1 地图 Tab 改动（`src/app/(tabs)/map.tsx`）

**图层切换 Toggle**（地图右上角）：
```
[ 発見ヒートマップ ]  [ 桜スポット ]
```
- 切换后重新请求 `sakura_spots` 数据（一次性，本地缓存）

**PIN 点视觉规格**：

| 状态 | 图标 | 颜色 |
|------|------|------|
| `tags.includes('名所100選')` 未打卡 | ⭐ | 灰色 (#aaa) |
| `tags.includes('名所100選')` 已打卡 | ⭐ | 金色 (#d4a017) |
| 一般名所 未打卡 | 📍 | 灰色 (#ccc) |
| 一般名所 已打卡 | 🌸 | blushPink (#f5d5d0) |

**500m 内交互**：
- 最近的未打卡 PIN 脉冲动画（scale 1.0 → 1.3 循环，duration 1200ms）
- 底部 Sheet 弹出（距离 ≤ 500m 时）：
  ```
  ┌─────────────────────────────────────┐
  │ ⭐ 上野恩賜公園        さくら名所100選 │
  │ 東京都台東区 · ソメイヨシノ 800本     │
  │ 🌸 満開  ·  🌙 日没後ライトアップあり │  ← 開花状態 + best_time
  │ 🚻 トイレ  🏪 売店                   │  ← facilities アイコン
  │ JR上野駅 徒歩5分                     │
  │ [  🌸 ここで打卡する  ]              │
  └─────────────────────────────────────┘
  ```
  - **開花状態バッジ**：`getBloomStatus()` の結果を `getBloomStatusColor()` で色付きバッジ表示
    - pre: #c0c0c0 / budding: mint #c1e8d8 / partial: skyBlue #d4e4f7 / peak: blushPink #f5d5d0 / falling: #e8a87c / ended: #c0c0c0
  - **sakura_count**：「ソメイヨシノ 800本」形式で種名の後に表示
  - **best_time / facilities**：NULL の場合は行ごと非表示（レイアウト崩れ防止）

### 4.2 打卡动效（`src/components/SpotCheckinAnimation.tsx`）

```
1. 触发 → 白色半透明覆盖层淡入（150ms）
2. 花瓣飘落：6–8 片 emoji「🌸」从屏幕顶部随机位置飘落（duration 1500ms）
3. 印章卡片从底部 spring 滑入（light elastic）：
   ┌──────────────────┐
   │   ⭐ さくら名所100選  │  ← 稀有度标签
   │   ⛩️            │  ← 定制像素画 or 模板图案
   │  吉 野 山        │
   │  奈良県吉野郡    │
   │  2026.03.28 初打卡│
   │  [ 図鑑で見る ]  │
   └──────────────────┘
4. 満開版本：`Animated.timing` 循环动画让 `borderColor` 在金色 `#d4a017` 与奶黄 `#fff8dc` 之间交替（duration 800ms loop），配合 `<LinearGradient>` 半透明金色 overlay 模拟光晕 + Haptics.impactAsync。**React Native 不支持 box-shadow 动画，勿用**
5. 3秒后自动消失 or 用户点击「図鑑で見る」跳转
```

**Reduce Motion 無障碍対応**（`AccessibilityInfo.isReduceMotionEnabled`）：
- 花瓣飘落 → 简单 opacity 淡入淡出（300ms ease-in-out），不做路径动画
- PIN 脉冲动画 → 静态高亮（border 加粗 + 颜色变化，无 scale 循环）
- spring 弹性印章滑入 → duration 200ms ease-in-out 线性动画
- 満開光晕循环 → 静态金色边框，无动态交替

**调性要点**（Adult Kawaii）：
- 无「GET!」「UNLOCKED!」等强游戏化词
- 文案使用：「〇〇の記憶が刻まれました」「初めての訪問、ありがとうございます🌸」
- 満開期间额外文案：「桜が満開の今、特別な記憶として残ります」（不用倒计时语言）

### 4.3 图鉴 Tab 改动（`src/app/(tabs)/herbarium.tsx`）

**顶部 Tab 切换**（复用现有 FilterChips 风格）：
```
[ 🌿 植物  X/240 ]  [ 🌸 桜スポット  Y/100 ]
```

**桜スポット 视图**：
- **8列网格**（`numColumns={8}`，FlatList）—— 10列在 iPhone SE (375pt) 下单格仅 34pt，图案和锁图标无法清晰显示；8列下单格 ≈ 43pt，符合 Apple HIG 最小点击区域 44pt
- 网格格子尺寸：`Math.floor((screenWidth - 32 - 7 * 4) / 8)`（含 4pt 间距），方形
- 已打卡格子：印章图案（色彩鲜明）
  - `stamp_variant === 'mankai'`：额外金色外框 + 轻微光晕
- 未打卡格子：灰色轮廓 + 🔒 图标（透明度 40%）
- 点击已打卡 → 底部 Sheet：地点名、打卡日期、开花状态、「地図で見る」按钮
- 点击未打卡 → 诗意 Hint（与植物 Hint 同风格）：
  ```
  春、〇〇の山の向こうに、
  千年の桜が静かに待っています。
  ```

**进度显示**（Sheet 头部或 Tab 内顶部）：
```
23 / 100 訪れた     ████░░░░░░░░  23%
```
（用「訪れた」不用「COLLECTED」）

### 4.4 位置権限の事前説明画面（Pre-Permission Screen）

首次进入桜スポット图层时，若用户尚未授予位置权限，展示自定义说明页（在系统原生弹窗之前）：

```
┌─────────────────────────────────────┐
│                                     │
│     📍🌸                            │
│     （地図上の桜PINイラスト）         │
│                                     │
│  現在地の桜情報をお届けします         │
│                                     │
│  現在地を使って、近くの桜スポットの    │
│  開花状況やおすすめのお花見コースを     │
│  ご案内します。                      │
│                                     │
│  位置情報は本アプリの機能提供のみに    │
│  使用され、第三者に共有されることは     │
│  ありません。                        │
│                                     │
│  [ 位置情報を許可する ]  （primary）  │
│  [ 今は使わない ]       （secondary）│
│                                     │
└─────────────────────────────────────┘
```

- **触发条件**：用户切换到桜スポット图层 + `Location.getForegroundPermissionsAsync()` 返回 `undetermined`
- **「今は使わない」选择后**：图层仍可浏览（显示所有 PIN 点），但打卡按钮不可用，提示「打卡するには位置情報が必要です」
- **i18n 键**：`sakura.permission.title` / `sakura.permission.description` / `sakura.permission.allow` / `sakura.permission.skip`
- **目标**：位置权限授权率 ≥ 65%（行业均值约 50%，Pre-Permission Screen 可提升 15%+）

---

## 五、春季加成设计

| 打卡时机 | 印章样式 | 额外奖励 | 文案 |
|---------|---------|---------|------|
| 常规打卡（非満開） | 普通版印章 | — | 「〇〇の記憶が刻まれました」 |
| BloomStatus='peak'（満開）期間打卡 | 満開版印章（金色光晕） | 当月配额 +1 | 「桜が満開の今、特別な記憶として残ります」 |

**満開期間判断**：`getBloomStatus(spot) === 'peak'`（基于 `bloom_peak_start` ≤ 当日 ≤ `bloom_peak_end`）

**季节通知**（每季 ≤ 3 次，符合 PH 推送规范）：
1. 花季开始（3月中旬）：「桜の季節がやってきました。近くのスポットを探してみましょう 🌸」
2. 近距离名所達到満開（实时触发）：「〇〇公園の桜が満開です。今週末はいかがですか？」
3. 花季结束（4月下旬）：「今年もたくさんの桜に出会えました。また来年、また咲きます 🌸」

---

## 六、社交分享 & 推广方案

### 6.1 打卡分享卡片

复用 `src/components/SharePoster.tsx` 架构，新增 `spot` 模式：

```
1080×1080px 画布
├── 上方 1/3：名所地点像素画（或 PH 默认像素樱花背景）
├── 中部：地点名（日语大字）+ 打卡日期 + 开花状态标签
├── 下方：PH Logo（右下角）
└── 満開版：金色边框
```

分享文案预填：「〇〇で、桜の記憶を残しました 🌸 #PH桜スポット」

**分享渠道**：

| 平台 | 分享格式 | 预填文案 | 技术实现 |
|------|---------|---------|---------|
| **LINE** | 图片 + 链接卡片 | 「{地点名}で、桜の記憶を残しました 🌸」 | LINE SDK `shareTargetPicker` |
| **X (Twitter)** | 图片 + 文字（≤140字） | 「{地点名}の桜、{開花状態} 🌸 #お花見 #{都道府県}桜 #PH桜スポット」 | 系统 Share Sheet |
| **Instagram** | 仅图片（跳转 IG 发布页） | —（IG 不支持预填文案） | 系统 Share Sheet |
| **系统相册** | 带 PH 水印的分享图 | — | `MediaLibrary.saveToLibraryAsync()` |

### 6.2 印章册进度分享

图鉴 Tab 顶部「分享」按钮 → 生成印章册截图（当前进度网格）：
```
今年の桜旅、23 / 100 達成！🌸
#ピクセル植物図鑑 #桜スポット
```

通过 LINE SDK `shareTargetPicker` 分享，附图。

### 6.3 ASO 优化（App Store 日语描述追加）

新增关键词：`お花見スポット` / `桜スタンプラリー` / `花見 記録` / `桜名所 コレクション` / `さくら 図鑑`

### 6.4 SNS 营销活动（运营层）

- **「100選チャレンジ」话题**：鼓励用户晒出印章册，@Pixel_Herbarium + #PH100選
- **春季 KOL 合作**：邀请日本赏花博主试用，展示名所打卡体验
- **线下二维码**（后期）：在上野、新宿御苑等热门名所附近放置立牌，扫码下载 APP

### 6.5 留評引導策略（App Store レビュー促進）

日本用户不主动留评比例高，需在正面体验后巧妙引导。

**黄金触发时机**（满足任一条件）：
- 用户完成**第 1 次**地点打卡（情感高峰）
- 用户累计打卡 ≥ **5 处**（忠诚度确认）
- 用户收到的満開通知准确命中（预测信任建立）

**禁止触发时机**：
- APP 首次启动
- 用户正在查看地图 / 导航过程中
- 用户刚遇到加载失败或错误
- 距上次弹出留评请求 < **30 天**

**留评文案**（Adult Kawaii 调性）：
```
標題：今シーズンはいかがでしたか？
本文：お花見のお役に立てていたら、
      ぜひ評価をお願いします。
      いただいたご意見は、より良い
      アプリ作りに役立てます🌸
按鈕：[ 評価する ] / [ あとで ]
```

**i18n 键**：`sakura.review.title` / `sakura.review.body` / `sakura.review.rate` / `sakura.review.later`

**目标**：留评触发后完成评分的转化率 ≥ 15%（行业均值 8–12%）

---

## 七、调性合规检查（Adult Kawaii）

| 检查项 | 设计方案 | 状态 |
|-------|---------|------|
| 无倒计时 | 満開期用「今だけ特別な記憶」，无「X天后结束」 | ✅ |
| 无红色预警 | 未打卡显示灰色轮廓，无警告色 | ✅ |
| 无 GET!/UNLOCK! | 动效文案：「〇〇の記憶が刻まれました」 | ✅ |
| 推送 ≤ 3次/季 | 春季仅 3 次：花季开始 / 満開附近提醒 / 花季结束 | ✅ |
| 季节结束语 | 4月下旬：「また来年、また咲きます 🌸」 | ✅ |
| 稀有度语言 | 用「さくら名所100選」「特別な場所」不用 LEGENDARY/RARE | ✅ |

---

## 八、文件变更清单

### 新建文件
| 文件 | 说明 |
|------|------|
| `src/components/SpotCheckinAnimation.tsx` | 打卡动效组件（花瓣飘落 + 印章卡片） |
| `src/components/SpotStampGrid.tsx` | 8 列印章册网格组件（100格 / 8列 ≈ 13行）|
| `src/components/SpotDetailSheet.tsx` | 地点详情底部 Sheet |
| `src/types/sakura.ts` | `SharePosterSpot` 接口（其他类型复用 `hanami.ts` 的 `FlowerSpot` / `CheckinRecord` / `BloomStatus`）|
| `src/components/PrePermissionScreen.tsx` | 位置権限事前説明画面 |
| `supabase/migrations/021_sakura_spots.sql` | 建表迁移（接续现有 020_add_color_meaning.sql） |
| `supabase/seed/sakura_spots_100.json` | MVP 100条种子数据 |

### 修改文件
| 文件 | 改动 |
|------|------|
| `src/app/(tabs)/map.tsx` | 新增桜スポット图层切换 + PIN 渲染 + 打卡 Sheet |
| `src/app/(tabs)/herbarium.tsx` | 顶部 Tab 切换 + 桜スポット 视图条件渲染 |
| `src/components/SharePoster.tsx` | 支持 `format: 'spot'` 的分享卡片 |
| `src/stores/sakura-store.ts`（新建） | Zustand store：spots 缓存 + Supabase 同步（详见 §8c）|
| `src/stores/checkin-store.ts`（修改） | 现有 AsyncStorage store 扩展：增加 `synced` 字段同步状态 |

---

## 八b、补充规范（spec-reviewer 修订项）

### B1. SharePoster 集成方案

> **现有 `SharePoster.tsx`** 使用 `format: 'story' | 'line'` + `plant: SharePosterPlant` props。
> 打卡分享需新增 `format: 'spot'` 变体。

**修改 `SharePosterProps`**：
```typescript
// 新增 spot 数据接口
export interface SharePosterSpot {
  spot_id: number;          // FlowerSpot.id
  name_ja: string;
  name_en: string;
  prefecture: string;
  checked_in_at: string;    // ISO 8601
  stamp_variant: 'normal' | 'mankai';
  bloom_status: BloomStatus;
  custom_sprite_url?: string;
  is100sen: boolean;        // tags.includes('名所100選')
}

// 扩展 props union
export type SharePosterProps =
  | { format: 'story' | 'line'; plant: SharePosterPlant; discoveryDate?: string; discoveryCity?: string }
  | { format: 'spot'; spot: SharePosterSpot };
```

**`format: 'spot'` 布局**（1080×1080px / 渲染尺寸 360×360）：
- 背景渐变：`sakura` season 的 themeColor → accentColor（`#e8a5b0` → `#f5d5d0`）
- 中央：名所像素画（custom_sprite_url）或默认樱花 emoji
- 下方：地点名（日语大字）+ 打卡日期 + 開花状態バッジ
- 右下角：PH Logo
- 満開版：金色 accent strip（`#d4a017`）替代默认 themeColor

### B1b. Store 关系说明（`checkin-store.ts` vs `sakura-store.ts`）

**现有 `checkin-store.ts`**：Phase 1 实现，AsyncStorage 本地存储，`CheckinRecord` 包含 `photoUri`/`composedUri`/`templateId`/`synced` 字段。用于**拍照打卡**（用户在任意地点拍摄花照片，生成纪念卡片）。

**新建 `sakura-store.ts`**：本 spec 引入，管理**地点打卡**（到访特定名所后 GPS 验证打卡）。数据源为 Supabase `spot_checkins` 表。

| 维度 | `checkin-store.ts` | `sakura-store.ts` |
|------|-------------------|-------------------|
| 存储 | AsyncStorage（本地优先） | Supabase（服务器优先） |
| 触发 | 用户拍照 | GPS 到达 500m 范围 |
| 数据 | photoUri, composedUri, templateId | spot_id, bloom_status, stamp_variant |
| 离线 | 完全支持（本地存储） | 需要网络（RPC 调用） |
| 同步 | `synced` 标志，后台上传 | 实时写入 Supabase |

**离线策略**：若网络不可用，暂存打卡请求到 AsyncStorage 队列，下次有网络时自动重试 RPC。UI 乐观更新（先显示成功，后台同步）。

### B2. 空状态（Phase 0 种子数据未加载时）

**地图 Tab — 桜スポット 图层为空时**：
```
中央显示提示卡片（与植物空状态风格一致）：
「まだ桜スポットのデータを準備中です。
  春が来たら、ここに花の地図が広がります 🌸」
```

**图鉴 Tab — 桜スポット 视图 0/0 时**：
```
与植物图鉴 ListEmptyComponent 同位置：
「桜の旅はまだ始まっていません。
  地図を開いて、最初のスポットを探してみましょう。」
[地図を開く] ボタン → navigate to Map Tab
```

### B3. 日语文案格式规范

**全角标点**：所有面向用户的日语文本使用全角标点，禁止半角混用。
```
✅ 正確：（）「」……  →  「桜が満開です。お花見に行きましょう🌸」
❌ 禁止：()「」...    →  「桜が满开です.お花見に行きましょう🌸」
```

**数字格式**：日期用日式格式，不用西式。
```
✅ 正確：3月28日（土）17:00
❌ 禁止：3/28 Saturday 5:00PM
```

**UI 宽度余量**：日语文字密度高于中文（约 1.2 倍），UI 组件须预留空间：
- 主按钮：+20% 宽度余量（如 `minWidth` 或 `paddingHorizontal`）
- Tab 标签：+15% 宽度余量
- Push 通知标题：≤ 40 字（含空格）

**翻译质量分级**：

| 级别 | 范围 | 要求 |
|------|------|------|
| **S 級** | 打卡动效文案、分享卡片文案、App Store 描述 | 母语审校 + 二审，错误率 0% |
| **A 級** | 导航标签、按钮、Push 通知、空状态文案 | 母语审校，错误率 ≤ 1% |
| **B 級** | 设置页说明、帮助文本 | 母语初译，错误率 ≤ 3% |

### B3b. i18n 键名规范

新增翻译键（`src/i18n/ja.json` + `en.json`，前缀 `sakura.*`）：

```json
{
  "sakura": {
    "layerToggle": {
      "heatmap": "発見ヒートマップ",
      "spots":   "桜スポット"
    },
    "checkinSheet": {
      "title":    "ここで打卡する",
      "button":   "打卡する",
      "distance": "{{distance}}m 先"
    },
    "stampCard": {
      "firstVisit": "初めての訪問、ありがとうございます🌸",
      "saved":      "図鑑のスタンプ帳に保存されました",
      "mankai":     "桜が満開の今、特別な記憶として残ります"
    },
    "collection": {
      "progress":   "{{count}} / {{total}} 訪れた",
      "tabLabel":   "桜スポット",
      "plantTab":   "植物",
      "hintPoem":   "春、{{prefecture}}の山の向こうに、\n桜が静かに待っています。",
      "visitDetail": "{{date}} に訪れました"
    },
    "empty": {
      "map":       "まだ桜スポットのデータを準備中です。\n春が来たら、ここに花の地図が広がります 🌸",
      "collection": "桜の旅はまだ始まっていません。\n地図を開いて、最初のスポットを探してみましょう。",
      "mapButton":  "地図を開く"
    },
    "permission": {
      "title":       "現在地の桜情報をお届けします",
      "description": "現在地を使って、近くの桜スポットの開花状況やおすすめのお花見コースをご案内します。位置情報は本アプリの機能提供のみに使用され、第三者に共有されることはありません。",
      "allow":       "位置情報を許可する",
      "skip":        "今は使わない",
      "required":    "打卡するには位置情報が必要です"
    },
    "review": {
      "title":       "今シーズンはいかがでしたか？",
      "body":        "お花見のお役に立てていたら、ぜひ評価をお願いします。いただいたご意見は、より良いアプリ作りに役立てます🌸",
      "rate":        "評価する",
      "later":       "あとで"
    },
    "share": {
      "spotCard":    "{{spotName}}で、桜の記憶を残しました 🌸",
      "twitter":     "{{spotName}}の桜、{{bloomLevel}} 🌸 #お花見 #PH桜スポット",
      "saveToAlbum": "写真を保存しました"
    },
    "season": {
      "approaching": "春の足音が近づいています",
      "firstBloom":  "各地で開花便りが届き始めました",
      "weekend":     "今週末はお花見日和です",
      "fullBloom":   "桜が満開を迎えました",
      "petals":      "はかない桜の美しさを、写真に残してみませんか",
      "end":         "今年もたくさんの桜に出会えました。また来年、また咲きます 🌸"
    }
  }
}
```

### B4. GPS 打卡距离计算说明

**关键**：500m 范围判断必须使用设备的**原始 GPS 坐标**（不使用 ±100m 模糊坐标）：

- 植物发现时的 `fuzzCoordinate()` 仅用于写入 `discoveries.location_fuzzy`（保护用户隐私）
- 打卡判断 `isWithinRadius(userRawLat, userRawLng, spot.lat, spot.lng, 500)` 使用原始坐标
- `spot_checkins` 表**不存储**用户坐标（避免隐私问题）

```typescript
// 伪代码示意
const { coords } = await Location.getCurrentPositionAsync({});
const raw = { lat: coords.latitude, lng: coords.longitude };
// ✅ 用原始坐标判断距离
if (isWithinRadius(raw, spot, 500)) {
  // show check-in sheet
}
// 打卡时不传坐标给 RPC
import { getBloomStatus } from '@/utils/bloom';
const status = getBloomStatus(spot);
await supabase.rpc('checkin_spot', {
  p_spot_id: spot.id,
  p_is_peak: status === 'peak',
  p_bloom_status: status,
});
```

### B5. 満開通知触发机制

使用已有的 `pg_cron` 扩展（`001_enable_extensions.sql` 中已启用）：

```sql
-- 每天 06:00 JST（= 21:00 UTC 前一天）检查当日进入 bloom 的地点
-- 给附近 5km 内有过打卡历史的用户发送 Push
SELECT cron.schedule(
  'check-bloom-notifications',
  '0 21 * * *',  -- 每天 UTC 21:00 = JST 06:00
  $$
    SELECT net.http_post(
      url := current_setting('app.edge_function_url') || '/notify-bloom',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
      body := '{}'::jsonb
    );
  $$
);
```

Edge Function `notify-bloom` 逻辑：
1. 查找今日进入 `bloom_start` 的 `sakura_spots`
2. 查找在该地点 5km 内有过 `spot_checkins` 或 `discoveries` 的活跃用户
3. 通过 Supabase Push API 发送通知（每用户每地点每年最多 1 次）
4. 记录发送日志，避免重复推送

---

## 九、验证方案

1. **种子数据**：执行 `pnpm supabase db seed`，验证 100 条 `sakura_spots` 正确入库，坐标精度 ≤ 20m
2. **打卡流程**：Expo Go 走完 Map → 切换图层 → 靠近 → 打卡 → 动效 → 图鉴更新全流程
3. **満開加成**：手动修改 `bloom_peak_start`/`bloom_peak_end` 涵盖今日，验证：
   - `getBloomStatus(spot) === 'peak'` → `is_mankai: true` 写入 DB
   - `user_quotas.limit` +1（首次打卡才触发，重复打卡不重复加）
   - 印章样式切换为満開版（`stamp_variant = 'mankai'`）
4. **重复打卡幂等**：同一用户同一地点打卡两次，DB 记录数量不变（UNIQUE 约束）
5. **调性审查**：所有面向用户的文案过一遍 Adult Kawaii 检查清单
6. **Jest 测试**：
   - 现有 `getBloomStatus()` 测试已覆盖（`src/utils/__tests__/bloom.test.ts`），无需新增重复测试
   - `checkin_spot()` RPC 幂等性测试（同一 user+spot 两次调用，DB 行数不变）
   - `user_quotas` upsert：首次打卡（峰期）→ limit+1；重复打卡 → limit 不变
   - 印章进度计算 `checked / total` 正确性
   - RLS：只能查看/操作自己的 checkins
7. **性能**：FlatList 8×? 网格（100/8 ≈ 13行）在 iPhone SE 上无掉帧，`removeClippedSubviews={true}`
8. **Reduce Motion**：开启系统「减少动态效果」后，花瓣飘落替换为 opacity 淡入，脉冲替换为静态高亮
9. **WCAG 对比度**：所有開花状態バッジ文字对比度 ≥ 4.5:1（使用 Stark 或 Colour Contrast Analyser 扫描）
10. **文字截断检查**：iPhone SE (375pt) 上所有日语文本无截断（特别是打卡 Sheet、印章详情 Sheet）
11. **Pre-Permission Screen**：首次进入桜スポット图层时正确弹出；选择「今は使わない」后打卡按钮禁用
12. **留评引导**：首次打卡后 → 留评弹窗触发；30 天内不重复弹出

---

*最后更新：2026-03-18 | Round 1：3C+4M+5m 修复 | 本地化调整：+8项 | Round 2：3C+4M+7m 全部修复（对齐 hanami.ts/bloom.ts Phase 1 代码）| Round 2 收尾：spot_id TEXT→INTEGER、format 命名统一*
