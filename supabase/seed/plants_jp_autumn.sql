-- 60 Japanese autumn plants seed data
-- Rarity distribution: 30x★(1), 20x★★(2), 10x★★★(3)
-- ★★★ plants have available_window set (seasonal-limited)
-- IDs auto-increment from 121 (spring=1-60, summer=61-120)

INSERT INTO plants (name_ja, name_en, name_latin, rarity, season, region, prefectures, hanakotoba, flower_meaning, bloom_months, available_window, pixel_sprite_url) VALUES

-- ============================================================
-- ★ COMMON (rarity=1) × 30
-- ============================================================
('コスモス',           'Cosmos',                  'Cosmos bipinnatus',              1, '{"autumn"}', 'JP', '{"全国"}',                              '乙女の純真',           'Maiden''s Purity',              '{9,10,11}',    NULL, NULL),
('キンモクセイ',       'Fragrant Olive',          'Osmanthus fragrans var. aurantiacus', 1, '{"autumn"}', 'JP', '{"全国"}',                    '謙虚',                 'Humility',                      '{9,10}',       NULL, NULL),
('ヒガンバナ',         'Red Spider Lily',         'Lycoris radiata',                1, '{"autumn"}', 'JP', '{"全国"}',                              '悲しい思い出',         'Bittersweet Memory',            '{9}',          NULL, NULL),
('キク',               'Chrysanthemum',           'Chrysanthemum morifolium',       1, '{"autumn"}', 'JP', '{"全国"}',                              '高貴',                 'Nobility',                      '{10,11}',      NULL, NULL),
('ススキ',             'Japanese Pampas Grass',   'Miscanthus sinensis',            1, '{"autumn"}', 'JP', '{"全国"}',                              '活力',                 'Vitality',                      '{8,9,10,11}',  NULL, NULL),
('ハギ',               'Bush Clover',             'Lespedeza bicolor',              1, '{"autumn"}', 'JP', '{"全国"}',                              '思案',                 'Contemplation',                 '{8,9,10}',     NULL, NULL),
('リンドウ',           'Gentian',                 'Gentiana scabra',                1, '{"autumn"}', 'JP', '{"全国"}',                              '正義',                 'Justice',                       '{9,10,11}',    NULL, NULL),
('ダリア',             'Dahlia',                  'Dahlia pinnata',                 1, '{"autumn"}', 'JP', '{"全国"}',                              '感謝',                 'Gratitude',                     '{9,10,11}',    NULL, NULL),
('シュウメイギク',     'Japanese Anemone',        'Anemone hupehensis',             1, '{"autumn"}', 'JP', '{"全国"}',                              'はかない恋',           'Fleeting Romance',              '{9,10}',       NULL, NULL),
('アキノキリンソウ',   'Goldenrod',               'Solidago virgaurea subsp. asiatica', 1, '{"autumn"}', 'JP', '{"全国"}',                       '用心深さ',             'Prudence',                      '{8,9,10}',     NULL, NULL),
('フジバカマ',         'Thoroughwort',            'Eupatorium japonicum',           1, '{"autumn"}', 'JP', '{"全国"}',                              'ためらい',             'Hesitation',                    '{9,10}',       NULL, NULL),
('オミナエシ',         'Patrinia',                'Patrinia scabiosifolia',         1, '{"autumn"}', 'JP', '{"全国"}',                              '親切',                 'Kindness',                      '{9,10}',       NULL, NULL),
('ナデシコ',           'Pink',                    'Dianthus superbus',              1, '{"autumn"}', 'JP', '{"全国"}',                              '純粋な愛',             'Pure Love',                     '{9,10,11}',    NULL, NULL),
('ノコンギク',         'Wild Aster',              'Aster microcephalus var. ovatus',1, '{"autumn"}', 'JP', '{"全国"}',                              '追憶',                 'Remembrance',                   '{9,10,11}',    NULL, NULL),
('ツワブキ',           'Leopard Plant',           'Farfugium japonicum',            1, '{"autumn"}', 'JP', '{"全国"}',                              '困難に負けない',       'Resilience',                    '{10,11,12}',   NULL, NULL),
('キバナコスモス',     'Yellow Cosmos',           'Cosmos sulphureus',              1, '{"autumn"}', 'JP', '{"全国"}',                              '野生の美',             'Wild Beauty',                   '{8,9,10}',     NULL, NULL),
('ホトトギス',         'Toad Lily',               'Tricyrtis hirta',                1, '{"autumn"}', 'JP', '{"全国"}',                              '永遠の若さ',           'Eternal Youth',                 '{9,10}',       NULL, NULL),
('センニチコウ',       'Globe Amaranth',          'Gomphrena globosa',              1, '{"autumn"}', 'JP', '{"全国"}',                              '変わらぬ愛',           'Unchanging Love',               '{8,9,10}',     NULL, NULL),
('ジニア',             'Zinnia',                  'Zinnia elegans',                 1, '{"autumn"}', 'JP', '{"全国"}',                              '不在の友を思う',       'Thinking of Absent Friends',   '{9,10}',       NULL, NULL),
('ルドベキア',         'Black-eyed Susan',        'Rudbeckia hirta',                1, '{"autumn"}', 'JP', '{"全国"}',                              '正義',                 'Justice',                       '{9,10}',       NULL, NULL),
('サルビア・レウカンサ','Mexican Sage',           'Salvia leucantha',               1, '{"autumn"}', 'JP', '{"全国"}',                              '家族愛',               'Family Love',                   '{9,10,11}',    NULL, NULL),
('ハナトラノオ',       'Virginia Physostegia',    'Physostegia virginiana',         1, '{"autumn"}', 'JP', '{"全国"}',                              '清廉',                 'Integrity',                     '{9,10}',       NULL, NULL),
('クジャクアスター',   'Peacock Aster',           'Aster hybridus',                 1, '{"autumn"}', 'JP', '{"全国"}',                              '追慕',                 'Longing',                       '{9,10,11}',    NULL, NULL),
('ツリガネニンジン',   'Lady Bells',              'Adenophora triphylla',           1, '{"autumn"}', 'JP', '{"全国"}',                              '感謝の心',             'Grateful Heart',                '{9,10}',       NULL, NULL),
('シロヨメナ',         'White Wild Aster',        'Aster ageratoides',              1, '{"autumn"}', 'JP', '{"全国"}',                              '素朴な美しさ',         'Simple Beauty',                 '{9,10,11}',    NULL, NULL),
('アキノタムラソウ',   'Autumn Salvia',           'Salvia japonica',                1, '{"autumn"}', 'JP', '{"全国"}',                              '知恵',                 'Wisdom',                        '{9,10,11}',    NULL, NULL),
('カラスウリ',         'Japanese Snake Gourd',    'Trichosanthes cucumeroides',     1, '{"autumn"}', 'JP', '{"全国"}',                              'よき便り',             'Good Tidings',                  '{9,10}',       NULL, NULL),
('イヌサフラン',       'Autumn Crocus',           'Colchicum autumnale',            1, '{"autumn"}', 'JP', '{"全国"}',                              '私の最良の日々',       'My Best Days',                  '{9,10}',       NULL, NULL),
('ムラサキシキブ',     'Japanese Beautyberry',    'Callicarpa japonica',            1, '{"autumn"}', 'JP', '{"全国"}',                              '聡明',                 'Wisdom',                        '{9,10,11}',    NULL, NULL),
('ジュウガツザクラ',   'October Cherry',          'Prunus × subhirtella',          1, '{"autumn"}', 'JP', '{"全国"}',                              '精神の美',             'Beauty of the Spirit',          '{10,11,12}',   NULL, NULL),

-- ============================================================
-- ★★ UNCOMMON (rarity=2) × 20
-- ============================================================
('アキギリ',           'Autumn Sage',             'Salvia glabrescens',             2, '{"autumn"}', 'JP', '{"近畿","中国","四国"}',                '尊敬',                 'Respect',                       '{9,10}',       NULL, NULL),
('ウメバチソウ',       'Grass of Parnassus',      'Parnassia palustris',            2, '{"autumn"}', 'JP', '{"北海道","東北","中部"}',              '清楚な心',             'Modest Heart',                  '{9,10}',       NULL, NULL),
('センブリ',           'Swertia',                 'Swertia japonica',               2, '{"autumn"}', 'JP', '{"全国"}',                              'そっと見守る',         'Quiet Watch',                   '{10,11}',      NULL, NULL),
('ツルリンドウ',       'Creeping Gentian',        'Tripterospermum japonicum',      2, '{"autumn"}', 'JP', '{"全国"}',                              'さびしい愛情',         'Solitary Love',                 '{9,10}',       NULL, NULL),
('キツネノカミソリ',   'Fox Lily',                'Lycoris sanguinea',              2, '{"autumn"}', 'JP', '{"本州","四国","九州"}',                '情熱',                 'Passion',                       '{9}',          NULL, NULL),
('ヤマハギ',           'Mountain Bush Clover',    'Lespedeza bicolor var. japonica',2, '{"autumn"}', 'JP', '{"全国"}',                              'しなやかな心',         'Flexible Heart',                '{8,9,10}',     NULL, NULL),
('ノビル',             'Wild Scallion',           'Allium macrostemon',             2, '{"autumn"}', 'JP', '{"全国"}',                              '忍耐',                 'Patience',                      '{9,10}',       NULL, NULL),
('ギボウシ',           'Hosta',                   'Hosta sieboldiana',              2, '{"autumn"}', 'JP', '{"全国"}',                              '静けさ',               'Tranquility',                   '{9,10}',       NULL, NULL),
('カリガネソウ',       'Bluebeard',               'Caryopteris incana',             2, '{"autumn"}', 'JP', '{"本州","四国","九州"}',                '迷わない心',           'Unwavering Heart',              '{9,10}',       NULL, NULL),
('フウセンカズラ',     'Balloon Vine',            'Cardiospermum halicacabum',      2, '{"autumn"}', 'JP', '{"全国"}',                              '無邪気',               'Innocence',                     '{9,10}',       NULL, NULL),
('ヤマラッキョウ',     'Mountain Garlic',         'Allium thunbergii',              2, '{"autumn"}', 'JP', '{"全国"}',                              '深い絆',               'Deep Bond',                     '{9,10,11}',    NULL, NULL),
('ナギナタコウジュ',   'Japanese Mint',           'Elsholtzia ciliata',             2, '{"autumn"}', 'JP', '{"全国"}',                              '温かな心',             'Warm Heart',                    '{9,10}',       NULL, NULL),
('セイタカアワダチソウ','Canada Goldenrod',        'Solidago canadensis',            2, '{"autumn"}', 'JP', '{"全国"}',                              '用心深さ',             'Prudence',                      '{10,11}',      NULL, NULL),
('タカノハススキ',     'Patterned Pampas Grass',  'Miscanthus sinensis var. zebrinus',2,'{"autumn"}','JP', '{"全国"}',                              '誠実',                 'Sincerity',                     '{9,10,11}',    NULL, NULL),
('アオツヅラフジ',     'Moonseed',                'Cocculus trilobus',              2, '{"autumn"}', 'JP', '{"全国"}',                              '秘めた思い',           'Hidden Feelings',               '{9,10}',       NULL, NULL),
('ロベリア',           'Lobelia',                 'Lobelia erinus',                 2, '{"autumn"}', 'JP', '{"全国"}',                              '悪意のない心',         'Innocent Heart',                '{9,10,11}',    NULL, NULL),
('メキシカンセージ',   'Mexican Sage',            'Salvia leucantha',               2, '{"autumn"}', 'JP', '{"全国"}',                              '家族愛',               'Family Love',                   '{9,10,11}',    NULL, NULL),
('ハナイカダ',         'Flowering Raft',          'Helwingia japonica',             2, '{"autumn"}', 'JP', '{"全国"}',                              '気まぐれな心',         'Whimsical Heart',               '{9,10}',       NULL, NULL),
('ナガサキリンドウ',   'Nagasaki Gentian',        'Gentiana zollingeri',            2, '{"autumn"}', 'JP', '{"九州","四国","近畿"}',                '純粋な心',             'Pure Heart',                    '{10,11}',      NULL, NULL),
('クズ',               'Kudzu',                   'Pueraria montana var. lobata',   2, '{"autumn"}', 'JP', '{"全国"}',                              '芯の強さ',             'Inner Strength',                '{8,9,10}',     NULL, NULL),

-- ============================================================
-- ★★★ SEASONAL-LIMITED (rarity=3) × 10
-- Each has a narrow available_window (DATERANGE)
-- ============================================================
('ミヤマトリカブト',   'Alpine Monkshood',        'Aconitum japonicum subsp. montanum', 3, '{"autumn"}', 'JP', '{"北アルプス","南アルプス","北海道"}', '騎士道',              'Chivalry',                      '{9,10}',       '[2026-09-10,2026-10-05)', NULL),
('アケボノソウ',       'Dawn Gentian',            'Swertia bimaculata',             3, '{"autumn"}', 'JP', '{"全国"}',                              '今を大切に',           'Cherish the Moment',            '{9,10}',       '[2026-09-15,2026-10-10)', NULL),
('タムラソウ',         'Japanese Saw-wort',       'Serratula coronata subsp. insularis',3,'{"autumn"}','JP','{"全国"}',                             '孤独な美しさ',         'Solitary Beauty',               '{9,10}',       '[2026-09-05,2026-09-30)', NULL),
('ムラサキセンブリ',   'Purple Swertia',          'Swertia pseudochinensis',        3, '{"autumn"}', 'JP', '{"全国"}',                              '深い思いやり',         'Deep Compassion',               '{10,11}',      '[2026-10-10,2026-11-05)', NULL),
('サワギキョウ',       'Great Blue Lobelia',      'Lobelia sessilifolia',           3, '{"autumn"}', 'JP', '{"北海道","東北","中部"}',              '澄んだ心',             'Clear Heart',                   '{9,10}',       '[2026-09-01,2026-09-25)', NULL),
('イワシャジン',       'Alpine Lady Bells',       'Adenophora takedae',             3, '{"autumn"}', 'JP', '{"北アルプス","南アルプス"}',           'やさしい語りかけ',     'Gentle Whisper',                '{9,10}',       '[2026-09-10,2026-10-10)', NULL),
('ゲンノショウコ',     'Japanese Cranesbill',     'Geranium thunbergii',            3, '{"autumn"}', 'JP', '{"全国"}',                              '心の平和',             'Peace of Mind',                 '{9,10,11}',    '[2026-09-20,2026-10-15)', NULL),
('エゾリンドウ',       'Ezo Gentian',             'Gentiana triflora var. japonica',3, '{"autumn"}', 'JP', '{"北海道","東北"}',                     '誠実な心',             'Sincere Heart',                 '{9,10}',       '[2026-09-05,2026-10-01)', NULL),
('ツメレンゲ',         'Rock Orpine',             'Orostachys japonica',            3, '{"autumn"}', 'JP', '{"全国"}',                              '静かな強さ',           'Quiet Strength',                '{10,11}',      '[2026-10-15,2026-11-10)', NULL),
('キバナノツキヌキホトトギス','Yellow Toad Lily', 'Tricyrtis perfoliata',           3, '{"autumn"}', 'JP', '{"四国","九州"}',                       '秘めた輝き',           'Hidden Radiance',               '{10,11}',      '[2026-10-01,2026-10-25)', NULL);
