# Pixel Herbarium — 赏花打卡印章水印编辑器

## 设计文档 v1.0

> **文档范围**：打卡照片印章水印系统的交互设计、视觉规范和技术方案
>
> **设计方向**：方案 A · 邮戳叠加式（简化编辑）— 印章叠加在用户照片上
>
> **目标受众**：日本及亚洲都市女性，20–35 岁，热爱自然与生活记录
>
> **参考来源**：pixel-herbarium-photo-stamp-design.md v2.0 + 日本 App 市场调研

---

## 1. 设计定位与核心原则

### 1.1 为什么选择「邮戳叠加式」

日本 App 市场调研发现：桜のきもち / Sakura Navi 仅做纯印章收集（无照片产物），GreenSnap 无水印功能。**日本市场没有专做"赏花照片 + 地点印章"的 App** — 这是 PH 的差异化空间。

邮戳叠加式（而非明信片式）的选择理由：

1. **照片是主角，印章是点缀** — 印章占画面 5%，保持照片 95% 完整性
2. **日本印章文化天然契合** — 御朱印、駅スタンプ的数字化延伸
3. **SNS 传播价值** — 带印章的美照比明信片卡片更有分享欲
4. **品牌传播** — 像素风印章在真实照片上形成视觉反差，辨识度极高

### 1.2 核心设计原则（继承参考文档精华）

**① 情感优先于功能**
印章是「与樱花相遇的有形证明」。确认弹窗用「为这次相遇留一页」而非「打卡」。

**② 默认值即最优解**
打开编辑器时印章已叠加完毕，风格/位置/透明度均预设为最优。多数用户不需调整，直接分享。

**③ 先验证，后编辑**
GPS 位置验证在照片编辑之前，保证「当场纪念」的仪式感。

**④ 错开反馈，避免信息过载**
分享成功 Toast（0ms）→ 图鉴解锁（800ms 后）→ 里程碑（再 1s 后）。

---

## 2. 完整用户旅程

```
[接近] GPS 检测用户进入 500m 半径
  ↓
[确认] 到访确认 Bottom Sheet 弹出（已有实现：map.tsx proximity）
  ↓
[取材] 选择路径：
       ├── 📷 即时拍摄（useCheckinPhoto）
       └── 🖼️ 从相册选图（近 30 天）
  ↓
[预览] 进入印章预览页面（新 StampPreview 组件）
       ├── 照片全屏显示 + 印章已自动叠加（右下角）
       ├── 底部风格 Tab：像素 / 印章 / 简约
       └── 4 角位置指示点（点击切换）
  ↓
[分享] 点击「分享这次相遇」
       ├── LINE / Instagram / 保存到相册 / 更多
       └── ViewShot 导出合成图（原始分辨率 × pixelRatio）
  ↓
[反馈-1] Toast「保存成功」（0ms，持续 2s）
  ↓
[反馈-2] 图鉴解锁动效（800ms 后）— SpotCheckinAnimation
  ↓
[反馈-3] 里程碑提示（按需，图鉴解锁后 1s）
```

### 2.1 照片来源规则

| 条件 | 处理 |
|------|------|
| 近 30 天内拍摄 | 正常使用 |
| 超过 30 天 | 温和提示「这张照片拍于 XX 天前，确定用它记录今天的相遇吗？」允许强制使用 |
| 分辨率 < 720p | 提示「图片质量较低，导出后可能模糊」，不阻断 |

---

## 3. 印章预览页面 — 核心交互

### 3.1 页面布局

```
┌─────────────────────────────┐
│  ← 戻る    哲学の道     完了  │  ← 导航栏 44px
├─────────────────────────────┤
│                             │
│    ○                    ○   │  ← 左上/右上位置指示点
│                             │
│         用户照片全屏          │  ← 照片区域（屏幕约 70%）
│                             │
│    ○               [印章] ● │  ← 左下/右下（默认选中）
│                             │
├─────────────────────────────┤
│  [像素]  [印章]  [简约]      │  ← 3-tab 风格选择
│                             │
│  [    分享这次相遇 →    ]    │  ← 主操作按钮
└─────────────────────────────┘
```

### 3.2 位置选择（4 角快选）

| 位置 | 锚点 | 显示 |
|------|------|------|
| 左上 | top: 16, left: 16 | ○ 未选中 |
| 右上 | top: 16, right: 16 | ○ 未选中 |
| 左下 | bottom: 16, left: 16 | ○ 未选中 |
| 右下 ✦ | bottom: 16, right: 16 | ● 默认选中 |

- ✦ 系统默认位置
- 选中态：品牌粉实心圆 #D4537E + 30% 透明度光晕
- 未选中：白色半透明圆环 rgba(255,255,255,0.5)
- 切换动画：印章 280ms ease 平滑移动

### 3.3 风格选择 Tab

- 3 等宽 Tab：「像素」「印章」「简约」
- 选中态：背景 #FBEAF0, 边框 1.5px solid #D4537E, 文字 #D4537E bold
- 未选中：背景 #f8f8f8, 边框 1px solid #e0e0e0, 文字 #999
- 新用户默认选「像素」（信息量最大，品牌感最强）
- 回访用户沿用上次选择（AsyncStorage `stamp_style_preference`）
- 切换动画：旧风格淡出 + 新风格淡入，200ms ease-in-out

### 3.4 透明度与大小

**V1 不暴露调节控件**，使用固定默认值：
- 透明度：90%（像素/印章）、100%（简约，因为用 text-shadow 而非背景板）
- 大小：100%（基准尺寸，已设计为各分辨率最优）

### 3.5 分享按钮

- 渐变背景：linear-gradient(135deg, #D4537E, #e8a5b0)
- 文字：白色，13px，font-weight bold
- 圆角：12px
- 按下缩放：scale(0.96) 80ms ease-out
- 点击后弹出分享平台选择 Bottom Sheet

---

## 4. 三种印章风格规范

### 4.1 像素 Pixel

```
┌──────────────────────┐  ← 边框：2px solid themeColor
│ ✿ PIXEL HERBARIUM    │  ← 7px, monospace, letter-spacing 1px, brandDeep
│                      │
│ 哲学の道              │  ← 14px, font-weight 700, themeColor
│                      │
│ 2026.03.28 · KYOTO   │  ← 7px, monospace, brandMid
└──────────────────────┘
  背景：rgba(255,255,255,0.93)
  阴影：0 2px 6px rgba(0,0,0,0.1)
  内边距：8px 10px
```

- **字体**：monospace（保持像素感，不抗锯齿）
- **色值映射**（基于代码中的 SeasonConfig）：
  - `themeColor` = SeasonConfig.themeColor（春 #e8a5b0）
  - `brandDeep` = themeColor HSL L-20%（春约 #b0707a）— 用于品牌名小字
  - `brandMid` = themeColor HSL L-10%（春约 #cc8a95）— 用于日期/城市小字
  - 注意：印章边框和地名使用 themeColor 本身，不使用参考文档的 #D4537E

### 4.2 印章 Seal

```
      ╭─────────╮
   ╭──╯         ╰──╮
  │   哲学の道      │  ← 8px, themeColor, letter-spacing 1.5px, bold
  │    ✿  ✿  ✿    │  ← 14px, 花图标 × 3
  │    2026春      │  ← 7px, brandMid, letter-spacing 1px
   ╰──╮         ╭──╯
      ╰─────────╯
```

- **直径**：72px（@1x）
- **边框**：2.5px solid themeColor
- **背景**：rgba(255,255,255,0.90)
- **阴影**：0 2px 6px rgba(0,0,0,0.1)
- **内部文字围绕圆心排列**

### 4.3 简约 Minimal

```
║ 哲学の道            ← 13px, white 0.97, font-weight 600, text-shadow
║ Kyoto · 2026.03.28  ← 8px, white 0.78, text-shadow
```

- **左侧色边**：2.5px solid accentColor（春 #ED93B1），border-radius 1px
- **色边与文字间距**：7px
- **无背景板** — 使用 text-shadow 保证可读性
- **text-shadow**：0 1px 4px rgba(0,0,0,0.5)
- **品牌标识不出现**（刻意降低品牌感，照片为主）

### 4.4 季节色彩适配

印章色值从 `SeasonConfig` 自动获取：

印章色值从 `src/constants/seasons.ts` 的 SeasonConfig 获取。`brandDeep` 和 `brandMid` 在运行时通过 HSL 调节生成：

| 季节 | themeColor（代码中） | accentColor（代码中） | brandDeep (L-20%) | brandMid (L-10%) |
|------|-----------|-------------|-----------|----------|
| 春 · 桜 | #e8a5b0 | #f5d5d0 | 运行时计算 | 运行时计算 |

其他季节（ajisai/himawari/momiji/tsubaki）尚未在 seasons.ts 中定义完整的 themeColor/accentColor，待各季节上线时补充。

需新增工具函数 `getStampColors(themeColor: string)` → `{ brandDeep, brandMid }`，基于输入色的 HSL 值调节 Lightness。

---

## 5. 内容字段对照

| 字段 | 来源 | 像素 | 印章 | 简约 |
|------|------|:---:|:---:|:---:|
| 品牌名 `PIXEL HERBARIUM` | 固定常量 | ✓ | ✗ | ✗ |
| 地名（日文） | FlowerSpot.nameJa | ✓ | ✓ | ✓ |
| 日期 | 系统时间 `YYYY.MM.DD` | ✓ | ✗ | ✓ |
| 城市名（英文） | FlowerSpot.nameEn → 取城市部分大写（如 "Ueno Park" → "TOKYO"），需新增 `PREFECTURE_EN` 查找表 | ✓ | ✗ | ✓ |
| 年份+季节 | 系统时间 `YYYY` + 季节汉字 | ✗ | ✓ | ✗ |
| 花图标 | SeasonConfig.iconEmoji × 3 | ✗ | ✓ | ✗ |

---

## 6. 技术实现

### 6.1 组件架构

```
checkin.tsx（打卡向导）
├── Step 1: useCheckinPhoto        ← 保留不变
├── Step 2: SpotSelector           ← 保留不变
└── Step 3: StampPreview (新)      ← 替换 CardTemplate
    ├── StampOverlay (新)          ← 印章渲染容器 (position: absolute)
    │   ├── PixelStamp             ← 像素风格
    │   ├── SealStamp              ← 印章风格
    │   └── MinimalStamp           ← 简约风格
    ├── StyleSelector (新)         ← 3-tab 风格切换
    ├── PositionSelector (新)      ← 4 角位置指示点
    └── ViewShot (captureRef)      ← 复用现有
```

### 6.2 新增文件

```
src/components/stamps/StampOverlay.tsx     ← 印章渲染容器
src/components/stamps/PixelStamp.tsx       ← 像素矩形风格
src/components/stamps/SealStamp.tsx        ← 圆形印鉴风格
src/components/stamps/MinimalStamp.tsx     ← 左色边简约风格
src/components/stamps/StyleSelector.tsx    ← 3-tab 横向切换
src/components/stamps/PositionSelector.tsx ← 4 角位置指示点
src/components/stamps/StampPreview.tsx     ← Step 3 整合页面
src/components/stamps/index.ts            ← barrel export
```

### 6.3 修改文件

```
src/app/(tabs)/checkin.tsx          ← Step 3 从 CardTemplate → StampPreview
                                       移除 off-screen CardTemplate <View ref={cardRef}>
                                       移除 SCALE/PREVIEW_WIDTH/HEIGHT 常量
                                       addCheckin() 调用中 templateId 改为 stampStyle 值
src/types/hanami.ts                 ← CheckinRecord 新增 stampStyle / stampPosition 字段
src/stores/checkin-store.ts         ← addCheckin() 参数适配新字段
src/constants/theme.ts              ← 新增 stamp 色值常量
src/i18n/ja.json + en.json          ← 新增 stamp.* 前缀 i18n keys
```

### 6.4 可删除

```
src/components/templates/CardTemplate.tsx  ← 被 StampPreview 完全替代
```

### 6.5 渲染 Pipeline

```
用户照片（原始分辨率，如 4032×3024）
  ↓
ViewShot 容器（全屏宽度，照片 resizeMode="contain"）
  ↓
StampOverlay（absolute 定位，基于角落 + 16px padding）
  ↓
captureRef({ format: 'png', quality: 1 })  ← 保持与现有 handleSave 一致（PNG 无损）
  ↓
导出尺寸 = 屏幕宽度 × pixelRatio
  ↓
MediaLibrary.saveToLibraryAsync() 或 Share.share()
```

**关键决策**：印章以固定像素尺寸渲染（不随照片缩放），确保跨设备一致性。ViewShot 导出时按 pixelRatio 放大保持清晰。

### 6.6 CheckinRecord 新增字段

> 注意：`CheckinRecord` 定义在 `src/types/hanami.ts`（非 checkin-store.ts）

```typescript
// src/types/hanami.ts
interface CheckinRecord {
  // ... 现有字段保留
  stampStyle: 'pixel' | 'seal' | 'minimal';
  stampPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
```

同时更新 `checkin-store.ts` 中 `addCheckin()` 的调用签名以接受新字段。
现有的 `templateId: 'card'` 字段改为存储 stampStyle 值（`'pixel'`/`'seal'`/`'minimal'`）。

---

## 7. 动效规范

| 动效 | 时长 | 曲线 | Reduce Motion |
|------|------|------|--------------|
| 印章首次出现 | 400ms | spring(0.5, 0.9) | → 300ms opacity |
| 位置切换 | 280ms | ease | → 即时跳转 |
| 风格切换 | 200ms | ease-in-out（淡出→淡入） | → 即时切换 |
| CTA 按钮点击 | 80ms | ease-out scale(0.96) | → 保留 |
| 分享成功 Toast | 2000ms | fade-in-out | → 保留 |

印章首次出现动效细节：
- 从预设位置偏移 10px + scale(0.8) + opacity(0)
- spring 弹入到最终位置 + scale(1) + opacity(1)
- 轻微过冲效果，模拟「盖章」的物理感

---

## 8. 异常状态处理

| 场景 | 处理 |
|------|------|
| GPS 定位失败 | 允许手动选择地点（SpotSelector），不阻断流程 |
| GPS 精度不足 (>50m) | 正常打卡，内部标注 `low_accuracy` |
| 相机权限被拒 | 引导至系统设置 + 提供相册选图替代 |
| 照片超过 30 天 | 温和提示，允许强制使用 |
| 分享被目标 App 取消 | 不重置编辑器，可重新选择平台 |
| 分享失败 | 先保存到相册，提示稍后手动分享 |
| 图鉴解锁 | 不依赖分享是否成功，打卡行为完成即解锁 |

**设计原则**：不因技术误差惩罚真实到访的用户。

---

## 9. 无障碍设计

- **VoiceOver accessibilityLabel**：
  - 位置指示点：「右下角位置，当前选中」
  - 风格 Tab：「像素风格，当前选中」
  - CTA：「分享这次相遇」
- **对比度**：印章内文字 vs 白底 ≥ 4.5:1（WCAG AA）
- **触控区域**：所有可点击元素 ≥ 44×44px
- **Reduce Motion**：全部动画正确降级（见第 7 节）

---

## 10. 迭代路线图

### V1 · 2026 春季（当前目标）

- [x] 3 种印章风格（像素/印章/简约）
- [x] 4 角位置快选（默认右下）
- [x] 风格偏好记忆（AsyncStorage）
- [x] 保存相册 + 系统分享
- [x] 印章「落印」spring 动效
- [x] 季节色彩自动切换
- [x] Reduce Motion 支持
- [x] 替换 CardTemplate

### V1.5 · 2026 夏季（数据驱动优化）

- [ ] 深色照片自适应（检测角落亮度，切换印章配色）
- [ ] 分享平台排序记忆
- [ ] 满開限定印章变体（金色边框）
- [ ] 图鉴页展示「最近打卡照片」缩略图

### V2 · 2026 秋季（编辑能力扩展）

- [ ] 9 宫格位置选择器
- [ ] 透明度/大小滑块
- [ ] 双指手势拖拽
- [ ] 季节主题水印
- [ ] 印章旋转（仅 Seal）

---

## 11. 验证清单

- [ ] 3 种风格在 iPhone SE / iPhone 15 上渲染正确
- [ ] 4 角位置切换动画流畅，无布局抖动
- [ ] ViewShot 导出清晰度 ≥ 设备原生分辨率
- [ ] 印章不遮挡照片关键内容（padding 16px）
- [ ] 印章文字对比度 ≥ 4.5:1
- [ ] Reduce Motion 模式正确降级
- [ ] AsyncStorage 正确记忆风格/位置偏好
- [ ] 深色照片上 Minimal 风格可读性良好
- [ ] LINE / Instagram / 保存相册 全通
- [ ] 现有 457 tests 不 break
- [ ] 新增 stamp 组件测试覆盖

---

*文档版本：v1.0 | 日期：2026-03-19 | 基于 pixel-herbarium-photo-stamp-design.md v2.0 简化*
