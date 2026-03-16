-- Cold-start seed discoveries for map visualization on launch day.
-- Creates a system bot user and 30 discoveries across Tokyo/Osaka/Kyoto.
-- Sakura (cherry blossom) locations prioritized.
-- GPS coordinates are real landmark locations with ~100m fuzzing applied.

-- Step 1: Create system seed user (used as discovery owner)
-- This runs after auth.users trigger creates the profile automatically.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system-seed@pixelherbarium.app',
  '$2a$10$placeholder',
  now(),
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Ensure profile exists
INSERT INTO profiles (id, display_name, avatar_seed)
VALUES ('00000000-0000-0000-0000-000000000001', '花図鉑ボット', 'seed-bot-avatar')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Insert seed discoveries
-- Format: user_id, plant_id, photo_url, pixel_url, location (PostGIS), location_fuzzy, city, is_public

INSERT INTO discoveries (id, user_id, plant_id, photo_url, pixel_url, location, location_fuzzy, city, is_public, created_at) VALUES

-- ============================================================
-- TOKYO (10 discoveries) — Sakura spots first
-- ============================================================

-- 🌸 新宿御苑 (Shinjuku Gyoen) — ソメイヨシノ (Yoshino Cherry, ID 1)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 1,
 'seed://tokyo/shinjuku-gyoen-sakura.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.7101 + random()*0.001, 35.6852 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.7101 + random()*0.002, 35.6852 + random()*0.002), 4326),
 '東京都新宿区', true, '2026-03-20 10:30:00+09'),

-- 🌸 上野公園 (Ueno Park) — ソメイヨシノ (Yoshino Cherry, ID 1)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 1,
 'seed://tokyo/ueno-park-sakura.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.7745 + random()*0.001, 35.7148 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.7745 + random()*0.002, 35.7148 + random()*0.002), 4326),
 '東京都台東区', true, '2026-03-22 14:15:00+09'),

-- 🌸 目黒川 (Meguro River) — ヤエザクラ (Double Cherry, ID 51 ★★★)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 51,
 'seed://tokyo/meguro-river-yaezakura.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.6981 + random()*0.001, 35.6436 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.6981 + random()*0.002, 35.6436 + random()*0.002), 4326),
 '東京都目黒区', true, '2026-04-18 11:00:00+09'),

-- チューリップ (Tulip, ID 6) — 昭和記念公園
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 6,
 'seed://tokyo/showa-kinen-tulip.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.4143 + random()*0.001, 35.7082 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.4143 + random()*0.002, 35.7082 + random()*0.002), 4326),
 '東京都立川市', true, '2026-04-05 09:45:00+09'),

-- ネモフィラ (Baby Blue Eyes, ID 28) — 日比谷公園
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 28,
 'seed://tokyo/hibiya-nemophila.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.7575 + random()*0.001, 35.6739 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.7575 + random()*0.002, 35.6739 + random()*0.002), 4326),
 '東京都千代田区', true, '2026-04-10 15:30:00+09'),

-- フジ (Wisteria, ID 31 ★★) — 亀戸天神社
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 31,
 'seed://tokyo/kameido-wisteria.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.8268 + random()*0.001, 35.6983 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.8268 + random()*0.002, 35.6983 + random()*0.002), 4326),
 '東京都江東区', true, '2026-04-25 13:00:00+09'),

-- ツツジ (Azalea, ID 39 ★★) — 根津神社
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 39,
 'seed://tokyo/nezu-azalea.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.7620 + random()*0.001, 35.7201 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.7620 + random()*0.002, 35.7201 + random()*0.002), 4326),
 '東京都文京区', true, '2026-04-15 10:00:00+09'),

-- タンポポ (Dandelion, ID 3) — 代々木公園
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 3,
 'seed://tokyo/yoyogi-dandelion.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.6950 + random()*0.001, 35.6712 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.6950 + random()*0.002, 35.6712 + random()*0.002), 4326),
 '東京都渋谷区', true, '2026-03-25 16:00:00+09'),

-- スミレ (Violet, ID 17) — 高尾山
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 17,
 'seed://tokyo/takao-violet.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.2437 + random()*0.001, 35.6254 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.2437 + random()*0.002, 35.6254 + random()*0.002), 4326),
 '東京都八王子市', true, '2026-03-30 12:00:00+09'),

-- ウメ (Japanese Plum, ID 2) — 湯島天満宮
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 2,
 'seed://tokyo/yushima-plum.jpg', NULL,
 ST_SetSRID(ST_MakePoint(139.7684 + random()*0.001, 35.7079 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(139.7684 + random()*0.002, 35.7079 + random()*0.002), 4326),
 '東京都文京区', true, '2026-02-28 11:30:00+09'),

-- ============================================================
-- OSAKA (10 discoveries) — Sakura spots first
-- ============================================================

-- 🌸 大阪城公園 (Osaka Castle Park) — ソメイヨシノ (ID 1)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 1,
 'seed://osaka/osaka-castle-sakura.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.5256 + random()*0.001, 34.6873 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.5256 + random()*0.002, 34.6873 + random()*0.002), 4326),
 '大阪市中央区', true, '2026-03-28 10:00:00+09'),

-- 🌸 造幣局 (Mint Bureau) — ヤエザクラ (Double Cherry, ID 51 ★★★)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 51,
 'seed://osaka/zouheikyoku-yaezakura.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.5228 + random()*0.001, 34.6905 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.5228 + random()*0.002, 34.6905 + random()*0.002), 4326),
 '大阪市北区', true, '2026-04-16 14:00:00+09'),

-- 🌸 万博記念公園 — ソメイヨシノ (ID 1)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 1,
 'seed://osaka/banpaku-sakura.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.5316 + random()*0.001, 34.8112 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.5316 + random()*0.002, 34.8112 + random()*0.002), 4326),
 '大阪府吹田市', true, '2026-04-01 09:30:00+09'),

-- ナノハナ (Rapeseed, ID 4) — 堺市大仙公園
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 4,
 'seed://osaka/sakai-nanohana.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.4873 + random()*0.001, 34.5631 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.4873 + random()*0.002, 34.5631 + random()*0.002), 4326),
 '大阪府堺市', true, '2026-03-20 15:00:00+09'),

-- シャクヤク (Peony, ID 33 ★★) — 長居植物園
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 33,
 'seed://osaka/nagai-peony.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.5257 + random()*0.001, 34.6136 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.5257 + random()*0.002, 34.6136 + random()*0.002), 4326),
 '大阪市東住吉区', true, '2026-05-10 11:00:00+09'),

-- パンジー (Pansy, ID 7) — 靭公園
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 7,
 'seed://osaka/utsubo-pansy.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.4893 + random()*0.001, 34.6826 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.4893 + random()*0.002, 34.6826 + random()*0.002), 4326),
 '大阪市西区', true, '2026-04-08 13:30:00+09'),

-- ハナミズキ (Dogwood, ID 8) — 御堂筋
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 8,
 'seed://osaka/midosuji-dogwood.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.5004 + random()*0.001, 34.6869 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.5004 + random()*0.002, 34.6869 + random()*0.002), 4326),
 '大阪市中央区', true, '2026-04-20 10:00:00+09'),

-- アジサイ (Hydrangea, ID 32 ★★) — 大阪府民の森
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 32,
 'seed://osaka/fumin-hydrangea.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.6524 + random()*0.001, 34.7316 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.6524 + random()*0.002, 34.7316 + random()*0.002), 4326),
 '大阪府東大阪市', true, '2026-06-15 14:00:00+09'),

-- モモ (Peach Blossom, ID 10) — 花博記念公園
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 10,
 'seed://osaka/hanahaku-peach.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.5689 + random()*0.001, 34.7244 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.5689 + random()*0.002, 34.7244 + random()*0.002), 4326),
 '大阪市鶴見区', true, '2026-03-25 11:00:00+09'),

-- シバザクラ (Moss Phlox, ID 14) — 万博記念公園
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 14,
 'seed://osaka/banpaku-phlox.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.5350 + random()*0.001, 34.8095 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.5350 + random()*0.002, 34.8095 + random()*0.002), 4326),
 '大阪府吹田市', true, '2026-04-15 15:30:00+09'),

-- ============================================================
-- KYOTO (10 discoveries) — Sakura spots first
-- ============================================================

-- 🌸 哲学の道 (Philosopher's Path) — ソメイヨシノ (ID 1)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 1,
 'seed://kyoto/tetsugaku-sakura.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.7949 + random()*0.001, 35.0225 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.7949 + random()*0.002, 35.0225 + random()*0.002), 4326),
 '京都市左京区', true, '2026-03-30 09:00:00+09'),

-- 🌸 嵐山 (Arashiyama) — ソメイヨシノ (ID 1)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 1,
 'seed://kyoto/arashiyama-sakura.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.6720 + random()*0.001, 35.0094 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.6720 + random()*0.002, 35.0094 + random()*0.002), 4326),
 '京都市右京区', true, '2026-04-02 10:30:00+09'),

-- 🌸 醍醐寺 (Daigoji) — ヤエザクラ (Double Cherry, ID 51 ★★★)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 51,
 'seed://kyoto/daigoji-yaezakura.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.8211 + random()*0.001, 34.9513 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.8211 + random()*0.002, 34.9513 + random()*0.002), 4326),
 '京都市伏見区', true, '2026-04-18 13:00:00+09'),

-- 🌸 平野神社 — サクラソウ (Japanese Primrose, ID 58 ★★★)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 58,
 'seed://kyoto/hirano-primrose.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.7326 + random()*0.001, 35.0332 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.7326 + random()*0.002, 35.0332 + random()*0.002), 4326),
 '京都市北区', true, '2026-04-20 11:00:00+09'),

-- ウメ (Japanese Plum, ID 2) — 北野天満宮
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 2,
 'seed://kyoto/kitano-plum.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.7350 + random()*0.001, 35.0319 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.7350 + random()*0.002, 35.0319 + random()*0.002), 4326),
 '京都市上京区', true, '2026-02-25 14:00:00+09'),

-- フジ (Wisteria, ID 31 ★★) — 平等院
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 31,
 'seed://kyoto/byodoin-wisteria.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.8073 + random()*0.001, 34.8892 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.8073 + random()*0.002, 34.8892 + random()*0.002), 4326),
 '京都府宇治市', true, '2026-04-28 10:00:00+09'),

-- ボタン (Tree Peony, ID 36 ★★) — 乙訓寺
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 36,
 'seed://kyoto/otokunidera-peony.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.6891 + random()*0.001, 34.9397 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.6891 + random()*0.002, 34.9397 + random()*0.002), 4326),
 '京都府長岡京市', true, '2026-04-22 09:30:00+09'),

-- カタクリ (Dogtooth Violet, ID 16) — 大原
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 16,
 'seed://kyoto/ohara-katakuri.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.8333 + random()*0.001, 35.1175 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.8333 + random()*0.002, 35.1175 + random()*0.002), 4326),
 '京都市左京区', true, '2026-03-28 12:00:00+09'),

-- レンギョウ (Forsythia, ID 12) — 京都府立植物園
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 12,
 'seed://kyoto/botanical-forsythia.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.7630 + random()*0.001, 35.0504 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.7630 + random()*0.002, 35.0504 + random()*0.002), 4326),
 '京都市左京区', true, '2026-03-22 15:00:00+09'),

-- ミツバツツジ (Three-leaf Azalea, ID 43 ★★) — 嵯峨野
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 43,
 'seed://kyoto/sagano-azalea.jpg', NULL,
 ST_SetSRID(ST_MakePoint(135.6644 + random()*0.001, 35.0197 + random()*0.001), 4326),
 ST_SetSRID(ST_MakePoint(135.6644 + random()*0.002, 35.0197 + random()*0.002), 4326),
 '京都市右京区', true, '2026-04-05 11:30:00+09');
