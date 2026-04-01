# Three-Tab UX Redesign — ホーム / 花日記 / 設定

**Date:** 2026-03-29
**Version:** v1.2 scope
**Status:** Approved for implementation planning

---

## Context

v1.1.0 (build 4) が App Store Connect に提出済み。次のイテレーションとして三つの tab の UX / ビジュアルを改善する。

**設計の出発点となった観察：**
- 樱花季即将结束 → 用户拍照动机是「封存记忆」而非「实时收集成就」
- ホーム tab に diary grid があるため、拍照入口 CTA が埋もれている
- 日記 tab は stat cards + grid のみで情感的厚みに欠ける
- 設定 tab は危険操作が分散しており、セクション分けが論理的でない
- ホーム CTA の緑色 (plantPrimary) がピンク系渐变 header と色調が衝突している

---

## 1. ホーム Tab — 拍照入口化

### 設計方針
「花を撮る」をページの主目的にする。diary grid は日記 tab に移し、ホームは行動起点に特化。

### 画面構造

```
┌─────────────────────────────┐
│  季节 header（渐变 gradient） │  ← 保留：情感锚点
│  🌸 桜シーズン               │
│  3月29日（日）               │
├─────────────────────────────┤
│  [主 CTA] 花を撮る 📷        │  ← 大块，blushPink 背景
├─────────────────────────────┤
│  [次 CTA] ライブラリから選ぶ  │  ← 行式，白底 + blushPink 描边
├─────────────────────────────┤
│  最近の記録（1件プレビュー）   │  ← 有记录时显示，点击 → 日記 tab
│  [or 欢迎文案（新用户）]      │  ← 无记录时替换此区域
└─────────────────────────────┘
```

### 色調修正
| 要素 | Before | After | 理由 |
|------|--------|-------|------|
| 主 CTA 背景 | `plantPrimary` (#9fb69f) 绿 | `blushPink` (#f5d5d0) | 与 header 同色系，不冲突 |
| 主 CTA 文字 | white | `plantPrimary` (#9fb69f) | 保持品牌色存在 |
| 次 CTA | なし | 白底 + blushPink 描边 + 玫红文字 | 层级清晰，重量轻于主 CTA |

**使用する theme tokens のみ（新色なし）：** `colors.blushPink`, `colors.plantPrimary`, `theme.accent`, `colors.white`, `colors.border`

### 新用户空状態
- 季节 header：変わらず表示（情感锚点として重要）
- 「最近の記録」エリア → 欢迎文案に差し替え：
  - Title: `最初の一枚を撮ってみましょう`
  - Sub: `お花の写真にスタンプを押して、あなただけの花日記を始めましょう 🌿`
- 主/次 CTA の位置・視覚は有記録時と完全に同一（空状態感を出さない）

### 入场動效
`useStaggeredEntry`（既存）を流用：
- index 0: 季节 header
- index 1: 主 CTA
- index 2: 次 CTA
- index 3: 最近の記録 / 欢迎文案

### 修改ファイル
- `src/app/(tabs)/home.tsx` — 全体リライト（grid 削除、CTA 2本、最近の記録プレビュー追加）

---

## 2. 花日記 Tab — 記憶アーカイブ化

### 設計方針
「回忆纪念」の场として再定位。印章 = 時間を封じ込める儀式。視覚的に「花日記の1ページ」感を出す。

### 画面構造

```
┌─────────────────────────────┐
│  季節進行バナー               │  ← 新規追加
│  2025 桜シーズン              │
│  花散り、その前に 🌸          │
│  ████████░░░░ 進行バー        │
│  あなたの桜日記 · 12枚の記録  │
├─────────────────────────────┤
│  [記録した日: 12] [スポット: 5] [最後の記録: 3/29] │ ← 3列 stats
├─────────────────────────────┤
│  わたしの花日記               │
│  ┌──────┐ ┌──────┐         │
│  │📷+水印│ │📷+水印│         │  ← 印章水印角标
│  └──────┘ └──────┘         │
│  （2列 grid，続く）          │
└─────────────────────────────┘
```

### 季節進行バナー
- **文案トーン：** 「花散り、その前に」— 焦りではなく温柔な惜别感
- **進行バー：** 現在季節の残日数 / 総日数で計算。`getActiveSeason().dateRange[0]` (start) / `dateRange[1]` (end) を参照（`"MM-DD"` 形式、年は現在年で補完）
- **背景：** `linear-gradient(135deg, #fff5f3, #f0faf5)` + blushPink 描边

### Stats 拡張
| 既存 | 追加 |
|------|------|
| 記録した日（count） | 最後の記録（最新 timestamp の MM/DD） |
| スポット数 | — |

### Grid カード — 印章水印角标
各カードの右下に、composedUri の印章スタイル色に合わせた小さな角标を重ねる：
- 内容: `{spotName} · {MM/DD}`
- 背景: `theme.accent` (季節カラー) + 85% 透明度
- フォント: 7–8px, bold
- 既存の `composedUri` 画像の上に `position: absolute` で重畳

### 盖章動效「花落墨染」— 5段階 1400ms

`PetalPressAnimation` を拡張して実装。**`expo-blur` は不使用**（Expo OTA 制約 + 未インストール）。代わりに opacity + scale で墨染質感を再現。

| 段階 | 時間 | 動作 | 実装 |
|------|------|------|------|
| ① 花落飘降 | 0–300ms | translateY: -60→0, opacity: 0→0.3, scale: 1.08→1.0 | `withSpring(stiffness:60, damping:14, mass:1.2)` |
| ② 接触圧印 | 300–500ms | scale: 1.0→0.86, haptic impactMedium | `withSpring(stiffness:200, damping:12)` |
| ③ 墨染定格 | 500–750ms | opacity: 0.3→1.0, scale: 0.86→1.04 | `withTiming(400ms, easeOut)` |
| ④ 花瓣爆散 | 550–900ms | 6枚花瓣 burst from center + radial glow fade | 既存 `PetalPressAnimation` ロジック流用 |
| ⑤ 最終落定 | 900–1400ms | scale: 1.04→1.0, onComplete callback | `withSpring(stiffness:80, damping:20)` |

**飘落パラメータ：** stiffness:60（現行より遅い）= 花びらが舞い落ちる重さ感
**花瓣 delay：** 接触から 50ms 後に爆散（先に圧す、後で散る）

### 修改ファイル
- `src/app/(tabs)/checkin.tsx` — バナー追加、stats 拡張、grid カード水印角标
- `src/components/stamps/PetalPressAnimation.tsx` — `floatFrom` prop 追加（飘落開始 Y オフセット）

---

## 3. 設定 Tab — 情報アーキテクチャ再編

### 設計方針
**機能は変えない。分組とビジュアル階層のみ変更。** 危険操作を論理的な場所に集約し、版本号を単独行から解放する。

### 新セクション構造

```
┌─────────────────────────────┐
│  App 身份カード               │  ← 新規（顶部固定）
│  🌸 Pixel Herbarium v1.1.0  │
│  桜シーズン 2025             │
├─────────────────────────────┤
│  アカウント                   │
│  ・アカウント情報 or ログイン  │
│  ・ログアウト（赤）           │  ← 旧「その他」→ ここへ移動
│  ・データを削除（赤）         │  ← 旧「データ管理」→ ここへ移動
│  ・アカウントを削除（赤）      │
├─────────────────────────────┤
│  一般                        │
│  ・言語（行内 pill 表示）     │  ← 独立 card → 行式に整合
│  ・プライバシー設定           │
│  ・使い方ガイド               │
├─────────────────────────────┤
│  サポート                    │
│  ・フィードバックを送る       │
│  ・データのエクスポート       │  ← 旧「データ管理」→ ここへ移動
└─────────────────────────────┘
```

### App 身份カード
- 季節 emoji + アプリ名 + バージョン（既存 `Constants.expoConfig?.version`）+ 現在の季節名
- 背景: `linear-gradient(135deg, theme.accent, theme.bgTint)`
- バージョン行を単独 `menuRow` から解放 → この card に統合

### 言語切換 — 行式整合
- `card` コンポーネント（独立）→ `menuRow` スタイルに変更
- 右側に現在の言語名を小 pill で表示（タップで toggle）
- 視覚的重量を他の項目と揃える

### アカウント情報（已ログイン）
- 左側：植物 emoji アバター占位（`season.iconEmoji` 流用）
- 右側：displayName + email（既存）
- アクション：tap → 何もしない（profile ページなし）or 将来の編集入口

### 危険操作の集約
| 旧位置 | 新位置 | 変更内容 |
|--------|--------|---------|
| データの削除（データ管理） | アカウント末尾 | 移動のみ |
| ログアウト（その他） | アカウント末尾 | 移動のみ |
| アカウントを削除 | アカウント末尾 | 位置変わらず |

### menuRow グループ化
iOS grouped list スタイル：同一セクション内の行を1つの `View` で囲み、上下の行の間に `borderBottom: 1px solid #f5f4f1` のみ引く。セクション全体が1つの丸角カードに見える。

### 修改ファイル
- `src/app/(tabs)/settings.tsx` — セクション再編、App 身份カード追加、言語行式化

---

## 4. 動效 / インタラクション共通仕様

| 要素 | 実装 | 備考 |
|------|------|------|
| Tab 入場 | `useStaggeredEntry`（既存） | 全 tab 統一 |
| カード tap | `PressableCard` spring scale 0.97（既存） | 全 grid カード |
| 盖章動効 | `PetalPressAnimation` 拡張（floatFrom prop） | 日記 tab のみ |
| 次 CTA タップ | `activeOpacity: 0.8`（既存） | ホーム |
| 設定 row タップ | `activeOpacity: 0.7`（既存） | 変わらず |

---

## 5. 変更しないもの

- checkin-wizard フロー（写真選択 → スポット → スタンプ → 保存）
- `StampRenderer` / `GestureStampOverlay` / `StyleSelector` / `CustomizationPanel`
- Supabase auth / データエクスポート / アカウント削除ロジック
- i18n キー（新文案は既存 key を流用 or 新 key 追加のみ）
- Expo OTA 制約（native 設定不変、`expo-blur` 不使用）

---

## 6. 新規 i18n キー（追加のみ）

| Key | ja | en |
|-----|----|----|
| `home.libraryCtaLabel` | ライブラリから選ぶ | Choose from Library |
| `home.recentRecord` | 最近の記録 | Recent Record |
| `home.goToDiary` | 日記へ | View Diary |
| `diary.seasonBannerTitle` | 花散り、その前に | Before the Petals Fall |
| `diary.seasonProgress` | あなたの桜日記 · {{count}}枚の記録 | Your Sakura Diary · {{count}} photos |
| `diary.lastRecord` | 最後の記録 | Last Record |
| `settings.appCardSeason` | {{season}} 2025 | {{season}} 2025 |

---

## Requirement Coverage

| Requirement | Section | Verification |
|-------------|---------|-------------|
| ホーム CTA 色調が header と調和 | §1 色調修正 | visual check: blushPink CTA vs gradient header |
| 新用户空状態デザイン | §1 空状態 | checkin-store history=[] でホーム表示確認 |
| 日記 tab に季節進行バナー | §2 バナー | 季節残日数が正しく計算される |
| Grid カードに印章水印角標 | §2 grid | composedUri 有無両方で表示確認 |
| 盖章「花落墨染」5段階動效 | §2 動効 | PetalPressAnimation floatFrom prop テスト |
| 設定ページ分組再編 | §3 | 全11機能が新構造に存在する |
| 危険操作がアカウント段に集約 | §3 | ログアウト・削除がアカウントセクションに表示 |
| expo-blur 未使用（OTA 制約） | §2 動効 | package.json に expo-blur なし |
