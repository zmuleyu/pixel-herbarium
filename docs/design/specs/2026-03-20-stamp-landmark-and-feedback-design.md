# 水印地标元素 + 成功反馈重构 设计文档

> **日期**: 2026-03-20
> **范围**: 水印视觉升级（地标元素融入）+ CheckinSuccessOverlay 动效重构
> **状态**: Draft

---

## Context

Pixel Herbarium 的打卡水印当前已有三种风格（Pixel/Seal/Minimal），但所有地点的水印在视觉上仅靠文字（地点名）区分，缺乏地点专属的视觉身份。参考文档（`watermark-checkin-japan-design-guide.md` + `赏樱打卡水印玩法吸引用户策略分析.md`）提出了大量视觉升级建议，但实际验证后发现：**现有的柔和风格更符合日本用户习惯，不应增加视觉重量**。

真正的升级方向是：为每个赏樱地点加入**标志性建筑/景观的像素画元素**，让每张打卡水印都有独一无二的视觉身份。同时优化 CheckinSuccessOverlay 的动效时序和再次到访体验。

### 设计原则

1. **不改变现有水印的配色和视觉重量** — 保留 `#e8a5b0` 柔和色系，不用更深的 `#D4537E`
2. **地标是「内容」而非「装饰」** — 增加信息价值，不增加视觉侵入
3. **三种风格保持各自性格** — 地标存在感递减：Pixel（强）→ Seal（中）→ Minimal（无）
4. **温柔克制** — 所有动效符合 Adult Kawaii 调性，不游戏化

---

## Part 1: 水印地标元素融入

### 1.1 方案概述（分风格差异化）

| 风格 | 地标元素形式 | 尺寸 | 位置 |
|------|------------|------|------|
| **Pixel** | 32×32px 地标像素画 | 缩略图 | 水印左侧，与文字横向排列 |
| **Seal** | 地标极简轮廓线条 | 融入 72px 圆内 | 替换当前的 emoji 花图标位置 |
| **Minimal** | **无** — 保持纯文字 | — | — |

### 1.2 Pixel 风格 — 左侧地标缩略图

**布局变化**：

```
Before (现有):
┌──────────────────────┐
│ ✿ PIXEL HERBARIUM    │
│ 上野恩賜公園          │
│ 2026.03.28 · 台東区   │
└──────────────────────┘

After (升级后):
┌──────────────────────────┐
│ ┌────┐ 上野恩賜公園      │
│ │地標│ 2026.03.28 · 台東区│
│ │32px│                    │
│ └────┘                    │
└──────────────────────────┘
```

> **变更**：① 移除「✿ PIXEL HERBARIUM」品牌行——水印是用户的「相遇证明」，不是品牌广告 ② 地标与两行文字 `alignItems: 'center'` 垂直居中，两行文字总高 ≈ 32px 图标高度，比例自然

**实现要点**：
- 地标缩略图 32×32px，背景 `#fff0f0`，边框 `1px solid #e8a5b0`，borderRadius 2px
- 与文字区域 gap 8px，flexDirection: 'row', alignItems: 'center'
- 像素画风格：低饱和度、1px 深色轮廓线、与 PH 植物像素画管线一致
- 如果地点没有对应地标素材，降级为当前布局（无缩略图，纯文字）

### 1.3 Seal 风格 → 印章风格库（用户可选多种风格）

**核心变更**：原来的 3 种固定风格（Pixel/Seal/Minimal）扩展为**印章风格库**。每种风格以地标建筑为核心元素，但融合方式不同，用户在打卡时自主选择。后续可持续新增风格。

**首批 4 种印章风格**：

| 风格 ID | 名称 | 建筑融合方式 | 核心特征 |
|---------|------|------------|---------|
| `relief` | 浮雕 | 建筑作为极淡背景暗纹，文字叠加其上 | 圆角矩形 · 类纸币暗纹 · 最克制 |
| `postcard` | 邮票 | 上半部建筑插画 + 下半部文字信息 | 齿边边框 · 旅行纪念感 · 信息最完整 |
| `medallion` | 勋章 | 圆形双环，建筑浮雕上半，文字下半 | 圆形 · 收集纪念币感 · 仪式感 |
| `window` | 花窗 | 建筑轮廓镂空白色区域 + 淡粉底文字区 | 色彩反差分区 · 最有设计感 |

> 原 Minimal 风格保留为「简约」选项（纯文字，无地标），适合不想水印太显眼的用户。
> 原 Pixel 风格升级为地标缩略图 + 文字横排布局（P1 方案），保留为「经典」选项。

**核心变更**：预制 SVG 模板 + 动态文字填充 + 用户自定义层。

### 1.3.1 用户自定义层

选择预设风格后，用户可微调以下细节：

| 自定义项 | 选项 | 默认值 |
|---------|------|--------|
| **线条颜色** | 跟随季节主题色 / 自选色盘（8 色） | 跟随季节 |
| **效果** | 无 / 淡阴影 / 柔光晕 | 无 |
| **附加文字** | 无 / 花言葉 / 自定义短句（≤12 字） | 无 |
| **装饰元素** | 无 / 花瓣散落 / 樱花枝 / 星点 | 花瓣散落 |

**设计原则**：
- 自定义面板默认折叠（「✎ カスタマイズ」按钮展开），90% 用户不需要打开
- 修改实时预览，所见即所得
- 偏好自动记忆（AsyncStorage），下次打卡沿用上次设置
- 自定义不改变 SVG 模板本身——通过叠加层（overlay）和颜色变量实现

### 1.3.2 SVG 素材制作管线

| 阶段 | 内容 | 工具 | 产出 |
|------|------|------|------|
| Phase 0 | 每种风格 1 个通用占位模板 | 手写 SVG | 代码管线跑通 |
| Phase 1 | 大阪城 POC（4 种风格） | Figma / Illustrator → 导出 SVG → react-native-svg 验证 | 确认管线可行性 |
| Phase 2 | 10 个高频地点 × 4 风格 | AI 生成初稿 + 手动微调 + 批量导出 | 40 个 SVG |
| Phase 3 | 剩余 15 个地点 | 同上 | 60 个 SVG |

> SVG 模板内颜色使用占位符（如 `currentColor`），渲染时由 react-native-svg 动态替换为季节色或用户自选色。

```
设计语言：
① 顶部轮廓 — 由地标建筑定义（城堡屋顶 / 山峰 / 鳥居 / 桥梁弧线）
② 边框曲线 — 非正圆弧，带花瓣般微小起伏，粗细微变（1.6-2px，毛笔感）
③ 花见元素 — 1-2 片极淡花瓣（opacity 0.3-0.5）半融入边框
④ 衔接过渡 — 地标与弧线用细枝/渐变连接，不硬转角
⑤ 底部花纹 — 小樱花五瓣纹样作为品牌印记
```

**SVG 模板规范**：
- viewBox: `0 0 90 96`（@2x = 180×192，适配 72-76pt 显示尺寸）
- 图层：背景填充 → 边框线条 → 地标轮廓 → 花见装饰 → 分割线 → 文字插槽
- 颜色变量跟随 `SEASON_THEMES`（sakura: `#e8a5b0` / `#f5d5d0` / `#b07878`）
- 文字插槽：`{spotName}`（#e8a5b0, 11px, bold）+ `{yearSeason}`（#b07878, 8px, mono）
- POC 模板示例：`大阪城公園`（见 `.superpowers/brainstorm/` 中的 SVG）

**分阶段素材管线**：

| 阶段 | 内容 | 产出 |
|------|------|------|
| Phase 0 | 通用占位模板（有机圆形，无地标） | 1 个通用 SVG，代码管线跑通 |
| Phase 1 | POC（大阪城 1 个地点） | 用第三方 SVG 工具设计 → 导入 APP → 验证 react-native-svg 兼容性 |
| Phase 2 | 高频 10 个地点 | AI 生成初稿 + 手动微调 |
| Phase 3 | 补全剩余 15 个 | 按打卡频率数据优先级制作 |

**降级策略**：无专属 SVG 的地点使用通用占位模板（Phase 0 产出），内部显示 emoji 花图标 + 地点名 + 年份。

**技术依赖**：需要 `react-native-svg`（POC 阶段验证兼容性）。如果兼容性有问题，降级为预渲染 PNG 方案。

### 1.4 Minimal 风格 — 不变

保持纯文字。Minimal 的选择初衷是「水印不被注意」，加入图形元素会违背这个设计意图。

### 1.5 地标素材数据结构

在 `FlowerSpot` 类型中新增可选字段：

```typescript
// src/types/hanami.ts
export interface FlowerSpot {
  // ... existing fields ...
  landmark?: {
    nameJa: string;          // "清水観音堂"
    nameEn: string;          // "Kiyomizu Kannon-dō"
    pixelArtKey?: string;    // 静态 require key（Pixel 风格用）
    outlineKey?: string;     // 静态 require key（Seal 风格用）
  };
}
```

**素材加载方式**：使用静态 `require()` 映射表（离线优先，无需网络）：

```typescript
// src/assets/landmarks/index.ts
export const LANDMARK_PIXEL_ART: Record<string, any> = {
  'ueno-kannon': require('./pixel/ueno-kannon.png'),
  'osaka-castle': require('./pixel/osaka-castle.png'),
  // ...
};
export const LANDMARK_OUTLINE: Record<string, any> = {
  'ueno-kannon': require('./outline/ueno-kannon.png'),
  'osaka-castle': require('./outline/osaka-castle.png'),
  // ...
};
```

**Stamp 组件 Props 变更**：

```typescript
// PixelStampProps 新增
landmarkPixelArt?: ImageSourcePropType;  // require() 结果

// SealStampProps 新增
landmarkOutline?: ImageSourcePropType;   // require() 结果
```

### 1.6 25 个赏樱地点的地标映射（首批）

| 地点 | 地标建筑 | 像素画 | 轮廓 |
|------|---------|--------|------|
| 上野恩賜公園 | 清水観音堂 | ✓ | ✓ |
| 大阪城公園 | 天守閣 | ✓ | ✓ |
| 目黒川 | 中目黒橋 | ✓ | ✓ |
| 哲学之道 | 銀閣寺 | ✓ | ✓ |
| 河口湖 | 富士山 | ✓ | ✓ |
| 弘前公園 | 弘前城 | ✓ | ✓ |
| 千鳥ヶ淵 | ボート乗り場 | ✓ | ✓ |
| 角館 | 武家屋敷 | ✓ | ✓ |
| 吉野山 | 金峯山寺 | ✓ | ✓ |
| 新宿御苑 | 大温室 | ✓ | ✓ |
| ... | ... | ... | ... |

> 素材生产方案：AI 生成初稿（256×256 像素画）→ 手动调整 → 缩放到 32×32 → 导出轮廓 SVG。
> 优先制作 10 个高频地点，其余逐步补充。

### 1.7 降级策略

当地点缺少地标素材时：
- **Pixel 风格**：不显示缩略图区域，回退为当前的纯文字布局
- **Seal 风格**：保留当前的 emoji 花图标（🌸🌸🌸）
- 不显示空白占位符或 placeholder

---

## Part 2: CheckinSuccessOverlay 动效重构

### 2.1 新地点 — 首次打卡时序

```
T+0ms      Toast 滑入「留めました。」       [light haptic]
T+2000ms   Toast 淡出
T+2200ms   花瓣从水印位置散出（8片）         [medium haptic]
           ← 变更：散射起点改为 stampPosition 坐标，而非屏幕中心
T+2800ms   图鉴卡弹性入场
           scale: 0.85 → 1 (spring, damping:15, stiffness:150)
           opacity: 0 → 1
           内容：🌸 + 地点名 + 「{spot}、あなたの図鑑に入りました」
T+4500ms   里程碑金色脉冲（仅 5/10/25/50/100 时触发）
           金色光晕 opacity 0.2↔0.6 脉冲 2 次后停止
           [strong haptic]
T+6000ms   底部出现「コレクションを見る →」按钮
```

### 2.2 再次到访 — 差异化时序

```
T+0ms      Toast 滑入「おかえりなさい。」    [light haptic]
T+2000ms   Toast 淡出
T+2500ms   图鉴卡温柔淡入                    ← 无花瓣散射
           opacity: 0 → 1 (timing, 600ms, easing: ease)
           ← 无 scale 弹性，只有 opacity
           内容：🌿 + 地点名 + 「おかえりなさい。去年もここに来ましたね。」
T+3200ms   小日期印章落下动效
           历年到访的年份小标签（如「2025 春」「2026 春」）
           从图鉴卡上方 translateY(-10) 落到卡片上
           每个标签错开 200ms
T+5000ms   底部出现「コレクションを見る →」按钮
```

### 2.3 关键变更点（vs 现有代码）

| 现有代码 | 变更 |
|---------|------|
| `CheckinSuccessOverlay.tsx` T+0 Toast | 保留，不变 |
| T+1200 herbarium card slide | 改为 T+2800 弹性入场（首次）或 T+2500 淡入（再次）|
| 花瓣散射从屏幕中心 | 改为从 `stampPosition` 坐标散出 |
| 再次到访仅换 emoji（🌿） | 增加「おかえりなさい」文案 + 年份印章落下动效 |
| 里程碑为独立卡片 | 改为金色光晕脉冲叠加在图鉴卡上 |
| T+4500 自动跳转 footprint | 改为 T+6000 出现按钮，用户手动跳转 |

### 2.4 Reduce Motion 处理

当 `accessibilityReduceMotion` 为 true 时：
- 花瓣散射：跳过
- 图鉴卡入场：直接 opacity fade（无 scale）
- 年份印章：直接出现（无 translateY 动画）
- 里程碑脉冲：静态金色背景（无脉冲循环）
- 所有 haptic：正常保留（haptic 不算动画）

### 2.5 自动关闭兜底

按钮出现后 15 秒无交互，自动淡出 Overlay 并跳转 footprint tab（与现有行为一致）。确保用户放下手机时不会卡在 Overlay。

### 2.6 新增 Props

```typescript
// CheckinSuccessOverlay props 新增
interface CheckinSuccessOverlayProps {
  // ... existing props ...
  stampGridPosition?: StampPosition;  // 9 宫格位置名（用于计算散射起点）
  previousVisitYears?: string[];      // 历年到访年份列表，如 ['2025 春']
}
```

**花瓣散射起点计算**：`stampGridPosition` 是 `StampPosition` 类型（字符串如 `'bottom-right'`），需要映射函数将其转换为像素坐标：

```typescript
// src/utils/stamp-position.ts
function gridPositionToCoords(
  position: StampPosition,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  const padding = STAMP_CONSTANTS.padding; // 16
  const map: Record<StampPosition, { xRatio: number; yRatio: number }> = {
    'top-left':      { xRatio: 0,   yRatio: 0 },
    'top-center':    { xRatio: 0.5, yRatio: 0 },
    'top-right':     { xRatio: 1,   yRatio: 0 },
    'middle-left':   { xRatio: 0,   yRatio: 0.5 },
    'center':        { xRatio: 0.5, yRatio: 0.5 },
    'middle-right':  { xRatio: 1,   yRatio: 0.5 },
    'bottom-left':   { xRatio: 0,   yRatio: 1 },
    'bottom-center': { xRatio: 0.5, yRatio: 1 },
    'bottom-right':  { xRatio: 1,   yRatio: 1 },
  };
  const { xRatio, yRatio } = map[position];
  return {
    x: padding + xRatio * (containerWidth - 2 * padding),
    y: padding + yRatio * (containerHeight - 2 * padding),
  };
}
```

**`previousVisitYears` 计算**：

```typescript
// src/stores/checkin-store.ts 新增方法
getPreviousVisitYears(spotId: number, currentSeasonId: string): string[] {
  const seasonLabelMap: Record<string, string> = {
    sakura: '春', ajisai: '夏', himawari: '夏',
    momiji: '秋', tsubaki: '冬',
  };
  const history = this.history.filter(r => r.spotId === spotId);
  const yearSeasons = new Set<string>();
  for (const r of history) {
    const year = new Date(r.timestamp).getFullYear();
    const label = seasonLabelMap[r.seasonId] ?? r.seasonId;
    yearSeasons.add(`${year} ${label}`);
  }
  // 排除当前这次（避免「上次你也来了」显示本次）
  const currentLabel = `${new Date().getFullYear()} ${seasonLabelMap[currentSeasonId] ?? currentSeasonId}`;
  yearSeasons.delete(currentLabel);
  return [...yearSeasons].sort();
}
```

**年份印章最大显示数**：最多显示最近 5 个年份标签。超过时显示「+N」。

### 2.7 i18n 键更新

沿用现有 i18n 键，调整文案：

```json
// src/i18n/ja.json 变更
{
  "stamp.unlockMessage": "{{spot}}、あなたの図鑑に入りました",
  "stamp.revisitMessage": "おかえりなさい。前にもここに来ましたね。"
}
```

```json
// src/i18n/en.json 变更
{
  "stamp.unlockMessage": "{{spot}} has been added to your herbarium",
  "stamp.revisitMessage": "Welcome back. You've been here before."
}
```

> 注：再次到访文案保留「前にも」（之前也）而非「去年も」（去年也），因为同年重访也应适用。

---

## 涉及文件

### 水印地标元素
| 文件 | 变更类型 |
|------|---------|
| `src/types/hanami.ts` | 新增 `landmark` 可选字段 |
| `src/data/packs/jp/seasons/sakura.json` | 添加 landmark 数据 |
| `src/components/stamps/PixelStamp.tsx` | 新增 `landmarkPixelArt` prop + 缩略图布局 |
| `src/components/stamps/SealStamp.tsx` | 新增 `landmarkOutline` prop + 轮廓替换 emoji |
| `src/components/stamps/StampPreview.tsx` | 透传 landmark props 给子 stamp 组件 |
| `src/components/stamps/MinimalStamp.tsx` | **不变** |
| `src/assets/landmarks/index.ts` | **新建** — 静态 require 映射表 |
| `src/assets/landmarks/pixel/` | **新建** — 32×32 地标像素画 PNG |
| `src/assets/landmarks/outline/` | **新建** — 18px 高地标轮廓 PNG |

### 成功反馈重构
| 文件 | 变更类型 |
|------|---------|
| `src/components/CheckinSuccessOverlay.tsx` | 时序重构 + 弹性入场 + 再次到访差异化 + 自动关闭兜底 |
| `src/stores/checkin-store.ts` | 新增 `getPreviousVisitYears(spotId, seasonId)` 方法 |
| `src/utils/stamp-position.ts` | **新建** — `gridPositionToCoords()` 映射函数 |
| `src/app/(tabs)/checkin.tsx` | 传递 stampGridPosition + previousVisitYears 给 Overlay |
| `src/i18n/ja.json` | 更新 `stamp.unlockMessage` 文案 |
| `src/i18n/en.json` | 更新 `stamp.unlockMessage` 文案 |

---

## 验证方案

1. **单元测试**：
   - PixelStamp 有/无 landmark 时的渲染差异
   - SealStamp 有/无 outlineSvg 时的降级
   - `getPreviousVisitYears()` 对多年记录的正确聚合

2. **视觉验证**：
   - 在 Expo Go 中对比升级前后的 3 种水印风格
   - 检查深色/浅色照片背景下地标像素画的可见性
   - 验证再次到访的年份印章落下动效

3. **无障碍**：
   - 开启 Reduce Motion 后确认所有降级行为正常
   - VoiceOver 可读取地标名称

4. **回归**：
   - `npx jest` 全量测试通过（当前 58 suites / 493 tests）
   - 无地标素材的地点正确降级为原有布局
