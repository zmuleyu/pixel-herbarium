# PH 樱花推广策略 — 设计文档 v1.0

## Context

**为什么现在做推广策略？**
- 今天 3/19 东京樱花正式开花，满开预计 3/25-30
- PH 已完成赏花打卡核心功能（Phase 3），EAS preview build 排队中
- 樱花季是日本全年最大的自然话题窗口（Cherry Blossom Travel 搜索量 +250%）
- PH 尚未上架 App Store — 需要在上架前建立品牌认知，上架后用 UGC 驱动增长

**预期成果**：一份可执行的推广策略 spec，包含平台选择、内容模板、时间线、度量标准，以及后续需要开发的推广工具功能。

---

## 1. 战略总览：三阶段串联

```
Phase A: 内容预热（3/19 → App上架）
  目标：建立 SNS 品牌存在感，积累关注者
  核心内容：25 个赏樱名所图鉴卡片

Phase B: 打卡驱动（App上架 → 樱花季结束 ~4/10）
  目标：获得 100-200 名种子用户，验证 UGC 循环
  核心内容：用户打卡分享 CardTemplate/StampWatermark 图片

Phase C: 常青运营（4/10 → 持续）
  目标：保持全年活跃，不做"季节性 App"
  核心内容：每日花言叶 + 下一季预热（紫阳花/向日葵）
```

---

## 2. Phase A — 「桜スポット図鑑」内容预热

### 2.1 平台策略与优先级

| 优先级 | 平台 | 日活/月活 | 目标人群覆盖 | 内容格式 | 投入/回报比 |
|--------|------|-----------|-------------|---------|------------|
| 🥇 P0 | **Instagram** | 63M · 57.6%女性 | 20-35F 精准覆盖 | 方形卡片 + Stories + Reels | 最高 |
| 🥈 P1 | **X/Twitter** | 67M | 实时樱花讨论 | 线程 + 引用 + 图片 | 高 |
| 🥉 P2 | **note.com** | — | 20-35F · SEO 长尾 | 1 篇长文 | 中（一次性投入，持续收益）|
| P3 | **Pinterest** | — | 花言叶搜索 SEO | 批量上传卡片 | 低投入，长尾收益 |

**暂不投入的平台**：
- TikTok：PH 内容是静态视觉（像素卡片），不是视频原生。等 WatermarkTemplate 实现后（"照片→像素化"过程是天然短视频素材），再进入 TikTok
- LINE：Phase A 无 App → 无法引导下载 → 等 Phase B 再用 LINE 花束功能转化
- 5ch/2ch：用户画像不匹配（25-50M），跳过

### 2.2 Instagram 内容计划

**账号设置**：
- 用户名：`@hanameguri_app` 或 `@pixel_herbarium`
- Bio：`花を撮って、ピクセルアートに。近日公開 🌸`
- Bio link：预留给 App Store link（上架后替换）
- 视觉调性：cream #f5f4f1 背景 + sage #9fb69f 文字 + blush #f5d5d0 强调

**内容类型 × 频率**：

| 类型 | 频率 | 格式 | 来源 |
|------|------|------|------|
| 🌸 桜スポットカード | 每日 1 张 | 1080×1080 方形 | sakura.json 25 地点数据 |
| 📊 開花ステータス | 每日 1 条 Stories | 9:16 + 投票贴纸 | bloomTypical 数据 |
| 🎨 ピクセルアート変換 | 每周 1 条 Reels | 15秒 · 照片→像素化过程 | 模拟器录屏 |
| 🌿 花言葉カード | 每周 2 张 | 1080×1080 | 植物花言叶数据 |

**桜スポットカード 内容模板**：

```
━━━━━━━━━━━━━━━━━━━━━━━━
        🌸  花めぐり
━━━━━━━━━━━━━━━━━━━━━━━━

   上野恩賜公園
   Ueno Park

   🌳 約800本
   📍 東京・台東区
   📅 見頃：3月28日〜4月5日ごろ

   花言葉：精神の美・優美

━━━━━━━━━━━━━━━━━━━━━━━━
   花図鉑 — Pixel Herbarium
━━━━━━━━━━━━━━━━━━━━━━━━
```

**Caption 模板**：
```
🌸 {nameJa}（{prefecture}・{city}）

{treeCount}本の桜が咲く{category}。{tags から特徴文}。

🌿 花言葉：{hanakotoba}
📅 見頃：{peakStart}〜{peakEnd}ごろ

花めぐり — 花を撮って、ピクセルアートに変えるアプリ。近日公開。

#桜 #お花見 #桜スポット #花めぐり #ピクセルアート #花言葉 #{city}桜 #桜2026
```

**発信スケジュール（25 地点 × 地域 × 開花時期順）**：

| 日付 | 地点 | 理由 |
|------|------|------|
| 3/19 | 上野恩賜公園（東京） | 東京開花日 = 最大話題性 |
| 3/20 | 新宿御苑（東京） | earlyStart 3/22 |
| 3/21 | 目黒川（東京） | 夜桜タグ = IG映え |
| 3/22 | 千鳥ヶ淵（東京） | 名所100選 + ボート |
| 3/23 | 隅田公園（東京） | スカイツリーコラボ |
| 3/24 | 高遠城址公園（長野） | タカトオコヒガンザクラ |
| 3/25 | 名古屋城（愛知） | 名古屋開花 3/17 |
| 3/26 | 河津町（静岡） | 河津桜（早咲き） |
| 3/27 | 身延山久遠寺（山梨） | しだれ桜 |
| 3/28 | 嵐山（京都） | 京都開花 3/23 |
| 3/29 | 醍醐寺（京都） | 「花見 = 醍醐の花見」|
| 3/30 | 哲学の道（京都） | ソメイヨシノのトンネル |
| 3/31 | 大阪城公園（大阪） | 大阪満開 3/31 |
| 4/1 | 吉野山（奈良） | 3万本 · 日本最大 |
| 4/2 | 姫路城（兵庫） | 世界遺産 + 桜 |
| 4/3-7 | 東北・北海道の地点 | 遅咲き地域向け |

### 2.3 X/Twitter 内容計画

**アカウント設定**：
- ユーザー名：`@hanameguri`
- 固定ツイート：アプリ紹介 + 「近日公開」

**内容類型**：

| 類型 | 頻度 | フォーマット |
|------|------|-------------|
| 🧵 桜スポット5選スレッド | 週1 | 地域別5地点 + 画像 |
| 🌤️ 開花速報 | 毎日 | 天気サービス引用 + PH的コメント |
| 🎨 ピクセルアート紹介 | 週2 | 像素花 + 花言葉 1枚画像 |

**スレッド例**：
```
🧵 東京の桜スポット 5選 🌸
花言葉と見頃を添えて。

1/5 上野恩賜公園
約800本。名所100選。夜桜ライトアップあり。
花言葉：精神の美
📅 見頃：3/28〜4/5

[CardTemplate画像]

(2/5 〜 5/5 同形式)

すべての桜スポットを花めぐりで。
アプリ近日公開 🌿
```

### 2.4 note.com 長文記事

**1 記事のみ**（SEO 狙い、ワンショット）：

- タイトル：「全国さくら名所25選｜花言葉とピクセルアートで楽しむ花めぐり」
- 構成：
  1. 導入（花めぐりとは）
  2. 地域別 25 地点紹介（ピクセルアート画像 + 花言葉 + アクセス）
  3. 「花言葉で桜を楽しむ」コラム
  4. アプリ紹介 CTA
- SEO キーワード：「桜 名所」「花言葉 桜」「お花見 スポット」

---

## 3. Phase B — 「打卡チャレンジ」上架後 UGC 成長

### 3.1 前提条件

- App Store 提出完了（メタデータは `docs/aso/` に準備済み）
- App Store 審査通過（通常 1-3 日）
- 印章水印エディター（StampPreview）実装完了（`docs/superpowers/specs/2026-03-19-stamp-watermark-editor-design.md`）

### 3.2 プラットフォーム戦略

| 優先 | プラットフォーム | 役割 | コンバージョンパス |
|------|-----------------|------|-------------------|
| 🥇 | **Instagram** | UGC 主戦場 | 打卡カード → プロフリンク → App Store |
| 🥈 | **LINE** | 最高転換率 | 花束カード → 「このアプリ何？」→ DL |
| 🥉 | **TikTok**（機会型）| WatermarkTemplate 実装後 | 「写真→ピクセル化」Reel → 自然拡散 |

### 3.3 UGC 増殖ループ

```
ユーザーが桜スポットを訪問
  ↓
3ステップ打卡ウィザード（撮影 → 地点選択 → プレビュー）
  ↓
生成物 3 種類：
├── CardTemplate (360×480) — 写真 + 地点名 + 開花状況 + 「花めぐり」ブランド
├── StampWatermark (ユーザー写真全面) — 像素/印章/簡約 3 スタイル
└── SpotPoster (360×360) — LINE 共有用
  ↓
ユーザーが SNS に共有（ShareSheet → Instagram / LINE / X）
  ↓
友人が見る → 「これどのアプリ？」→ 「花めぐり」ブランド名で検索
  ↓
App Store 検索 → DL → 新ユーザーも打卡 → ループ
```

### 3.4 Seed User 獲得戦略

**Phase A で蓄積した IG/X フォロワーへの告知**：
```
🌸 ついにリリースしました！

花めぐり — 花を撮って、ピクセルアートに変えるアプリ。

✨ 全国25カ所の桜名所スタンプラリー
✨ 花言葉付きピクセルアート図鑑
✨ 完全無料・広告なし

[App Store リンク]

#花めぐり #PixelHerbarium
```

**初期ユーザーインセンティブ**（開発不要、運用施策）：
- IG で最初に 5 地点打卡した人を「花めぐりアンバサダー」としてストーリーズで紹介
- 満開打卡（金枠スタンプ）を IG にシェアした人をリポスト
- ユーザーの花言葉付き打卡カードをアカウントでリグラム

### 3.5 LINE 活用戦略

**花束ギフト機能（ゼロ競合）の活用**：
- 「この花をあなたに贈ります 🌸」カード → LINE で送信
- 受信者がカードをタップ → App Store リンク
- 桜シーズンは花ギフト需求が最も高い時期

**LINE OpenChat 参加（手動、低コスト）**：
- 「お花見 東京 2026」「桜情報交換」等の OpenChat に参加
- 開花情報を自然に共有（sakura.json の bloomTypical データ活用）
- 質問に対して PH コンテンツで回答

### 3.6 App Store レビュー促進

既存の設計（`competitive-insights.md` §3.5 PictureThis 参考）：
- 初回打卡完了後にレビュー促進（感情的ハイポイント）
- 5 回以上打卡後に再度促進（ロイヤリティ確認）
- 30 日に 1 回以下の頻度制限
- 文案：「今シーズンはいかがでしたか？お花見のお役に立てていたら、ぜひ評価をお願いします🌸」

---

## 4. Phase C — 「花言葉カレンダー」常青コンテンツ

### 4.1 コンテンツ移行（桜→通年）

| 時期 | メインコンテンツ | サブコンテンツ |
|------|----------------|---------------|
| 4月上旬 | 最後の桜（北海道・東北） | 「今年の花めぐり振り返り」 |
| 4月中旬 | チューリップ・藤 | 移行文案：「桜が終わっても、花は続く」 |
| 5-6月 | 紫陽花 · ネモフィラ | 梅雨×花言葉コラム |
| 7-8月 | 向日葵 · 朝顔 · 蓮 | 夏の花スポット紹介 |
| 9-11月 | コスモス · 彼岸花 · 紅葉 | 秋の花めぐり |

### 4.2 常青コンテンツフォーマット

**Instagram 毎日投稿**：
```
🌿 今日の花言葉

[ピクセルアート画像]

チューリップ（Tulip）
花言葉：博愛・思いやり

花図鉑で、あなただけの花コレクションを。

#花言葉 #今日の花 #花めぐり #ピクセルアート
```

**Pinterest 一括アップロード**：
- 240 種の花 × ピクセルアート画像
- 各ピンに花名 + 花言葉 + 「Pixel Herbarium」
- 「花言葉」検索の長尾 SEO

### 4.3 季節宣伝テキスト更新

App Store のプロモーションテキスト（審査不要で随時変更可能）：

| 時期 | テキスト | 出典 |
|------|---------|------|
| 3-4月 | 🌸 桜の季節が始まりました… | `app-store-metadata-ja.md` に記載済み |
| 5-6月 | 🌿 雨の季節に咲く花を探しに… | 同上 |
| 7-8月 | ☀️ 夏の花を集めよう… | 同上 |
| 9-11月 | 🍂 秋の草花を追いかけて… | 同上 |

---

## 5. 必要な開発/制作物

### 5.1 既存アセット（そのまま使える）

| アセット | ファイル | 用途 |
|---------|--------|------|
| 25 桜スポットデータ | `src/data/seasons/sakura.json` | Phase A 全内容のデータソース |
| 240 ピクセルアート sprite | Supabase Storage | Instagram/Pinterest コンテンツ |
| App Store メタデータ（日英） | `docs/aso/app-store-metadata-ja.md`, `-en.md` | App Store 提出 |
| ASO キーワード分析 | `docs/aso/keywords-analysis.md` | SNS ハッシュタグ戦略 |
| 截图方案 | `docs/app-store-prep/screenshot-plan.md` | App Store 截图 |
| 競合分析 | `docs/competitive-insights.md` | 差別化メッセージング |
| SharePoster 3 フォーマット | `src/components/SharePoster.tsx` | IG Story / LINE カード |
| CardTemplate | `src/components/templates/CardTemplate.tsx` | 打卡カード |
| ShareSheet | `src/components/ShareSheet.tsx` | シェア機能 |
| 打卡ウィザード | `src/app/(tabs)/checkin.tsx` | Phase B UGC ループ |
| 季節別宣伝テキスト | `docs/aso/app-store-metadata-ja.md` | Phase C 更新 |

### 5.2 新規制作物（Phase A 用、コード不要）

| 制作物 | 見積 | 優先度 | 方法 |
|--------|------|--------|------|
| Instagram アカウント作成 | 30分 | P0 | 手動 |
| X/Twitter アカウント作成 | 15分 | P1 | 手動 |
| 25 桜スポットカード画像 | 2時間 | P0 | Canva テンプレート or シミュレーター截图 |
| note.com 長文記事 | 2-3時間 | P2 | sakura.json データから執筆 |
| 1-2 本 Reels（ピクセル化過程）| 1時間 | P1 | シミュレーター画面録画 |

**カード画像の制作方法（2 択）**：

**方法 A: Canva テンプレート（推奨）**
- PH 配色（cream #f5f4f1 / sage #9fb69f / blush #f5d5d0）でテンプレ作成
- sakura.json データを手動で流し込み
- 25 枚を一括書き出し
- 利点：PH ブランドカラー完全再現 + 高速

**方法 B: シミュレーター截图**
- Expo iOS Simulator で App を起動
- 各地点の CardTemplate 画面を截图
- 利点：App 内表示と完全一致
- 欠点：シミュレーター環境構築が必要

### 5.3 新規開発物（Phase B 用）

| 機能 | 優先度 | 依存 | 見積 |
|------|--------|------|------|
| App Store 提出 | P0 | EAS production build | 3-4時間 |
| StampPreview（印章水印） | P1 | spec 済み → 実装のみ | 6-8時間 |
| 「チャレンジ進捗」シェア画像 | P2 | SpotStampGrid 既存 | 2-3時間 |
| ブルーム通知 Edge Function | P3 | notify stub 既存 | 2-3時間 |

### 5.4 将来開発（Phase C 以降）

| 機能 | 説明 | 時期 |
|------|------|------|
| TikTok 向け「変換過程」動画生成 | WatermarkTemplate 上で「写真→ピクセル化」アニメーション | 夏季 |
| ASO A/B テスト | スクリーンショット/キーワード最適化 | ローンチ 1 ヶ月後 |
| インフルエンサー連携 | 花/自然系 IG アカウントへのサンプル提供 | DAU 安定後 |

---

## 6. 成果指標（KPI）

### Phase A 指標（内容预热期）

| 指標 | 目標 | 計測方法 |
|------|------|---------|
| IG フォロワー | 200+ by 満開期 | Instagram Insights |
| X フォロワー | 100+ by 満開期 | X Analytics |
| スポットカード合計インプレッション | 10,000+ | IG + X 合算 |
| note.com 記事 PV | 500+ 初月 | note.com ダッシュボード |
| DM/コメント「アプリいつ出る？」 | 10+ 件 | 手動カウント |

### Phase B 指標（UGC 成長期）

| 指標 | 目標 | 計測方法 |
|------|------|---------|
| 初週ダウンロード | 50-100 | App Store Connect |
| DAU（桜ピーク期） | 20-30 | Supabase ログ |
| 打卡/日 | 5-10 | spot_checkins テーブル |
| シェア率（打卡→SNS共有） | 30%+ | ShareSheet イベントログ |
| LINE 花束送信数 | 20+/週 | bouquets テーブル |
| App Store レーティング | 4.5+ | App Store Connect |

### Phase C 指標（常青運営期）

| 指標 | 目標 | 計測方法 |
|------|------|---------|
| 月間 IG 投稿数 | 20+ | Insights |
| 非桜季 WAU | 10+ | Supabase |
| Pinterest ピン月間インプレッション | 1,000+ | Pinterest Analytics |
| 紫陽花季新規ユーザー | Phase B の 50%+ | App Store Connect |

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| App Store 審査遅延（満開に間に合わない） | Phase B 開始遅延 | Phase A コンテンツで繋ぐ + TestFlight で seed user 先行 |
| IG アルゴリズムに埋もれる | リーチ不足 | Reels 活用（動画優遇）+ ハッシュタグ戦略 |
| 打卡シェア率が低い | UGC ループ不成立 | StampWatermark 優先実装（ユーザー自身の写真 = シェア欲最大）|
| 単発開発者でコンテンツ制作が続かない | Phase C 失速 | バッチ制作（月初に 30 日分一括）+ 自動化検討 |
| 桜が予想より早く散る | Phase B 期間短縮 | 東北/北海道の遅咲きスポットで延長 |

---

## 8. ブランドガイドライン（SNS 用）

### 一貫性ルール

| 要素 | 規定 |
|------|------|
| ブランド名（日本語） | 花めぐり |
| ブランド名（英語） | Pixel Herbarium |
| ハッシュタグ | #花めぐり（必須）+ 地点名 + 季節タグ |
| 配色 | cream #f5f4f1 / sage #9fb69f / blush #f5d5d0 / text #3a3a3a |
| フォント（画像内） | 游ゴシック Medium (日) / SF Pro Display (英) |
| トーン | 温柔・詩的・焦らない — Adult Kawaii |
| 禁止事項 | カウントダウン / 赤い警告 / 「GET!」「UNLOCK!」/ 広告的な強い CTA |

### CTA テンプレート（段階別）

| フェーズ | CTA |
|---------|------|
| Phase A（未上架） | 「花めぐり — 近日公開 🌸 フォローして通知を受け取ろう」 |
| Phase B（上架後） | 「花めぐりで、あなただけの桜図鑑を。[App Store リンク]」 |
| Phase C（常青） | 「花図鉑で、花の名前と花言葉を。[App Store リンク]」 |

---

## 9. 実行チェックリスト

### 今週（3/19-3/22）— Phase A 立ち上げ [~8時間]

- [ ] Instagram アカウント作成 + プロフ設定
- [ ] X/Twitter アカウント作成 + プロフ設定
- [ ] Canva テンプレート作成（PH 配色 + レイアウト）
- [ ] 東京 5 地点カード画像制作
- [ ] Instagram 初投稿（上野恩賜公園）
- [ ] X スレッド投稿（東京桜5選）
- [ ] App Store Connect アプリ作成 + メタデータ入力開始

### 来週（3/23-3/30）— Phase A 本格運営 + App Store 提出 [~5時間]

- [ ] 毎日 1 地点カード投稿（関東 → 中部）
- [ ] 毎日 Stories 開花ステータス更新
- [ ] 週 1 Reels 投稿
- [ ] EAS production build 実行
- [ ] App Store 截图撮影 + アップロード
- [ ] App Store 審査提出

### 桜満開期（3/31-4/7）— Phase B 開始 [~3時間/週]

- [ ] App 上架告知投稿（全 SNS）
- [ ] 関西地点カード投稿（嵐山/醍醐寺/吉野山/大阪城）
- [ ] seed user 招待（IG フォロワー + 知人）
- [ ] 初期ユーザー打卡カードのリグラム/リポスト
- [ ] LINE OpenChat 参加 + 開花情報シェア

### 桜季後（4/8+）— Phase C 移行 [~2時間/週]

- [ ] note.com 記事公開
- [ ] Pinterest 一括アップロード
- [ ] IG コンテンツを花言葉カレンダーに移行
- [ ] App Store 宣伝テキスト更新（春→初夏）
- [ ] Phase B 振り返り + KPI レビュー

---

## 10. 検証方法

### コンテンツ効果検証
- Instagram Insights で投稿別リーチ/保存数を追跡
- X Analytics でスレッドインプレッション確認
- 毎週 scrapling-mcp の `ph_health_check` で競合動向モニタリング

### UGC ループ検証
- Supabase `spot_checkins` テーブルで打卡数追跡
- ShareSheet のイベントログでシェア率計算
- App Store Connect で organic vs referral DL 比率確認

### 長期検証
- 月次 `/portfolio` で PH プロジェクト健康度チェック
- 季節切替時に ASO キーワード順位確認
- 3ヶ月後にインフルエンサー連携の ROI 判断

---

## Critical Files

| ファイル | 用途 |
|---------|------|
| `D:/projects/Games/gardern/pixel-herbarium/src/data/seasons/sakura.json` | 25 地点データ（Phase A コンテンツソース）|
| `D:/projects/Games/gardern/pixel-herbarium/src/constants/theme.ts` | ブランド配色（SNS アセット制作）|
| `D:/projects/Games/gardern/pixel-herbarium/docs/aso/app-store-metadata-ja.md` | App Store メタデータ |
| `D:/projects/Games/gardern/pixel-herbarium/docs/aso/app-store-metadata-en.md` | 英語メタデータ |
| `D:/projects/Games/gardern/pixel-herbarium/docs/app-store-prep/screenshot-plan.md` | 截图方案 |
| `D:/projects/Games/gardern/pixel-herbarium/docs/app-store-prep/store-listing.md` | 提出手順 |
| `D:/projects/Games/gardern/pixel-herbarium/docs/competitive-insights.md` | 競合分析 |
| `D:/projects/Games/gardern/pixel-herbarium/docs/superpowers/specs/2026-03-19-stamp-watermark-editor-design.md` | 印章水印 spec |
| `D:/projects/Games/gardern/pixel-herbarium/src/components/SharePoster.tsx` | シェア画像生成 |
| `D:/projects/Games/gardern/pixel-herbarium/src/components/templates/CardTemplate.tsx` | 打卡カード |

---

*文档版本：v1.0 | 日期：2026-03-19 | 基于项目全文档 + 市场调研 + 竞品分析*
