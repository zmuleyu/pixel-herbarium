-- 60 Japanese summer plants seed data
-- Rarity distribution: 30x★(1), 20x★★(2), 10x★★★(3)
-- ★★★ plants have available_window set (seasonal-limited)
-- IDs auto-increment from 61 (spring plants are 1-60)

INSERT INTO plants (name_ja, name_en, name_latin, rarity, season, region, prefectures, hanakotoba, flower_meaning, bloom_months, available_window, pixel_sprite_url) VALUES

-- ============================================================
-- ★ COMMON (rarity=1) × 30
-- ============================================================
('ヒマワリ',       'Sunflower',           'Helianthus annuus',           1, '{"summer"}',            'JP', '{"全国"}',                              'あなただけを見つめる', 'Eyes Only for You',        '{7,8}',   NULL, NULL),
('アサガオ',       'Morning Glory',       'Ipomoea nil',                 1, '{"summer"}',            'JP', '{"全国"}',                              '愛情の絆',             'Bond of Love',             '{7,8,9}', NULL, NULL),
('ハス',           'Lotus',               'Nelumbo nucifera',            1, '{"summer"}',            'JP', '{"全国"}',                              '清らかな心',           'Pure Heart',               '{7,8}',   NULL, NULL),
('ユリ',           'Lily',                'Lilium longiflorum',          1, '{"summer"}',            'JP', '{"全国"}',                              '純粋',                 'Purity',                   '{7,8}',   NULL, NULL),
('ラベンダー',     'Lavender',            'Lavandula angustifolia',      1, '{"summer"}',            'JP', '{"北海道","長野","岩手"}',              '沈黙',                 'Silence',                  '{6,7,8}', NULL, NULL),
('マリーゴールド', 'Marigold',            'Tagetes erecta',              1, '{"summer"}',            'JP', '{"全国"}',                              '変わらぬ愛',           'Unchanging Love',          '{6,7,8,9}', NULL, NULL),
('ペチュニア',     'Petunia',             'Petunia × hybrida',          1, '{"summer"}',            'JP', '{"全国"}',                              'あなたと一緒にいたい', 'I Want to Be With You',    '{5,6,7,8,9}', NULL, NULL),
('サルビア',       'Scarlet Sage',        'Salvia splendens',            1, '{"summer"}',            'JP', '{"全国"}',                              '燃える心',             'Burning Heart',            '{6,7,8,9}', NULL, NULL),
('ケイトウ',       'Celosia',             'Celosia argentea',            1, '{"summer"}',            'JP', '{"全国"}',                              'おしゃれ',             'Stylish',                  '{7,8,9,10}', NULL, NULL),
('ホオズキ',       'Chinese Lantern',     'Physalis alkekengi',          1, '{"summer"}',            'JP', '{"全国"}',                              '偽り',                 'Deception',                '{7,8}',   NULL, NULL),
('フヨウ',         'Cotton Rose',         'Hibiscus mutabilis',          1, '{"summer"}',            'JP', '{"全国"}',                              'しとやか',             'Graceful',                 '{8,9,10}', NULL, NULL),
('ハイビスカス',   'Hibiscus',            'Hibiscus rosa-sinensis',      1, '{"summer"}',            'JP', '{"沖縄","鹿児島","宮崎"}',              '繊細な美',             'Delicate Beauty',          '{6,7,8,9}', NULL, NULL),
('ニチニチソウ',   'Periwinkle',          'Catharanthus roseus',         1, '{"summer"}',            'JP', '{"全国"}',                              '楽しい思い出',         'Happy Memories',           '{6,7,8,9}', NULL, NULL),
('キキョウ',       'Balloon Flower',      'Platycodon grandiflorus',     1, '{"summer"}',            'JP', '{"全国"}',                              '永遠の愛',             'Eternal Love',             '{7,8,9}', NULL, NULL),
('ナデシコ',       'Pink',                'Dianthus superbus',           1, '{"summer"}',            'JP', '{"全国"}',                              '純粋な愛',             'Pure Love',                '{6,7,8}', NULL, NULL),
('オミナエシ',     'Patrinia',            'Patrinia scabiosifolia',      1, '{"summer","autumn"}',   'JP', '{"全国"}',                              '親切',                 'Kindness',                 '{8,9}',   NULL, NULL),
('ホウセンカ',     'Garden Balsam',       'Impatiens balsamina',         1, '{"summer"}',            'JP', '{"全国"}',                              '私に触れないで',       'Don''t Touch Me',          '{7,8,9}', NULL, NULL),
('ヘチマ',         'Luffa',               'Luffa cylindrica',            1, '{"summer"}',            'JP', '{"全国"}',                              '悠々自適',             'Easygoing Life',           '{7,8}',   NULL, NULL),
('ツユクサ',       'Dayflower',           'Commelina communis',          1, '{"summer","autumn"}',   'JP', '{"全国"}',                              '尊敬',                 'Respect',                  '{6,7,8,9}', NULL, NULL),
('オシロイバナ',   'Four o''Clock',       'Mirabilis jalapa',            1, '{"summer"}',            'JP', '{"全国"}',                              '臆病',                 'Timidity',                 '{7,8,9}', NULL, NULL),
('ムクゲ',         'Rose of Sharon',      'Hibiscus syriacus',           1, '{"summer"}',            'JP', '{"全国"}',                              '信念',                 'Belief',                   '{7,8,9}', NULL, NULL),
('タチアオイ',     'Hollyhock',           'Alcea rosea',                 1, '{"summer"}',            'JP', '{"全国"}',                              '大望',                 'Ambition',                 '{6,7,8}', NULL, NULL),
('コスモス',       'Cosmos',              'Cosmos bipinnatus',           1, '{"summer","autumn"}',   'JP', '{"全国"}',                              '乙女の純真',           'Maiden''s Purity',         '{8,9,10}', NULL, NULL),
('ヒルガオ',       'Field Bindweed',      'Calystegia japonica',         1, '{"summer"}',            'JP', '{"全国"}',                              '絆',                   'Bond',                     '{6,7,8}', NULL, NULL),
('ルドベキア',     'Black-eyed Susan',    'Rudbeckia hirta',             1, '{"summer"}',            'JP', '{"全国"}',                              '正義',                 'Justice',                  '{7,8,9}', NULL, NULL),
('ジニア',         'Zinnia',              'Zinnia elegans',              1, '{"summer"}',            'JP', '{"全国"}',                              '不在の友を思う',       'Thinking of Absent Friends','{7,8,9}', NULL, NULL),
('カンナ',         'Canna',               'Canna × generalis',           1, '{"summer"}',            'JP', '{"全国"}',                              '情熱',                 'Passion',                  '{7,8,9}', NULL, NULL),
('ダリア',         'Dahlia',              'Dahlia pinnata',              1, '{"summer","autumn"}',   'JP', '{"全国"}',                              '感謝',                 'Gratitude',                '{7,8,9,10}', NULL, NULL),
('アゲラタム',     'Floss Flower',        'Ageratum houstonianum',       1, '{"summer"}',            'JP', '{"全国"}',                              '信頼',                 'Trust',                    '{6,7,8,9}', NULL, NULL),
('ノウゼンカズラ', 'Trumpet Vine',        'Campsis radicans',            1, '{"summer"}',            'JP', '{"全国"}',                              '名声',                 'Fame',                     '{7,8,9}', NULL, NULL),

-- ============================================================
-- ★★ UNCOMMON (rarity=2) × 20
-- ============================================================
('ヤマユリ',       'Gold-banded Lily',    'Lilium auratum',              2, '{"summer"}',            'JP', '{"関東","東北","近畿"}',                '荘厳',                 'Grandeur',                 '{7,8}',   NULL, NULL),
('サギソウ',       'Fringed Orchid',      'Habenaria radiata',           2, '{"summer"}',            'JP', '{"関東","近畿","九州"}',                '清純',                 'Pure Innocence',           '{7,8}',   NULL, NULL),
('ノカンゾウ',     'Day Lily',            'Hemerocallis fulva',          2, '{"summer"}',            'JP', '{"全国"}',                              '宣言',                 'Declaration',              '{7,8}',   NULL, NULL),
('ギボウシ',       'Hosta',               'Hosta sieboldiana',           2, '{"summer"}',            'JP', '{"全国"}',                              '静けさ',               'Tranquility',              '{7,8}',   NULL, NULL),
('レンゲショウマ', 'Japanese Anemone',    'Kirengeshoma palmata',        2, '{"summer","autumn"}',   'JP', '{"東北","中部","近畿"}',                '乙女の夢',             'Maiden''s Dream',          '{8,9}',   NULL, NULL),
('カワラナデシコ', 'Large Pink',          'Dianthus superbus var. longicalycinus', 2, '{"summer"}', 'JP', '{"全国"}',                              '純粋な愛',             'Pure Love',                '{6,7,8}', NULL, NULL),
('クガイソウ',     'Veronicastrum',       'Veronicastrum sibiricum',     2, '{"summer"}',            'JP', '{"北海道","東北","中部"}',              '清潔',                 'Cleanliness',              '{7,8}',   NULL, NULL),
('ヤブカンゾウ',   'Double Orange Day Lily','Hemerocallis fulva f. kwanso',2,'{"summer"}',           'JP', '{"全国"}',                              '苦しみからの解放',     'Release from Suffering',   '{7,8}',   NULL, NULL),
('ミソハギ',       'Purple Loosestrife',  'Lythrum anceps',              2, '{"summer"}',            'JP', '{"全国"}',                              '悲哀',                 'Sorrow',                   '{7,8}',   NULL, NULL),
('オカトラノオ',   'Japanese Loosestrife','Lysimachia clethroides',      2, '{"summer"}',            'JP', '{"全国"}',                              '清純な心',             'Pure-hearted',             '{6,7}',   NULL, NULL),
('ハナトラノオ',   'Virginia Physostegia','Physostegia virginiana',      2, '{"summer","autumn"}',   'JP', '{"全国"}',                              '清廉',                 'Integrity',                '{8,9}',   NULL, NULL),
('ヒゴタイ',       'Globe Thistle',       'Echinops setifer',            2, '{"summer","autumn"}',   'JP', '{"熊本","大分","宮崎"}',                '鋭敏',                 'Sharpness',                '{8,9}',   NULL, NULL),
('フシグロセンノウ','Orange Campion',     'Lychnis miqueliana',          2, '{"summer"}',            'JP', '{"本州","四国","九州"}',                '機転',                 'Wit',                      '{7,8}',   NULL, NULL),
('コオニユリ',     'Tiger Lily',          'Lilium leichtlinii',          2, '{"summer"}',            'JP', '{"全国"}',                              '誇り',                 'Pride',                    '{7,8}',   NULL, NULL),
('キツネノカミソリ','Fox Lily',           'Lycoris sanguinea',           2, '{"summer"}',            'JP', '{"本州","四国","九州"}',                '情熱',                 'Passion',                  '{7,8}',   NULL, NULL),
('ハンゲショウ',   'Lizard''s Tail',      'Saururus chinensis',          2, '{"summer"}',            'JP', '{"本州","四国","九州"}',                '内なる熱',             'Inner Heat',               '{6,7}',   NULL, NULL),
('オトギリソウ',   'St. John''s Wort',    'Hypericum erectum',           2, '{"summer"}',            'JP', '{"全国"}',                              '秘密',                 'Secret',                   '{7,8}',   NULL, NULL),
('カセンソウ',     'Inula',               'Inula salicina',              2, '{"summer"}',            'JP', '{"北海道","東北","中部"}',              '再会',                 'Reunion',                  '{7,8}',   NULL, NULL),
('センニンソウ',   'Clematis Terniflora', 'Clematis terniflora',         2, '{"summer","autumn"}',   'JP', '{"全国"}',                              '安全',                 'Safety',                   '{8,9}',   NULL, NULL),
('クルマユリ',     'Wheel Lily',          'Lilium medeoloides',          2, '{"summer"}',            'JP', '{"北海道","東北","中部"}',              '謙虚',                 'Humility',                 '{7,8}',   NULL, NULL),

-- ============================================================
-- ★★★ SEASONAL-LIMITED (rarity=3) × 10
-- Each has a narrow available_window (DATERANGE)
-- ============================================================
('タマアジサイ',   'Ball Hydrangea',      'Hydrangea involucrata',       3, '{"summer","autumn"}',   'JP', '{"関東","中部","東北"}',                '秘めた愛情',           'Hidden Affection',         '{8,9}',   '[2026-08-01,2026-09-10)', NULL),
('サワギキョウ',   'Great Blue Lobelia',  'Lobelia sessilifolia',        3, '{"summer","autumn"}',   'JP', '{"北海道","東北","中部"}',              '悪意',                 'Malice',                   '{8,9}',   '[2026-08-10,2026-09-15)', NULL),
('イワギキョウ',   'Alpine Bellflower',   'Campanula lasiocarpa',        3, '{"summer"}',            'JP', '{"北アルプス","南アルプス","北海道"}',  '感謝',                 'Gratitude',                '{7,8}',   '[2026-07-10,2026-08-20)', NULL),
('キレンゲショウマ','Yellow Kirengeshoma','Kirengeshoma palmata',        3, '{"summer","autumn"}',   'JP', '{"近畿","四国","九州"}',                '謙虚な美',             'Humble Beauty',            '{8,9}',   '[2026-08-05,2026-09-05)', NULL),
('ヒナシャジン',   'Harebell',            'Adenophora remotiflora',      3, '{"summer"}',            'JP', '{"北海道","東北","中部"}',              '清楚',                 'Modesty',                  '{7,8}',   '[2026-07-15,2026-08-15)', NULL),
('エゾスカシユリ', 'Ezo Lily',            'Lilium maculatum var. bukosanense',3,'{"summer"}',        'JP', '{"北海道","東北"}',                     '陽気',                 'Cheerfulness',             '{6,7}',   '[2026-06-20,2026-07-20)', NULL),
('チングルマ',     'Mountain Avens',      'Geum pentapetalum',           3, '{"summer"}',            'JP', '{"北アルプス","南アルプス","北海道"}',  '可憐な心',             'Delicate Heart',           '{7,8}',   '[2026-07-01,2026-08-01)', NULL),
('ハクサンフウロ', 'Hakusan Geranium',    'Geranium yessoense',          3, '{"summer"}',            'JP', '{"北陸","東北","北海道"}',              '穏やかな愛',           'Gentle Love',              '{7,8}',   '[2026-07-05,2026-08-10)', NULL),
('ニッコウキスゲ', 'Nikko Day Lily',      'Hemerocallis dumortieri',     3, '{"summer"}',            'JP', '{"日光","尾瀬","北海道"}',              '日々の楽しみ',         'Daily Pleasure',           '{7}',     '[2026-07-01,2026-07-20)', NULL),
('シモツケソウ',   'Japanese Meadowsweet','Filipendula multijuga',       3, '{"summer"}',            'JP', '{"全国"}',                              'はかない恋',           'Fleeting Romance',         '{7,8}',   '[2026-07-10,2026-08-05)', NULL);
