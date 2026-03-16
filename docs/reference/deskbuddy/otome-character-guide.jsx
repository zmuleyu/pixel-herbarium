import { useState } from "react";

const GAMES = [
  {
    id: "lywzr",
    title: "恋与制作人",
    studio: "叠纸",
    year: 2017,
    tag: "国乙开山之作",
    accent: "#C4386A",
    characters: [
      { name: "李泽言", archetype: "霸总", role: "投资公司CEO", tags: ["外冷内热", "霸道总裁", "高冷深情"], desc: "表面高冷，控制欲强，实则深情守护。国乙"霸总"标杆人物。", icon: "👔" },
      { name: "白起", archetype: "狼狗", role: "特警", tags: ["守护系", "热血直球", "忠犬"], desc: "军人气质，行动力强，对喜欢的人直球表白、拼命守护。", icon: "🔫" },
      { name: "许墨", archetype: "学者", role: "大学教授", tags: ["温柔知性", "深沉内敛", "洞察力强"], desc: "说话温和有分寸，博学多才，温柔中带着几分神秘。温柔学者原型的典范。", icon: "📖" },
      { name: "周棋洛", archetype: "太阳", role: "超级明星", tags: ["阳光开朗", "小太阳", "治愈系"], desc: "永远笑着的爱豆，能驱散一切阴霾的温暖存在。", icon: "☀️" },
      { name: "凌肖", archetype: "叛逆", role: "考古研究生/乐手", tags: ["高冷疏离", "傲娇", "桀骜"], desc: "叛逆乐手气质，嘴上不饶人，内心柔软难以触及。", icon: "🎸" },
    ],
  },
  {
    id: "wdsjb",
    title: "未定事件簿",
    studio: "米哈游",
    year: 2020,
    tag: "律政悬疑乙女",
    accent: "#3A6EA5",
    characters: [
      { name: "夏彦", archetype: "太阳", role: "私家侦探", tags: ["阳光竹马", "忠犬", "开朗"], desc: "青梅竹马的阳光侦探，永远站在你身边的可靠存在。", icon: "🔍" },
      { name: "左然", archetype: "霸总", role: "精英律师", tags: ["冷面理性", "外冷内热", "一条直线"], desc: "法庭上冷面无情，对心上人的关心却藏在每个细节里。", icon: "⚖️" },
      { name: "莫弈", archetype: "学者", role: "心理学教授", tags: ["温柔洞察", "知性优雅", "治愈"], desc: "最懂人心的温柔教授，用洞察力守护你的内心世界。与许墨气质高度重叠。", icon: "🧠" },
      { name: "陆景和", archetype: "纨绔", role: "集团少爷", tags: ["玩世不恭", "深情反转", "富家公子"], desc: "表面花花公子，实则深情专一，反差感极强。", icon: "🎭" },
    ],
  },
  {
    id: "gyyzl",
    title: "光与夜之恋",
    studio: "腾讯北极光",
    year: 2021,
    tag: "都市奇幻乙女",
    accent: "#7B2D8E",
    characters: [
      { name: "齐司礼", archetype: "叛逆", role: "设计师上司", tags: ["毒舌傲娇", "灵族人", "刀子嘴豆腐心"], desc: "嘴上不留情面的毒舌上司，实际默默为你扛下一切。", icon: "✏️" },
      { name: "陆沉", archetype: "霸总", role: "集团CEO", tags: ["深沉腹黑", "掌控型", "城府深"], desc: "棋局式的温柔，每一步都精心布局只为将你留在身边。", icon: "♟️" },
      { name: "萧逸", archetype: "狼狗", role: "自由乐手", tags: ["桀骜不驯", "野性", "自由"], desc: "不被规则束缚的灵魂，音乐是唯一的信仰。", icon: "🎵" },
      { name: "查理苏", archetype: "反差", role: "烧伤科医生", tags: ["自恋浮夸", "反差萌", "工作认真"], desc: "表面自恋浮夸到令人发笑，手术台上却极度专注认真——反差萌出圈代表。", icon: "💉" },
      { name: "夏鸣星", archetype: "太阳", role: "青梅竹马", tags: ["阳光小太阳", "活力", "治愈"], desc: "永远充满活力的竹马，是最明亮的那颗星。", icon: "⭐" },
    ],
  },
  {
    id: "lysk",
    title: "恋与深空",
    studio: "叠纸",
    year: 2024,
    tag: "首款3D乙女",
    accent: "#1B6B93",
    characters: [
      { name: "黎深", archetype: "学者", role: "心脏外科医生", tags: ["外冷内热", "工作狂", "同理心强"], desc: "28岁冰系能力者，除了吃饭就是做手术。看似冷漠，却给女主最多安慰与鼓励。", icon: "❄️" },
      { name: "沈星回", archetype: "狼狗", role: "神秘猎人", tags: ["温和慵懒", "粘人", "占有欲"], desc: "表面温和慵懒，实则占有欲极强，是最甜蜜的陷阱。", icon: "🐾" },
      { name: "祁煜", archetype: "太阳", role: "海归艺术家", tags: ["自信热情", "富有创造力", "热烈自由"], desc: "画作风格热烈奔放，人如其画，是充满生命力的色彩。", icon: "🎨" },
      { name: "秦彻", archetype: "叛逆", role: "白发反派型", tags: ["神秘智慧", "亦正亦邪", "危险感"], desc: "游走在灰色地带的神秘存在，智慧与危险并存。", icon: "⚡" },
      { name: "夏以昼", archetype: "纨绔", role: "温柔深情型", tags: ["温柔", "深情", "治愈"], desc: "用最柔软的方式守护你，深情而不张扬。", icon: "🌙" },
    ],
  },
];

const ARCHETYPES = [
  { id: "霸总", label: "霸道总裁型", color: "#B8860B", gradient: "linear-gradient(135deg, #B8860B, #DAA520)", desc: "高冷外表下的绝对深情，掌控欲与守护欲并存。外冷内热的王道人设。", keywords: ["外冷内热", "控制欲", "精英", "深情"] },
  { id: "狼狗", label: "狼狗/守护型", color: "#C0392B", gradient: "linear-gradient(135deg, #C0392B, #E74C3C)", desc: "直球进攻+拼命守护，行动力极强，为你赴汤蹈火。", keywords: ["热血", "直球", "守护", "忠犬"] },
  { id: "学者", label: "温柔学者型", color: "#2E86AB", gradient: "linear-gradient(135deg, #2E86AB, #5DADE2)", desc: "知性温和，博学深沉，用智慧与耐心治愈你。国乙最具差异化的"文化人"人设。", keywords: ["温柔", "知性", "洞察", "治愈"] },
  { id: "太阳", label: "阳光太阳型", color: "#E67E22", gradient: "linear-gradient(135deg, #E67E22, #F1C40F)", desc: "永远明朗的笑容，驱散阴霾的温暖存在，玩家的精神港湾。", keywords: ["阳光", "开朗", "活力", "治愈"] },
  { id: "叛逆", label: "叛逆/傲娇型", color: "#8E44AD", gradient: "linear-gradient(135deg, #8E44AD, #BB8FCE)", desc: "桀骜不驯的灵魂，嘴硬心软，攻略过程充满拉扯感。", keywords: ["傲娇", "毒舌", "叛逆", "疏离"] },
  { id: "反差", label: "反差萌型", color: "#16A085", gradient: "linear-gradient(135deg, #16A085, #1ABC9C)", desc: "表里不一的极致魅力——浮夸外表 × 认真内核，制造惊喜感。", keywords: ["反差", "出人意料", "表里不一"] },
  { id: "纨绔", label: "纨绔/深情型", color: "#D4A574", gradient: "linear-gradient(135deg, #D4A574, #E8C9A0)", desc: "玩世不恭的表象下藏着最深的真心，是最需要耐心解读的角色。", keywords: ["玩世不恭", "深情", "反转", "温柔"] },
];

function getArchetypeInfo(id) {
  return ARCHETYPES.find((a) => a.id === id) || { label: id, color: "#888", gradient: "linear-gradient(135deg,#888,#aaa)" };
}

export default function OtomeCompendium() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [hoveredChar, setHoveredChar] = useState(null);

  const filteredGames = selectedGame ? GAMES.filter((g) => g.id === selectedGame) : GAMES;

  const archetypeMatrix = ARCHETYPES.map((arch) => ({
    ...arch,
    chars: GAMES.map((game) => ({
      game: game.title,
      gameId: game.id,
      accent: game.accent,
      chars: game.characters.filter((c) => c.archetype === arch.id),
    })).filter((g) => g.chars.length > 0),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e6e3", fontFamily: "'Noto Serif SC', 'Source Han Serif SC', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1a1a2e; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .card-enter { animation: fadeIn 0.4s ease-out forwards; }
        .tag-pill { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-family: 'Noto Sans SC', sans-serif; font-weight: 400; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #bbb; margin: 2px; transition: all 0.2s; }
        .tag-pill:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .game-tab { padding: 8px 18px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #999; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; font-size: 13px; font-weight: 500; transition: all 0.25s; }
        .game-tab:hover { background: rgba(255,255,255,0.08); color: #ddd; }
        .game-tab.active { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.1); color: #fff; }
        .arch-btn { padding: 6px 14px; border-radius: 99px; border: none; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; font-size: 12px; font-weight: 500; transition: all 0.25s; opacity: 0.75; }
        .arch-btn:hover { opacity: 1; transform: scale(1.05); }
        .arch-btn.active { opacity: 1; box-shadow: 0 0 12px rgba(255,255,255,0.15); }
      `}</style>

      {/* Header */}
      <header style={{ position: "relative", overflow: "hidden", padding: "60px 24px 48px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(120,80,160,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(196,56,106,0.6), rgba(123,45,142,0.6), rgba(27,107,147,0.6), transparent)", animation: "shimmer 4s linear infinite", backgroundSize: "200% 100%" }} />
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 12, letterSpacing: 6, textTransform: "uppercase", color: "#777", marginBottom: 16, fontWeight: 300 }}>CHARACTER ARCHETYPE COMPENDIUM</p>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, letterSpacing: 2, lineHeight: 1.3, background: "linear-gradient(135deg, #f0e6d3, #c9a96e, #f0e6d3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          四大国乙 · 角色人设全图鉴
        </h1>
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 14, color: "#888", marginTop: 12, fontWeight: 300, maxWidth: 600, margin: "12px auto 0" }}>
          恋与制作人 · 未定事件簿 · 光与夜之恋 · 恋与深空
        </p>
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 12, color: "#555", marginTop: 8 }}>
          2017 — 2024 · 跨越七年的角色原型谱系
        </p>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>

        {/* Section: Archetype Overview */}
        <section style={{ padding: "48px 0 32px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#d4c5a0" }}>七大原型谱系</h2>
          <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, color: "#777", marginBottom: 24, lineHeight: 1.7 }}>
            四部作品、19位男主，归纳为七种核心人设原型。点击原型标签可筛选查看。
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <button className={`arch-btn ${!selectedArchetype ? "active" : ""}`} style={{ background: "rgba(255,255,255,0.08)", color: "#ccc" }} onClick={() => setSelectedArchetype(null)}>全部</button>
            {ARCHETYPES.map((a) => (
              <button key={a.id} className={`arch-btn ${selectedArchetype === a.id ? "active" : ""}`} style={{ background: selectedArchetype === a.id ? a.gradient : `${a.color}33`, color: selectedArchetype === a.id ? "#fff" : a.color }} onClick={() => setSelectedArchetype(selectedArchetype === a.id ? null : a.id)}>
                {a.label}
              </button>
            ))}
          </div>
        </section>

        {/* Game Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
          <button className={`game-tab ${!selectedGame ? "active" : ""}`} onClick={() => setSelectedGame(null)}>全部作品</button>
          {GAMES.map((g) => (
            <button key={g.id} className={`game-tab ${selectedGame === g.id ? "active" : ""}`} onClick={() => setSelectedGame(selectedGame === g.id ? null : g.id)} style={selectedGame === g.id ? { borderColor: g.accent + "66", background: g.accent + "1a", color: g.accent } : {}}>
              {g.title}
              <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.6 }}>{g.year}</span>
            </button>
          ))}
        </div>

        {/* Character Cards by Game */}
        {filteredGames.map((game) => {
          const chars = selectedArchetype ? game.characters.filter((c) => c.archetype === selectedArchetype) : game.characters;
          if (chars.length === 0) return null;
          return (
            <section key={game.id} style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20, borderLeft: `3px solid ${game.accent}`, paddingLeft: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e8e6e3" }}>{game.title}</h3>
                <span style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 12, color: "#777" }}>{game.studio} · {game.year}</span>
                <span style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 11, padding: "2px 8px", borderRadius: 4, background: game.accent + "22", color: game.accent, fontWeight: 500 }}>{game.tag}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {chars.map((char, i) => {
                  const arch = getArchetypeInfo(char.archetype);
                  const isHovered = hoveredChar === `${game.id}-${char.name}`;
                  return (
                    <div key={char.name} className="card-enter" style={{ animationDelay: `${i * 0.08}s`, opacity: 0, background: isHovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)", border: `1px solid ${isHovered ? arch.color + "44" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: 20, cursor: "default", transition: "all 0.3s ease", position: "relative", overflow: "hidden" }} onMouseEnter={() => setHoveredChar(`${game.id}-${char.name}`)} onMouseLeave={() => setHoveredChar(null)}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: arch.gradient, opacity: isHovered ? 1 : 0.3, transition: "opacity 0.3s" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 22 }}>{char.icon}</span>
                            <h4 style={{ fontSize: 17, fontWeight: 700, color: "#f0ebe3" }}>{char.name}</h4>
                          </div>
                          <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 12, color: "#888", marginTop: 3 }}>{char.role}</p>
                        </div>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: arch.gradient, color: "#fff", fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500, whiteSpace: "nowrap" }}>{arch.label.replace("型", "")}</span>
                      </div>
                      <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, lineHeight: 1.7, color: "#aaa", marginBottom: 10 }}>{char.desc}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                        {char.tags.map((t) => <span key={t} className="tag-pill">{t}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Archetype Cross-Reference Matrix */}
        <section style={{ padding: "32px 0 48px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#d4c5a0" }}>跨作品原型对照表</h2>
          <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, color: "#777", marginBottom: 24, lineHeight: 1.7 }}>
            同一原型在不同作品中的化身——虽然职业、设定各不相同，核心人设基因一脉相承。
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#888", fontWeight: 500, fontSize: 12, minWidth: 120 }}>原型</th>
                  {GAMES.map((g) => (
                    <th key={g.id} style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.1)", color: g.accent, fontWeight: 600, fontSize: 12, minWidth: 100 }}>{g.title.replace("恋与", "恋与\n")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ARCHETYPES.map((arch, ai) => {
                  const hasChars = GAMES.some((g) => g.characters.some((c) => c.archetype === arch.id));
                  if (!hasChars) return null;
                  return (
                    <tr key={arch.id} style={{ background: ai % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "top" }}>
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, background: arch.gradient, color: "#fff", fontSize: 11, fontWeight: 500, marginBottom: 4 }}>{arch.label}</span>
                        <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5, marginTop: 4 }}>{arch.keywords.join(" · ")}</div>
                      </td>
                      {GAMES.map((game) => {
                        const matching = game.characters.filter((c) => c.archetype === arch.id);
                        return (
                          <td key={game.id} style={{ textAlign: "center", padding: "14px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "top" }}>
                            {matching.length > 0 ? matching.map((c) => (
                              <div key={c.name} style={{ marginBottom: 4 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e6e3" }}>{c.icon} {c.name}</div>
                                <div style={{ fontSize: 11, color: "#777" }}>{c.role}</div>
                              </div>
                            )) : (
                              <span style={{ color: "#333", fontSize: 18 }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Key Insights */}
        <section style={{ padding: "16px 0 64px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "#d4c5a0" }}>原型规律洞察</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {[
              { title: "「霸总」是国乙基石", text: "从李泽言到陆沉，每部作品都有一位高冷精英掌控全局。外冷内热的反差是永恒的"真香"密码。", color: "#B8860B" },
              { title: "「温柔学者」最稀缺", text: "许墨→莫弈→黎深，这条线是国乙中最独特的人设脉络。知性温柔、深沉内敛，区别于其他赛道的"文化人"魅力。", color: "#2E86AB" },
              { title: "「阳光太阳」是情绪锚点", text: "周棋洛→夏彦→夏鸣星→祁煜，每部作品都需要一个驱散阴霾的明亮存在，是玩家的精神避风港。", color: "#E67E22" },
              { title: "人设进化：从标签到立体", text: "2017年的角色以标签驱动（霸总、小太阳），到2024年的恋与深空，角色开始拥有更复杂的职业细节和内在矛盾（黎深的工作狂+同理心强）。", color: "#8E44AD" },
            ].map((insight, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: insight.color, borderRadius: "3px 0 0 3px" }} />
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#e8e6e3", marginBottom: 8 }}>{insight.title}</h4>
                <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, lineHeight: 1.7, color: "#999" }}>{insight.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 11, color: "#444" }}>四大国乙角色人设图鉴 · 基于公开资料整理 · 2017–2024</p>
      </footer>
    </div>
  );
}
