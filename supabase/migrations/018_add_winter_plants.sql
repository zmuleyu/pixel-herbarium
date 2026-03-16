-- Migration 018: add 60 Japanese winter plants (IDs auto-increment from 181)
-- Rarity distribution: 30x★(1), 20x★★(2), 10x★★★(3)
-- ★★★ plants have available_window set (seasonal-limited)

INSERT INTO plants (name_ja, name_en, name_latin, rarity, season, region, prefectures, hanakotoba, flower_meaning, bloom_months, available_window, pixel_sprite_url) VALUES

-- ============================================================
-- ★ COMMON (rarity=1) × 30
-- ============================================================
('スイセン',         'Narcissus',           'Narcissus tazetta',              1, '{"winter"}', 'JP', '{"福井","千葉","愛知","長崎"}',         '自己愛',               'Self-Love',                  '{12,1,2}',    NULL, NULL),
('ウメ',             'Japanese Plum',       'Prunus mume',                    1, '{"winter"}', 'JP', '{"全国"}',                              '高潔',                 'Nobility',                   '{1,2,3}',     NULL, NULL),
('ツバキ',           'Japanese Camellia',   'Camellia japonica',              1, '{"winter"}', 'JP', '{"全国"}',                              '控えめな愛',           'Modest Love',                '{12,1,2,3}',  NULL, NULL),
('ロウバイ',         'Wintersweet',         'Chimonanthus praecox',           1, '{"winter"}', 'JP', '{"全国"}',                              '慈しみの心',           'Compassionate Heart',        '{1,2}',       NULL, NULL),
('クリスマスローズ', 'Hellebore',           'Helleborus niger',               1, '{"winter"}', 'JP', '{"全国"}',                              'なぐさめ',             'Comfort',                    '{12,1,2,3}',  NULL, NULL),
('ノースポール',     'Crown Daisy',         'Glebionis coronaria',            1, '{"winter"}', 'JP', '{"全国"}',                              '誠実',                 'Sincerity',                  '{11,12,1,2,3}', NULL, NULL),
('ビオラ',           'Viola',               'Viola × wittrockiana',           1, '{"winter"}', 'JP', '{"全国"}',                              '小さな幸福',           'Small Happiness',            '{11,12,1,2,3}', NULL, NULL),
('パンジー',         'Pansy',               'Viola tricolor',                 1, '{"winter"}', 'JP', '{"全国"}',                              'もの思い',             'Contemplation',              '{11,12,1,2,3}', NULL, NULL),
('アリッサム',       'Sweet Alyssum',       'Lobularia maritima',             1, '{"winter"}', 'JP', '{"全国"}',                              '美しさを超えた価値',   'Worth Beyond Beauty',        '{11,12,1,2,3}', NULL, NULL),
('ネメシア',         'Nemesia',             'Nemesia strumosa',               1, '{"winter"}', 'JP', '{"全国"}',                              '包み込む愛',           'Embracing Love',             '{11,12,1,2,3}', NULL, NULL),
('ストック',         'Stock',               'Matthiola incana',               1, '{"winter"}', 'JP', '{"全国"}',                              '永遠の美',             'Everlasting Beauty',         '{11,12,1,2,3}', NULL, NULL),
('キンギョソウ',     'Snapdragon',          'Antirrhinum majus',              1, '{"winter"}', 'JP', '{"全国"}',                              '強さと優雅さ',         'Strength and Grace',         '{11,12,1,2,3}', NULL, NULL),
('アネモネ',         'Anemone',             'Anemone coronaria',              1, '{"winter"}', 'JP', '{"全国"}',                              '儚い恋',               'Fleeting Love',              '{12,1,2,3}',  NULL, NULL),
('ラナンキュラス',   'Ranunculus',          'Ranunculus asiaticus',           1, '{"winter"}', 'JP', '{"全国"}',                              '晴れやかな魅力',       'Radiant Charm',              '{1,2,3,4}',   NULL, NULL),
('フクジュソウ',     'Pheasant''s Eye',     'Adonis ramosa',                  1, '{"winter"}', 'JP', '{"全国"}',                              '永久の幸福',           'Eternal Happiness',          '{1,2,3}',     NULL, NULL),
('セツブンソウ',     'Setsubun Flower',     'Shibateranthis pinnatifida',     1, '{"winter"}', 'JP', '{"関東","近畿","中部"}',                '微笑み',               'Gentle Smile',               '{1,2,3}',     NULL, NULL),
('カンツバキ',       'Winter Camellia',     'Camellia hiemalis',              1, '{"winter"}', 'JP', '{"全国"}',                              'ひたむきな愛',         'Devoted Love',               '{11,12,1}',   NULL, NULL),
('シクラメン',       'Cyclamen',            'Cyclamen persicum',              1, '{"winter"}', 'JP', '{"全国"}',                              'はにかみ',             'Bashfulness',                '{11,12,1,2,3}', NULL, NULL),
('ポインセチア',     'Poinsettia',          'Euphorbia pulcherrima',          1, '{"winter"}', 'JP', '{"全国"}',                              '聖なる願い',           'Holy Wish',                  '{12,1}',      NULL, NULL),
('ハボタン',         'Flowering Kale',      'Brassica oleracea var. acephala',1, '{"winter"}', 'JP', '{"全国"}',                              '祝福',                 'Blessing',                   '{11,12,1,2}', NULL, NULL),
('センリョウ',       'Sarcandra',           'Sarcandra glabra',               1, '{"winter"}', 'JP', '{"全国"}',                              '富と繁栄',             'Wealth and Prosperity',      '{11,12,1}',   NULL, NULL),
('マンリョウ',       'Japanese Ardisia',    'Ardisia crenata',                1, '{"winter"}', 'JP', '{"全国"}',                              '万両の徳',             'Ten-thousand Blessings',     '{11,12,1}',   NULL, NULL),
('ナンテン',         'Nandina',             'Nandina domestica',              1, '{"winter"}', 'JP', '{"全国"}',                              '良い家庭',             'Happy Home',                 '{11,12,1,2}', NULL, NULL),
('プリムラ',         'Primrose',            'Primula vulgaris',               1, '{"winter"}', 'JP', '{"全国"}',                              '青春の始まり',         'Beginning of Youth',         '{12,1,2,3}',  NULL, NULL),
('オオイヌノフグリ', 'Speedwell',           'Veronica persica',               1, '{"winter"}', 'JP', '{"全国"}',                              '信頼',                 'Trust',                      '{1,2,3,4}',   NULL, NULL),
('ホトケノザ',       'Henbit',              'Lamium amplexicaule',            1, '{"winter"}', 'JP', '{"全国"}',                              '輝く心',               'Radiant Heart',              '{1,2,3,4}',   NULL, NULL),
('ナズナ',           'Shepherd''s Purse',   'Capsella bursa-pastoris',        1, '{"winter"}', 'JP', '{"全国"}',                              'あなたに捧げる',       'I Offer You All',            '{1,2,3,4}',   NULL, NULL),
('ウグイスカグラ',   'Japanese Honeysuckle','Lonicera gracilipes',            1, '{"winter"}', 'JP', '{"全国"}',                              '愛の囁き',             'Love''s Whisper',            '{2,3,4}',     NULL, NULL),
('ガーデンシクラメン','Garden Cyclamen',    'Cyclamen hederifolium',          1, '{"winter"}', 'JP', '{"全国"}',                              '内気な喜び',           'Shy Delight',                '{11,12,1,2,3}', NULL, NULL),
('タンポポ',         'Winter Dandelion',    'Taraxacum japonicum',            1, '{"winter"}', 'JP', '{"全国"}',                              '愛の告白',             'Declaration of Love',        '{1,2,3}',     NULL, NULL),

-- ============================================================
-- ★★ UNCOMMON (rarity=2) × 20
-- ============================================================
('シナマンサク',     'Chinese Witch Hazel', 'Hamamelis mollis',               2, '{"winter"}', 'JP', '{"関東","東海","近畿"}',                '魔法の力',             'Magic Power',                '{1,2,3}',     NULL, NULL),
('バイカオウレン',   'Plum-flowered Goldthread','Coptis quinquefolia',        2, '{"winter"}', 'JP', '{"北陸","近畿","中国"}',                'ひたすら清らか',       'Pure Devotion',              '{2,3}',       NULL, NULL),
('ミスミソウ',       'Hepatica',            'Hepatica nobilis var. japonica', 2, '{"winter"}', 'JP', '{"北海道","東北","中部"}',              '自信',                 'Self-Confidence',            '{2,3,4}',     NULL, NULL),
('ユキワリイチゲ',   'Snow-parting Anemone','Anemone keiskeana',              2, '{"winter"}', 'JP', '{"近畿","中国","四国"}',                '雪の下の希望',         'Hope Beneath the Snow',      '{2,3}',       NULL, NULL),
('ヒイラギ',         'Japanese Holly',      'Ilex aquifolium',                2, '{"winter"}', 'JP', '{"全国"}',                              '先見の明',             'Foresight',                  '{11,12}',     NULL, NULL),
('スノードロップ',   'Snowdrop',            'Galanthus nivalis',              2, '{"winter"}', 'JP', '{"全国"}',                              '希望の光',             'Ray of Hope',                '{1,2,3}',     NULL, NULL),
('スノーフレーク',   'Snowflake',           'Leucojum vernum',                2, '{"winter"}', 'JP', '{"全国"}',                              '純粋な心',             'Pure Heart',                 '{2,3,4}',     NULL, NULL),
('クリスマスカクタス','Christmas Cactus',   'Schlumbergera bridgesii',        2, '{"winter"}', 'JP', '{"全国"}',                              '温もり',               'Warmth',                     '{11,12,1}',   NULL, NULL),
('カラー',           'Calla Lily',          'Zantedeschia aethiopica',        2, '{"winter"}', 'JP', '{"全国"}',                              '清浄な愛',             'Pristine Love',              '{11,12,1,2,3}', NULL, NULL),
('カンアオイ',       'Wild Ginger',         'Asarum caulescens',              2, '{"winter"}', 'JP', '{"全国"}',                              'ひっそりとした愛',     'Quiet Devotion',             '{11,12,1,2}', NULL, NULL),
('ヤブコウジ',       'Marlberry',           'Ardisia japonica',               2, '{"winter"}', 'JP', '{"全国"}',                              '変わらぬ友情',         'Unchanging Friendship',      '{11,12,1}',   NULL, NULL),
('オウバイ',         'Winter Jasmine',      'Jasminum nudiflorum',            2, '{"winter"}', 'JP', '{"全国"}',                              '恩寵',                 'Grace',                      '{1,2,3}',     NULL, NULL),
('ジンチョウゲ',     'Daphne',              'Daphne odora',                   2, '{"winter"}', 'JP', '{"全国"}',                              '栄光',                 'Glory',                      '{2,3,4}',     NULL, NULL),
('シロバナタンポポ', 'White Dandelion',     'Taraxacum albidum',              2, '{"winter"}', 'JP', '{"近畿","中国","九州"}',                '白い誓い',             'White Vow',                  '{2,3,4}',     NULL, NULL),
('ツルニチニチソウ', 'Periwinkle',          'Vinca minor',                    2, '{"winter"}', 'JP', '{"全国"}',                              '楽しい思い出',         'Joyful Memories',            '{1,2,3,4}',   NULL, NULL),
('ハルノノゲシ',     'Spring Sow Thistle',  'Sonchus oleraceus',              2, '{"winter"}', 'JP', '{"全国"}',                              '温和',                 'Gentleness',                 '{2,3,4,5}',   NULL, NULL),
('スズランスイセン', 'Snowbell Narcissus',  'Leucojum aestivum',              2, '{"winter"}', 'JP', '{"全国"}',                              '可憐な輝き',           'Delicate Radiance',          '{2,3,4}',     NULL, NULL),
('ヒメウズ',         'Isopyrum',            'Semiaquilegia adoxoides',        2, '{"winter"}', 'JP', '{"本州","四国","九州"}',                'しとやかな心',         'Graceful Spirit',            '{2,3,4}',     NULL, NULL),
('コウヤボウキ',     'Koya Broom',          'Pertya scandens',                2, '{"winter"}', 'JP', '{"本州","四国","九州"}',                '清廉な志',             'Pure Aspiration',            '{11,12}',     NULL, NULL),
('フラサバソウ',     'Veronica Hederifolia','Veronica hederifolia',           2, '{"winter"}', 'JP', '{"全国"}',                              '小さな真実',           'Small Truth',                '{2,3,4}',     NULL, NULL),

-- ============================================================
-- ★★★ SEASONAL-LIMITED (rarity=3) × 10
-- ============================================================
('ユキツバキ',       'Snow Camellia',       'Camellia rusticana',             3, '{"winter"}', 'JP', '{"新潟","山形","秋田","富山"}',          '雪の中の愛',           'Love in the Snow',           '{2,3,4}',     '[2027-02-15,2027-03-15)', NULL),
('セリバオウレン',   'Celery-leaf Goldthread','Coptis japonica var. dissecta', 3, '{"winter"}', 'JP', '{"東北","中部","近畿"}',                '静かな強さ',           'Quiet Strength',             '{2,3}',       '[2027-02-01,2027-03-01)', NULL),
('ミチノクフクジュソウ','Michinoku Pheasant''s Eye','Adonis multiflora',      3, '{"winter"}', 'JP', '{"東北","北陸"}',                       '永遠の命',             'Eternal Life',               '{2,3}',       '[2027-02-01,2027-03-01)', NULL),
('ヒュウガミズキ',   'Hyuga Witch Hazel',   'Corylopsis pauciflora',          3, '{"winter"}', 'JP', '{"宮崎","大分","熊本"}',                'やわらかな光',         'Soft Light',                 '{2,3}',       '[2027-02-15,2027-03-15)', NULL),
('バイカイカリソウ', 'Plum Epimedium',      'Epimedium diphyllum',            3, '{"winter"}', 'JP', '{"近畿","中国","四国"}',                'ひそやかな贈り物',     'Quiet Gift',                 '{2,3,4}',     '[2027-02-15,2027-03-15)', NULL),
('ユキワリコザクラ', 'Snow-parting Primrose','Primula modesta var. fauriei',  3, '{"winter"}', 'JP', '{"北海道","東北"}',                     '雪解けの希望',         'Hope of the Thaw',           '{3,4,5}',     '[2027-03-01,2027-04-01)', NULL),
('オキナグサ',       'Pasqueflower',        'Pulsatilla cernua',              3, '{"winter"}', 'JP', '{"関東","東北","中部"}',                '何も求めない愛',       'Love Asking Nothing',        '{3,4,5}',     '[2027-03-01,2027-04-01)', NULL),
('ユコウバイ',       'Fragrant Plum',       'Prunus mume ''Yuko''',           3, '{"winter"}', 'JP', '{"九州","四国","近畿"}',                'ふるさとの香り',       'Scent of Home',              '{1,2}',       '[2027-01-15,2027-02-15)', NULL),
('ヒメリュウキンカ', 'Lesser Celandine',    'Ficaria verna',                  3, '{"winter"}', 'JP', '{"北海道","東北","中部"}',              '輝く未来',             'Shining Future',             '{2,3,4}',     '[2027-02-15,2027-03-15)', NULL),
('ヤマネコノメ',     'Mountain Cat''s Eye', 'Chrysosplenium japonicum',       3, '{"winter"}', 'JP', '{"本州","四国","九州"}',                'そっと見守る',         'Watching Over You',          '{2,3,4}',     '[2027-02-01,2027-03-01)', NULL);
