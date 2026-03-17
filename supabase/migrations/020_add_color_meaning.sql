-- Add color_meaning column: maps each plant's colour to its symbolic meaning
-- (花の色言葉 — Japanese colour symbolism layer)

ALTER TABLE plants ADD COLUMN IF NOT EXISTS color_meaning TEXT;

-- ── Spring plants (seed batch 1: 60 species) ──────────────────────────────────

-- ★ COMMON (rarity=1)
UPDATE plants SET color_meaning = '淡いピンク——儚さの中に宿る希望と再生' WHERE name_ja = 'ソメイヨシノ';
UPDATE plants SET color_meaning = '白や淡紅——冬を越えた清らかな強さ' WHERE name_ja = 'ウメ';
UPDATE plants SET color_meaning = '輝く黄——生命力と太陽への揺るぎない信頼' WHERE name_ja = 'タンポポ';
UPDATE plants SET color_meaning = '菜の花の黄——春野の豊かさと喜び' WHERE name_ja = 'ナノハナ';
UPDATE plants SET color_meaning = '白と黄の対比——自己への深い省察' WHERE name_ja = 'スイセン';
UPDATE plants SET color_meaning = '花色で変わる愛——赤は情熱、白は赦し、黄は友情' WHERE name_ja = 'チューリップ';
UPDATE plants SET color_meaning = '紫と黄の重なり——思慮と幸運の調和' WHERE name_ja = 'パンジー';
UPDATE plants SET color_meaning = '白い花びら——謙虚な奉仕と真心の贈り物' WHERE name_ja = 'ハナミズキ';
UPDATE plants SET color_meaning = '白一色——清らかな意志と春の始まり' WHERE name_ja = 'コブシ';
UPDATE plants SET color_meaning = 'やわらかなピンク——愛らしさと女性の永遠の美' WHERE name_ja = 'モモ';
UPDATE plants SET color_meaning = '雪のような白——無垢と可憐な優雅さ' WHERE name_ja = 'ユキヤナギ';
UPDATE plants SET color_meaning = '輝く黄——冬明けの最初の光と期待' WHERE name_ja = 'レンギョウ';
UPDATE plants SET color_meaning = '黄色い花——思い出の輝きと過ぎた日への愛着' WHERE name_ja = 'クサノオウ';
UPDATE plants SET color_meaning = '絨毯に広がる色——調和と連帯のかたち' WHERE name_ja = 'シバザクラ';
UPDATE plants SET color_meaning = '澄んだ青——誠実さと信頼、空色の正直さ' WHERE name_ja = 'オオイヌノフグリ';
UPDATE plants SET color_meaning = '下向きに咲く薄紫——はにかみと初恋のときめき' WHERE name_ja = 'カタクリ';
UPDATE plants SET color_meaning = '深い紫——秘密の愛と謙虚な誠実さ' WHERE name_ja = 'スミレ';
UPDATE plants SET color_meaning = '鮮やかな黄——輝く精神と崇高な理想' WHERE name_ja = 'ヤマブキ';
UPDATE plants SET color_meaning = '白からピンクへ——甘い追憶と過去への愛' WHERE name_ja = 'ハルジオン';
UPDATE plants SET color_meaning = '春野の黄——農耕の喜びと生命の活力' WHERE name_ja = 'アブラナ';
UPDATE plants SET color_meaning = '純白の小花——清らかな願いと幸運のしるし' WHERE name_ja = 'シロツメクサ';
UPDATE plants SET color_meaning = '淡いピンク——愛らしさと無邪気な喜び' WHERE name_ja = 'ヒメオドリコソウ';
UPDATE plants SET color_meaning = '太陽と同じ黄——温かな心と真心の愛' WHERE name_ja = 'セイヨウタンポポ';
UPDATE plants SET color_meaning = '色で変わる感情——青は慎み、赤は遊び心、紫は愛' WHERE name_ja = 'ヒヤシンス';
UPDATE plants SET color_meaning = '鮮やかな色——儚くも情熱的な感情の象徴' WHERE name_ja = 'アネモネ';
UPDATE plants SET color_meaning = '深い青紫——失われた夢と静かな哀愁' WHERE name_ja = 'ムスカリ';
UPDATE plants SET color_meaning = '薄紫——上品な競争心と優雅さ' WHERE name_ja = 'ハナダイコン';
UPDATE plants SET color_meaning = '澄み切った空色——開かれた心と清らかな願い' WHERE name_ja = 'ネモフィラ';
UPDATE plants SET color_meaning = '燃える橙——悲しみを前へ進む力' WHERE name_ja = 'キンセンカ';
UPDATE plants SET color_meaning = '清潔な白——正直さと純粋な誠実さ' WHERE name_ja = 'ノースポール';

-- ★★ UNCOMMON (rarity=2)
UPDATE plants SET color_meaning = '垂れ下がる薄紫——優雅さと深い知恵' WHERE name_ja = 'フジ';
UPDATE plants SET color_meaning = '土で変わる色——心の柔軟さと変化への適応力' WHERE name_ja = 'アジサイ';
UPDATE plants SET color_meaning = '豪華な花びら——繁栄と女性美の頂点' WHERE name_ja = 'シャクヤク';
UPDATE plants SET color_meaning = '淡い紫——初恋の甘い興奮と青春の記憶' WHERE name_ja = 'ライラック';
UPDATE plants SET color_meaning = '繊細な色彩——旅先で出会う多様な喜び' WHERE name_ja = 'クレマチス';
UPDATE plants SET color_meaning = '百花の王の色——富と高貴な気品' WHERE name_ja = 'ボタン';
UPDATE plants SET color_meaning = '深みある色——山岳に咲く威厳と誇り' WHERE name_ja = 'シャクナゲ';
UPDATE plants SET color_meaning = '踊り子の色——生命の喜びと軽やかな愛嬌' WHERE name_ja = 'オドリコソウ';
UPDATE plants SET color_meaning = '山を染める色——情熱と節制のバランス' WHERE name_ja = 'ツツジ';
UPDATE plants SET color_meaning = '深い紫——運命の出会いと幸運の色' WHERE name_ja = 'カキツバタ';
UPDATE plants SET color_meaning = '菖蒲の紫——武家の誇りと優雅な精神' WHERE name_ja = 'ハナショウブ';
UPDATE plants SET color_meaning = '山の朱赤——野性的な情熱と初恋の輝き' WHERE name_ja = 'ヤマツツジ';
UPDATE plants SET color_meaning = '葉より先に咲く色——純粋な喜びと朗らかさ' WHERE name_ja = 'ミツバツツジ';
UPDATE plants SET color_meaning = '山奥の白——手つかずの自然への敬愛' WHERE name_ja = 'オオヤマレンゲ';
UPDATE plants SET color_meaning = '岩陰のピンク——小さくも再会を願う強さ' WHERE name_ja = 'イワカガミ';
UPDATE plants SET color_meaning = '二輪の白——寄り添う友情と心のかたち' WHERE name_ja = 'ニリンソウ';
UPDATE plants SET color_meaning = '春の雪のような色——過去への優しい追憶' WHERE name_ja = 'キクザキイチゲ';
UPDATE plants SET color_meaning = '暗い赤紫——森の深さと謎めいた神秘' WHERE name_ja = 'エンレイソウ';
UPDATE plants SET color_meaning = '三色の重なり——繊細な美と自然の複雑さ' WHERE name_ja = 'シャガ';
UPDATE plants SET color_meaning = '山の恵みの紫——深い滋養と豊かさの象徴' WHERE name_ja = 'ヤマブドウ';

-- ★★★ LIMITED (rarity=3)
UPDATE plants SET color_meaning = '幾重にも重なる濃いピンク——豊かさと喜びの充溢' WHERE name_ja = 'ヤエザクラ';
UPDATE plants SET color_meaning = '北国に咲く白——厳しさの中の純粋な意志' WHERE name_ja = 'キタコブシ';
UPDATE plants SET color_meaning = '一人咲く白い穂——静寂と内省の美' WHERE name_ja = 'ヒトリシズカ';
UPDATE plants SET color_meaning = '珍しい色合い——希少な存在の神秘と尊さ' WHERE name_ja = 'クマガイソウ';
UPDATE plants SET color_meaning = '高山の淡い紫——清澄な空気と崇高な孤独' WHERE name_ja = 'シラネアオイ';
UPDATE plants SET color_meaning = '白緑——森の番人、清らかな守護' WHERE name_ja = 'ウバユリ';
UPDATE plants SET color_meaning = '湿地の白——清冽な水辺と純粋な始まり' WHERE name_ja = 'ミズバショウ';
UPDATE plants SET color_meaning = 'やさしいピンク——春の贈り物と希望の色' WHERE name_ja = 'サクラソウ';
UPDATE plants SET color_meaning = '高山の白——雲の上で咲く孤高の清らかさ' WHERE name_ja = 'ハクサンイチゲ';
UPDATE plants SET color_meaning = '高山のピンク——岩場に根ざす不屈の美しさ' WHERE name_ja = 'コマクサ';
