-- 60 Japanese spring plants seed data
-- Rarity distribution: 30x★(1), 20x★★(2), 10x★★★(3)
-- ★★★ plants have available_window set (seasonal-limited)

INSERT INTO plants (name_ja, name_en, name_latin, rarity, season, region, prefectures, hanakotoba, flower_meaning, bloom_months, available_window, pixel_sprite_url) VALUES

-- ============================================================
-- ★ COMMON (rarity=1) × 30
-- ============================================================
('ソメイヨシノ',   'Yoshino Cherry',      'Prunus × yedoensis',       1, '{"spring"}',       'JP', '{"東京","大阪","京都","埼玉","神奈川"}', '精神の美',   'Spiritual Beauty',    '{3,4}',   NULL, NULL),
('ウメ',           'Japanese Plum',       'Prunus mume',               1, '{"spring"}',       'JP', '{"全国"}',                             '高潔',       'Nobility',            '{2,3}',   NULL, NULL),
('タンポポ',       'Dandelion',           'Taraxacum officinale',      1, '{"spring","summer"}','JP','{"全国"}',                            '愛の神託',   'Oracle of Love',      '{3,4,5}', NULL, NULL),
('ナノハナ',       'Rapeseed Blossom',    'Brassica napus',            1, '{"spring"}',       'JP', '{"千葉","神奈川","茨城"}',             '快活',       'Cheerfulness',        '{3,4}',   NULL, NULL),
('スイセン',       'Narcissus',           'Narcissus tazetta',         1, '{"winter","spring"}','JP','{"福井","千葉","愛知"}',              '自己愛',     'Self-love',           '{1,2,3}', NULL, NULL),
('チューリップ',   'Tulip',               'Tulipa gesneriana',         1, '{"spring"}',       'JP', '{"富山","新潟","滋賀"}',              '愛の告白',   'Declaration of Love', '{3,4}',   NULL, NULL),
('パンジー',       'Pansy',               'Viola × wittrockiana',      1, '{"spring"}',       'JP', '{"全国"}',                             '思慮深さ',   'Thoughtfulness',      '{3,4,5}', NULL, NULL),
('ハナミズキ',     'Flowering Dogwood',   'Cornus florida',            1, '{"spring"}',       'JP', '{"東京","大阪","愛知"}',              '返礼',       'Return Gift',         '{4,5}',   NULL, NULL),
('コブシ',         'Kobushi Magnolia',    'Magnolia kobus',            1, '{"spring"}',       'JP', '{"北海道","東北","関東"}',            '友情',       'Friendship',          '{3,4}',   NULL, NULL),
('モモ',           'Peach Blossom',       'Prunus persica',            1, '{"spring"}',       'JP', '{"山梨","福島","岡山"}',              '恋のとりこ', 'Captive of Love',     '{3,4}',   NULL, NULL),
('ユキヤナギ',     'Spiraea',             'Spiraea thunbergii',        1, '{"spring"}',       'JP', '{"全国"}',                             '愛嬌',       'Grace',               '{3,4}',   NULL, NULL),
('レンギョウ',     'Forsythia',           'Forsythia suspensa',        1, '{"spring"}',       'JP', '{"全国"}',                             '希望',       'Hope',                '{3,4}',   NULL, NULL),
('クサノオウ',     'Celandine',           'Chelidonium majus',         1, '{"spring"}',       'JP', '{"全国"}',                             '思い出',     'Memories',            '{4,5}',   NULL, NULL),
('シバザクラ',     'Moss Phlox',          'Phlox subulata',            1, '{"spring"}',       'JP', '{"北海道","長野","埼玉"}',            '合意',       'Harmony',             '{4,5}',   NULL, NULL),
('オオイヌノフグリ','Speedwell',          'Veronica persica',          1, '{"spring"}',       'JP', '{"全国"}',                             '信頼',       'Trust',               '{2,3,4}', NULL, NULL),
('カタクリ',       'Dogtooth Violet',     'Erythronium japonicum',     1, '{"spring"}',       'JP', '{"北海道","東北","関東"}',            '初恋',       'First Love',          '{3,4}',   NULL, NULL),
('スミレ',         'Violet',              'Viola mandshurica',         1, '{"spring"}',       'JP', '{"全国"}',                             '誠実',       'Sincerity',           '{3,4}',   NULL, NULL),
('ヤマブキ',       'Japanese Kerria',     'Kerria japonica',           1, '{"spring"}',       'JP', '{"全国"}',                             '崇高',       'Nobility',            '{4,5}',   NULL, NULL),
('ハルジオン',     'Philadelphia Fleabane','Erigeron philadelphicus',  1, '{"spring"}',       'JP', '{"全国"}',                             '追想の愛',   'Nostalgic Love',      '{4,5,6}', NULL, NULL),
('アブラナ',       'Field Mustard',       'Brassica rapa',             1, '{"spring"}',       'JP', '{"全国"}',                             '快活',       'Cheerfulness',        '{3,4}',   NULL, NULL),
('シロツメクサ',   'White Clover',        'Trifolium repens',          1, '{"spring","summer"}','JP','{"全国"}',                            '幸運',       'Good Luck',           '{4,5,6}', NULL, NULL),
('ヒメオドリコソウ','Henbit Deadnettle',  'Lamium purpureum',          1, '{"spring"}',       'JP', '{"全国"}',                             '愛嬌',       'Charm',               '{3,4}',   NULL, NULL),
('セイヨウタンポポ','Common Dandelion',   'Taraxacum officinale',      1, '{"spring","summer"}','JP','{"全国"}',                            '真心の愛',   'Heartfelt Love',      '{3,4,5}', NULL, NULL),
('ヒヤシンス',     'Hyacinth',            'Hyacinthus orientalis',     1, '{"spring"}',       'JP', '{"全国"}',                             '悲しみを超えた愛','Love Beyond Sorrow','{3,4}',NULL, NULL),
('アネモネ',       'Anemone',             'Anemone coronaria',         1, '{"spring"}',       'JP', '{"全国"}',                             '儚い恋',     'Fleeting Love',       '{3,4}',   NULL, NULL),
('ムスカリ',       'Grape Hyacinth',      'Muscari armeniacum',        1, '{"spring"}',       'JP', '{"全国"}',                             '失意',       'Despair',             '{3,4}',   NULL, NULL),
('ハナダイコン',   'Dame''s Rocket',      'Hesperis matronalis',       1, '{"spring"}',       'JP', '{"全国"}',                             '競争心',     'Competitive Spirit',  '{4,5}',   NULL, NULL),
('ネモフィラ',     'Baby Blue Eyes',      'Nemophila menziesii',       1, '{"spring"}',       'JP', '{"茨城","北海道","大阪"}',            '可憐',       'Delicate Beauty',     '{4,5}',   NULL, NULL),
('キンセンカ',     'Pot Marigold',        'Calendula officinalis',     1, '{"spring"}',       'JP', '{"全国"}',                             '悲嘆',       'Grief',               '{3,4,5}', NULL, NULL),
('ノースポール',   'Crown Daisy',         'Glebionis coronaria',       1, '{"spring"}',       'JP', '{"全国"}',                             '誠実',       'Sincerity',           '{3,4,5}', NULL, NULL),

-- ============================================================
-- ★★ UNCOMMON (rarity=2) × 20
-- ============================================================
('フジ',           'Japanese Wisteria',   'Wisteria floribunda',       2, '{"spring"}',       'JP', '{"栃木","岡山","福岡"}',              '優しさ',     'Gentleness',          '{4,5}',   NULL, NULL),
('アジサイ',       'Hydrangea',           'Hydrangea macrophylla',     2, '{"summer"}',       'JP', '{"全国"}',                             '辛抱強い愛', 'Patient Love',        '{6,7}',   NULL, NULL),
('シャクヤク',     'Peony',               'Paeonia lactiflora',        2, '{"spring"}',       'JP', '{"北海道","新潟","島根"}',            '恥じらい',   'Bashfulness',         '{5,6}',   NULL, NULL),
('ライラック',     'Lilac',               'Syringa vulgaris',          2, '{"spring"}',       'JP', '{"北海道","長野"}',                   '初恋の感動', 'First Love''s Excitement','{4,5}',NULL, NULL),
('クレマチス',     'Clematis',            'Clematis patens',           2, '{"spring"}',       'JP', '{"全国"}',                             '旅人の喜び', 'Traveler''s Joy',     '{4,5,6}', NULL, NULL),
('ボタン',         'Tree Peony',          'Paeonia suffruticosa',      2, '{"spring"}',       'JP', '{"島根","愛知","奈良"}',              '王者の風格', 'Regal Bearing',       '{4,5}',   NULL, NULL),
('シャクナゲ',     'Rhododendron',        'Rhododendron japonicum',    2, '{"spring"}',       'JP', '{"長野","岐阜","高知"}',              '威厳',       'Dignity',             '{4,5}',   NULL, NULL),
('オドリコソウ',   'Deadnettle',          'Lamium album',              2, '{"spring"}',       'JP', '{"全国"}',                             '愛嬌',       'Charm',               '{4,5}',   NULL, NULL),
('ツツジ',         'Azalea',              'Rhododendron obtusum',      2, '{"spring"}',       'JP', '{"全国"}',                             '節制',       'Temperance',          '{4,5}',   NULL, NULL),
('カキツバタ',     'Rabbit-ear Iris',     'Iris laevigata',            2, '{"spring"}',       'JP', '{"愛知","京都","島根"}',              '幸運',       'Good Fortune',        '{5,6}',   NULL, NULL),
('ハナショウブ',   'Japanese Iris',       'Iris ensata',               2, '{"summer"}',       'JP', '{"東京","愛知","北海道"}',            '優雅',       'Elegance',            '{6,7}',   NULL, NULL),
('ヤマツツジ',     'Mountain Azalea',     'Rhododendron kaempferi',    2, '{"spring"}',       'JP', '{"全国"}',                             '初恋',       'First Love',          '{4,5}',   NULL, NULL),
('ミツバツツジ',   'Three-leaf Azalea',   'Rhododendron dilatatum',    2, '{"spring"}',       'JP', '{"関東","近畿","中国"}',              '喜び',       'Joy',                 '{3,4}',   NULL, NULL),
('オオヤマレンゲ', 'Mountain Magnolia',   'Magnolia sieboldii',        2, '{"spring"}',       'JP', '{"近畿","四国","九州"}',              '自然への愛', 'Love of Nature',      '{5,6}',   NULL, NULL),
('イワカガミ',     'Shortia',             'Shortia uniflora',          2, '{"spring"}',       'JP', '{"北海道","東北","中部"}',            '又逢う日まで','Until We Meet Again', '{4,5}',   NULL, NULL),
('ニリンソウ',     'Two-flowered Anemone','Anemone flaccida',          2, '{"spring"}',       'JP', '{"全国"}',                             '友情',       'Friendship',          '{4,5}',   NULL, NULL),
('キクザキイチゲ', 'Hepatica',            'Anemone pseudoaltaica',     2, '{"spring"}',       'JP', '{"北海道","東北","中部"}',            '追憶',       'Reminiscence',        '{3,4}',   NULL, NULL),
('エンレイソウ',   'Trillium',            'Trillium smallii',          2, '{"spring"}',       'JP', '{"北海道","東北","長野"}',            '奥ゆかしさ', 'Modesty',             '{4,5}',   NULL, NULL),
('ヤマブドウ',     'Wild Grape',          'Vitis coignetiae',          2, '{"spring"}',       'JP', '{"全国"}',                             '信頼',       'Trust',               '{5,6}',   NULL, NULL),
('シャガ',         'Fringed Iris',        'Iris japonica',             2, '{"spring"}',       'JP', '{"全国"}',                             '反抗',       'Resistance',          '{4,5}',   NULL, NULL),

-- ============================================================
-- ★★★ SEASONAL-LIMITED (rarity=3) × 10
-- Each has a narrow available_window (DATERANGE)
-- ============================================================
('ヤエザクラ',     'Double Cherry Blossom','Prunus serrulata',         3, '{"spring"}',       'JP', '{"東京","京都","奈良"}',              '豊かな教養', 'Rich Culture',        '{4}',     '[2026-04-15,2026-05-01)', NULL),
('キタコブシ',     'Northern Kobushi',    'Magnolia kobus var. borealis',3,'{"spring"}',      'JP', '{"北海道"}',                           '友情',       'Friendship',          '{4,5}',   '[2026-04-01,2026-04-20)', NULL),
('ヒトリシズカ',   'One-flowered Spikenard','Chloranthus japonicus',   3, '{"spring"}',       'JP', '{"全国"}',                             '隠された美', 'Hidden Beauty',       '{4,5}',   '[2026-04-10,2026-04-30)', NULL),
('クマガイソウ',   'Lady''s Slipper',     'Cypripedium japonicum',     3, '{"spring"}',       'JP', '{"本州","四国"}',                     '気まぐれな美','Capricious Beauty',   '{4,5}',   '[2026-04-20,2026-05-10)', NULL),
('シラネアオイ',   'Japanese Wood Poppy', 'Glaucidium palmatum',       3, '{"spring"}',       'JP', '{"北海道","東北","中部"}',            '完全な美',   'Perfect Beauty',      '{5}',     '[2026-05-01,2026-05-20)', NULL),
('ウバユリ',       'Giant Lily',          'Cardiocrinum cordatum',     3, '{"summer"}',       'JP', '{"全国"}',                             '純潔',       'Purity',              '{7,8}',   '[2026-07-10,2026-08-10)', NULL),
('ミズバショウ',   'Asian Skunk Cabbage', 'Lysichiton camtschatcensis',3, '{"spring"}',       'JP', '{"北海道","東北","尾瀬"}',            '美しい思い出','Beautiful Memories',  '{4,5}',   '[2026-04-01,2026-04-25)', NULL),
('サクラソウ',     'Japanese Primrose',   'Primula sieboldii',         3, '{"spring"}',       'JP', '{"埼玉","長野","北海道"}',            '初恋',       'First Love',          '{4,5}',   '[2026-04-15,2026-05-05)', NULL),
('ハクサンイチゲ', 'Alpine Anemone',      'Anemone narcissiflora',     3, '{"summer"}',       'JP', '{"北陸","東北","北海道"}',            '清らかな心', 'Pure Heart',          '{6,7}',   '[2026-06-15,2026-07-15)', NULL),
('コマクサ',       'Bleeding Heart',      'Dicentra peregrina',        3, '{"summer"}',       'JP', '{"北アルプス","南アルプス","北海道"}', '高嶺の花',  'Out of Reach',        '{7,8}',   '[2026-07-01,2026-08-15)', NULL);
