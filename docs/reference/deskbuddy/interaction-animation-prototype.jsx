import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
//  DeskBuddy · 陆知行 · 角色 SVG v3
//  骨骼层级 + 分场景视图 + 光影 + CSS transition 插值
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#1a1714", surface: "#221f1b",
  border: "rgba(255,255,255,0.04)", borderHi: "rgba(212,184,150,0.25)",
  gold: "#D4B896", goldDim: "rgba(212,184,150,0.15)",
  text: "#e8e0d8", dim: "#8a7e72", muted: "#5a5550",
  t0: "#7a9a6a", t1: "#c4849a",
};

// ─── 骨骼姿势表：Track0动画名 → 关节角度(deg) ───
// shoulder: 0=垂下, 负=向前抬起(左臂), 正=向前抬起(右臂)
// elbow: 0=伸直, 正=弯曲
const BONES = {
  idle:          { hipY:0, torso:0, neck:0,  sL:8,   eL:5,   sR:8,   eR:5   },
  idle_02:       { hipY:0, torso:0, neck:4,  sL:-20, eL:75,  sR:-20, eR:70  },
  idle_04:       { hipY:0, torso:0, neck:4,  sL:8,   eL:5,   sR:-50, eR:105 },
  freeze:        { hipY:-2,torso:0, neck:0,  sL:5,   eL:22,  sR:5,   eR:22  },
  slow_blink:    { hipY:0, torso:0, neck:0,  sL:8,   eL:5,   sR:8,   eR:5   },
  startled:      { hipY:-4,torso:0, neck:-2, sL:18,  eL:30,  sR:18,  eR:30  },
  head_down:     { hipY:0, torso:2, neck:8,  sL:8,   eL:5,   sR:8,   eR:5   },
  hand_to_hair:  { hipY:0, torso:0, neck:4,  sL:8,   eL:5,   sR:-75, eR:130 },
  push_glasses:  { hipY:0, torso:0, neck:2,  sL:8,   eL:5,   sR:-55, eR:115 },
  close_eyes:    { hipY:0, torso:0, neck:3,  sL:8,   eL:5,   sR:8,   eR:5   },
  nuzzle:        { hipY:-2,torso:0, neck:5,  sL:8,   eL:5,   sR:8,   eR:5   },
  smile_idle:    { hipY:0, torso:0, neck:0,  sL:8,   eL:5,   sR:8,   eR:5   },
  turn_away:     { hipY:0, torso:-4,neck:-6, sL:8,   eL:5,   sR:8,   eR:5   },
  peek_back:     { hipY:0, torso:2, neck:5,  sL:8,   eL:5,   sR:8,   eR:5   },
  lean_close:    { hipY:-3,torso:0, neck:0,  sL:8,   eL:5,   sR:8,   eR:5   },
  flinch_1:      { hipY:-3,torso:0, neck:-2, sL:14,  eL:18,  sR:14,  eR:18  },
  flinch_2:      { hipY:-5,torso:-2,neck:-4, sL:22,  eL:35,  sR:5,   eR:20  },
  flinch_3:      { hipY:-6,torso:-4,neck:-6, sL:30,  eL:50,  sR:30,  eR:50  },
  spin_away:     { hipY:0, torso:-8,neck:-10,sL:8,   eL:5,   sR:8,   eR:5   },
  coverface_peek:{ hipY:0, torso:-4,neck:-6, sL:-65, eL:135, sR:-65, eR:135 },
  hand_hesitate: { hipY:0, torso:0, neck:0,  sL:8,   eL:5,   sR:-15, eR:10  },
  hand_reach:    { hipY:-2,torso:0, neck:0,  sL:8,   eL:5,   sR:-30, eR:5   },
  hand_hold:     { hipY:-1,torso:0, neck:0,  sL:8,   eL:5,   sR:-35, eR:3   },
  hold_idle:     { hipY:0, torso:0, neck:0,  sL:8,   eL:5,   sR:-35, eR:3   },
  idle_tense:    { hipY:-1,torso:0, neck:0,  sL:6,   eL:18,  sR:6,   eR:18  },
  turn_to_user:  { hipY:-2,torso:0, neck:0,  sL:8,   eL:5,   sR:8,   eR:5   },
  direct_gaze:   { hipY:0, torso:0, neck:0,  sL:8,   eL:5,   sR:8,   eR:5   },
  wait_anxious:  { hipY:0, torso:-2,neck:0,  sL:8,   eL:5,   sR:-70, eR:120 },
  coverface:     { hipY:0, torso:0, neck:-4, sL:-65, eL:135, sR:-65, eR:135 },
};

// ─── 表情系统 ───
const FACE = {
  "":          { eye:"open", gaze:"front", ps:1, bL:0, bR:0, mouth:"neutral", cheek:0, ear:0, head:0 },
  blush:       { eye:"open", gaze:"away", ps:1.05, bL:0, bR:0, mouth:"smile_s", cheek:.35, ear:.2, head:-5 },
  deep_blush:  { eye:"half", gaze:"away", ps:1.1, bL:2, bR:2, mouth:"pout", cheek:.6, ear:.4, head:-12 },
  shy:         { eye:"open", gaze:"down", ps:1, bL:0, bR:0, mouth:"smile_s", cheek:.25, ear:.15, head:-8 },
  gentle:      { eye:"soft_close", gaze:"front", ps:1, bL:-1, bR:-1, mouth:"smile_w", cheek:0, ear:0, head:3 },
  heartbeat:   { eye:"open", gaze:"front", ps:1.15, bL:-1, bR:-1, mouth:"open_s", cheek:.3, ear:.2, head:0 },
  peek:        { eye:"open", gaze:"side", ps:1, bL:0, bR:0, mouth:"neutral", cheek:.15, ear:.1, head:8 },
  coverface:   { eye:"hidden", gaze:"front", ps:1.1, bL:3, bR:3, mouth:"hidden", cheek:.7, ear:.5, head:-6 },
  happy:       { eye:"happy_close", gaze:"front", ps:1, bL:-2, bR:-2, mouth:"smile_b", cheek:.15, ear:0, head:2 },
  confession:  { eye:"open", gaze:"front", ps:1.2, bL:1, bR:1, mouth:"open_s", cheek:.45, ear:.3, head:-3 },
  surprised:   { eye:"wide", gaze:"front", ps:.85, bL:-4, bR:-4, mouth:"open_l", cheek:.2, ear:0, head:0 },
};

// ─── 环境 ───
const ENV = {
  day:     { bg:"linear-gradient(180deg,#221f1b,#1e1b18,#1a1714)", glow:"#F8F0E0", go:.04, p:null },
  confess: { bg:"linear-gradient(180deg,#1e1020,#281830,#201028)", glow:"#E8A0A8", go:.08, p:"hearts" },
  warm:    { bg:"linear-gradient(180deg,#28221a,#2c2418,#2a2016)", glow:"#D4B896", go:.08, p:"sparkle" },
};

// ─── Hitbox ───
const ZONES = [
  { id:"head", label:"头顶", cx:100, cy:68, path:"M70,72 Q72,52 100,44 Q128,52 130,72 Q128,85 100,88 Q72,85 70,72Z" },
  { id:"face", label:"面部", cx:100, cy:118, path:"M74,88 Q74,80 100,76 Q126,80 126,88 L126,140 Q126,156 100,162 Q74,156 74,140Z" },
  { id:"shoulder_L", label:"左肩", cx:56, cy:185, path:"M44,175 L68,168 L65,200 L40,205Z" },
  { id:"shoulder_R", label:"右肩", cx:144, cy:185, path:"M156,175 L132,168 L135,200 L160,205Z" },
  { id:"body", label:"身体", cx:100, cy:240, path:"M62,205 L138,205 L140,295 L60,295Z" },
];

// ─── 反应链 ───
const CHAINS = {
  head_pat_L4: {
    label:"摸头 · L4", dur:6000, env:"day",
    t0:[
      {s:0,e:500,a:"freeze",l:"僵住",c:"#cc6666"},
      {s:500,e:2000,a:"slow_blink",l:"缓慢眨眼",c:"#7a9a6a"},
      {s:2000,e:3500,a:"head_down",l:"低头",c:"#6a8a5a"},
      {s:3500,e:5000,a:"hand_to_hair",l:"手摸头发",c:"#8aaa7a"},
      {s:5000,e:6000,a:"idle_02",l:"渐归看书",c:"#5a7a4a"},
    ],
    t1:[
      {s:300,e:2500,l:"脸红渐入",c:"#FF9B9B",al:"0→0.6",em:"deep_blush"},
      {s:800,e:2200,l:"害羞侧头",c:"#c4849a",al:"0.8",em:"shy"},
      {s:2500,e:4200,l:"脸红保持",c:"#FFCACA",al:"0.4",em:"blush"},
      {s:4200,e:6000,l:"消退",c:"#FFCACA",al:"0.4→0",em:""},
    ],
    bub:{t:"你——！\n……你知不知道你在做什么。",in:600,out:3200},
  },
  head_pat_L5: {
    label:"摸头 · L5 恋人", dur:4000, env:"day",
    t0:[
      {s:0,e:1500,a:"close_eyes",l:"闭眼",c:"#7a9a6a"},
      {s:1500,e:3000,a:"nuzzle",l:"蹭手",c:"#8aaa7a"},
      {s:3000,e:4000,a:"smile_idle",l:"微笑",c:"#6a8a5a"},
    ],
    t1:[
      {s:0,e:3000,l:"温柔",c:"#D4B896",al:"0.9",em:"gentle"},
      {s:2500,e:4000,l:"缓退",c:"#D4B896",al:"0.9→0",em:"gentle"},
    ],
    bub:{t:"嗯。\n……只有你可以这样。记住了。",in:800,out:3200},
  },
  face_click_L3: {
    label:"点击面部 · L3", dur:4500, env:"day",
    t0:[
      {s:0,e:800,a:"startled",l:"微惊",c:"#aa8866"},
      {s:800,e:2000,a:"turn_away",l:"别过脸",c:"#7a9a6a"},
      {s:2000,e:3500,a:"peek_back",l:"偷偷回看",c:"#8aaa7a"},
      {s:3500,e:4500,a:"idle_04",l:"撑下巴",c:"#6a8a5a"},
    ],
    t1:[
      {s:200,e:1800,l:"脸红",c:"#FF9B9B",al:"0→0.35",em:"blush"},
      {s:600,e:1800,l:"害羞",c:"#c4849a",al:"0.8",em:"shy"},
      {s:2000,e:3500,l:"偷看",c:"#E8A0A8",al:"0.6",em:"peek"},
      {s:3500,e:4500,l:"消退",c:"#FFCACA",al:"→0",em:""},
    ],
    bub:{t:"嗯？……你看我干嘛。",in:400,out:2200},
  },
  combo_head: {
    label:"连续摸头 ×3 · L4", dur:5500, env:"day",
    t0:[
      {s:0,e:500,a:"flinch_1",l:"第1下",c:"#cc8866"},
      {s:500,e:1000,a:"flinch_2",l:"第2下",c:"#cc7766"},
      {s:1000,e:1500,a:"flinch_3",l:"第3下",c:"#cc6666"},
      {s:1500,e:3000,a:"spin_away",l:"转身",c:"#aa6655"},
      {s:3000,e:5500,a:"coverface_peek",l:"捂脸偷看",c:"#996655"},
    ],
    t1:[
      {s:0,e:1500,l:"脸红递增",c:"#FF9B9B",al:"0.2→0.7",em:"blush"},
      {s:1500,e:5500,l:"深度脸红",c:"#FF6B6B",al:"0.7",em:"coverface"},
    ],
    bub:{t:"够了……我受不了了。",in:1800,out:4200},
  },
  confession: {
    label:"告白 ·「我喜欢你」", dur:8000, env:"confess",
    t0:[
      {s:0,e:2000,a:"idle_tense",l:"紧张站立",c:"#996666"},
      {s:2000,e:4000,a:"push_glasses",l:"推眼镜",c:"#aa8866"},
      {s:4000,e:6000,a:"turn_to_user",l:"转向正面",c:"#cc8866"},
      {s:6000,e:8000,a:"direct_gaze",l:"注视",c:"#D4B896"},
    ],
    t1:[
      {s:0,e:4000,l:"微颤",c:"#E8A0A8",al:"0.8",em:"confession"},
      {s:4000,e:6000,l:"心跳",c:"#E8A0A8",al:"1.0",em:"heartbeat"},
      {s:6000,e:8000,l:"深红",c:"#FF9B9B",al:"0.6",em:"deep_blush"},
    ],
    bub:{t:"我喜欢你。",in:5000,out:8000},
  },
  hand_hold: {
    label:"牵手 · L5", dur:5000, env:"warm",
    t0:[
      {s:0,e:1200,a:"hand_hesitate",l:"犹豫",c:"#7a9a6a"},
      {s:1200,e:2500,a:"hand_reach",l:"伸手",c:"#8aaa7a"},
      {s:2500,e:4000,a:"hand_hold",l:"十指相扣",c:"#aa9a6a"},
      {s:4000,e:5000,a:"hold_idle",l:"牵手",c:"#6a8a5a"},
    ],
    t1:[
      {s:0,e:2000,l:"心跳",c:"#E8A0A8",al:"0.8",em:"heartbeat"},
      {s:1500,e:4000,l:"微红",c:"#FFCACA",al:"0.35",em:"blush"},
      {s:3000,e:5000,l:"温柔",c:"#D4B896",al:"0.6",em:"gentle"},
    ],
    bub:{t:"……不许放开。",in:2800,out:4500},
  },
};

// ═══════════════════════════════════════════════════════════════
//  ViewBox 配置
// ═══════════════════════════════════════════════════════════════
const VIEWS = {
  half: { vb: "25 30 150 175", label: "半身特写" },    // 腰以上，面部占~40%
  full: { vb: "-5 0 210 365", label: "全身" },
};

// ═══════════════════════════════════════════════════════════════
//  主组件
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [ck, setCk] = useState("head_pat_L4");
  const [ph, setPh] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState("half"); // "half" | "full"
  const [showHit, setShowHit] = useState(true);
  const [showBones, setShowBones] = useState(false);
  const [hZone, setHZone] = useState(null);
  const [aZone, setAZone] = useState(null);
  const [level, setLevel] = useState(4);
  const aRef = useRef(null), sRef = useRef(null);

  const chain = CHAINS[ck];
  const dur = chain?.dur || 5000;

  // Derive visual state
  const vs = useMemo(() => {
    if (!chain) return { bones: BONES.idle, face: FACE[""], env: "day", t0a: "idle", t1a: "", isTrem: false };
    const b0 = chain.t0.find(t => ph >= t.s && ph <= t.e);
    const b1 = chain.t1.find(t => ph >= t.s && ph <= t.e);
    const bones = BONES[b0?.a] || BONES.idle;
    const em = b1?.em || "";
    const face = FACE[em] || FACE[""];
    // Blush multiplier for transition blocks
    let bm = 1;
    if (b1?.al?.includes("→")) {
      const [f, t] = b1.al.split("→").map(parseFloat);
      const p = Math.min(1, (ph - b1.s) / (b1.e - b1.s));
      bm = f + (t - f) * p;
    }
    return { bones, face, env: chain.env || "day", bm, t0a: b0?.a || "idle", t1a: b1?.l || "", isTrem: em === "confession", isHeart: em === "heartbeat" || em === "confession" };
  }, [chain, ph]);

  // Playback
  const play = useCallback(() => {
    setPlaying(true); sRef.current = performance.now() - ph;
    const tick = now => {
      const e = now - sRef.current;
      if (e >= dur) { setPh(dur); setPlaying(false); return; }
      setPh(e); aRef.current = requestAnimationFrame(tick);
    };
    aRef.current = requestAnimationFrame(tick);
  }, [ph, dur]);
  const pause = () => { setPlaying(false); aRef.current && cancelAnimationFrame(aRef.current); };
  const reset = () => { pause(); setPh(0); };
  useEffect(() => () => aRef.current && cancelAnimationFrame(aRef.current), []);
  useEffect(reset, [ck]);

  const env = ENV[vs.env] || ENV.day;
  const vb = VIEWS[view];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Noto Sans SC',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.8px)}}
        @keyframes blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(0.06)}}
        @keyframes hairSway{0%,100%{transform:rotate(0deg)}35%{transform:rotate(0.8deg)}65%{transform:rotate(-0.6deg)}}
        @keyframes earSwing{0%,100%{transform:rotate(0deg)}30%{transform:rotate(3.5deg)}70%{transform:rotate(-2.5deg)}}
        @keyframes heartBeat{0%,100%{transform:scale(1)}12%{transform:scale(1.018)}25%{transform:scale(1)}40%{transform:scale(1.012)}}
        @keyframes tremble{0%{transform:translate(0,0)}25%{transform:translate(.5px,-.3px)}50%{transform:translate(-.4px,.4px)}75%{transform:translate(.3px,-.5px)}100%{transform:translate(0,0)}}
        @keyframes glowP{0%,100%{opacity:.04}50%{opacity:.1}}
        @keyframes zoneP{0%,100%{opacity:.15}50%{opacity:.4}}
        @keyframes ripple{0%{r:8;opacity:.6}100%{r:28;opacity:0}}
        @keyframes floatUp{0%{opacity:.5;transform:translateY(0)scale(1)}100%{opacity:0;transform:translateY(-40px)scale(.3)}}
        @keyframes sparkB{0%,100%{opacity:0}50%{opacity:.6}}
        @keyframes phG{0%,100%{box-shadow:0 0 4px ${C.gold}66}50%{box-shadow:0 0 14px ${C.gold}bb}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.muted}44;border-radius:4px}
        .bone-joint{transition:transform .3s cubic-bezier(.4,.0,.2,1)}
      `}</style>

      {/* Header */}
      <header style={{ padding:"10px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <div>
          <div style={{ fontSize:8, letterSpacing:4, color:C.muted }}>DESKBUDDY · 骨骼层级 SVG v3</div>
          <div style={{ fontSize:14, fontWeight:700, fontFamily:"'Noto Serif SC',serif" }}>Spine 骨骼模拟 × 分场景视图 × 光影系统</div>
        </div>
        {/* View toggle */}
        <div style={{ display:"flex", background:C.surface, borderRadius:6, border:`1px solid ${C.border}`, overflow:"hidden" }}>
          {Object.entries(VIEWS).map(([k,v])=>(
            <button key={k} onClick={()=>setView(k)} style={{ padding:"6px 14px", border:"none", cursor:"pointer", background:view===k?C.goldDim:"transparent", color:view===k?C.gold:C.dim, fontSize:11, fontFamily:"inherit", fontWeight:view===k?600:400 }}>{v.label}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <span style={{ fontSize:9, color:C.muted }}>L</span>
          {[1,2,3,4,5].map(l=><button key={l} onClick={()=>setLevel(l)} style={{ width:28,height:22,border:`1px solid ${level===l?C.borderHi:C.border}`,borderRadius:3,cursor:"pointer",background:level===l?C.goldDim:"transparent",color:level===l?C.gold:C.muted,fontSize:10,fontFamily:"inherit" }}>L{l}</button>)}
        </div>
      </header>

      <div style={{ display:"flex", height:"calc(100vh - 46px)" }}>
        {/* Left */}
        <div style={{ width:210, flexShrink:0, borderRight:`1px solid ${C.border}`, overflowY:"auto", padding:10 }}>
          <Lbl>反应链</Lbl>
          {Object.entries(CHAINS).map(([k,ch])=>(
            <button key={k} onClick={()=>setCk(k)} style={{ display:"block",width:"100%",textAlign:"left",padding:"7px 8px",marginBottom:2,borderRadius:5, border:`1px solid ${ck===k?C.borderHi:"transparent"}`, background:ck===k?C.goldDim:"transparent",cursor:"pointer",fontFamily:"inherit", color:ck===k?C.gold:C.dim,fontSize:10.5 }}>
              {ch.label}<span style={{ float:"right",fontSize:8,color:C.muted,fontFamily:"monospace" }}>{(ch.dur/1000).toFixed(1)}s</span>
            </button>
          ))}
          <div style={{ marginTop:12, borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
            <Lbl>显示</Lbl>
            {[{l:"Hitbox",v:showHit,s:setShowHit},{l:"骨骼线",v:showBones,s:setShowBones}].map((t,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3 }}>
                <span style={{ fontSize:10,color:C.dim }}>{t.l}</span>
                <button onClick={()=>t.s(!t.v)} style={{ padding:"1px 7px",borderRadius:3,border:`1px solid ${C.border}`,background:t.v?C.goldDim:"transparent",color:t.v?C.gold:C.muted,fontSize:8,cursor:"pointer",fontFamily:"inherit" }}>{t.v?"ON":"OFF"}</button>
              </div>
            ))}
          </div>
          {/* Bone state readout */}
          <div style={{ marginTop:10, borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
            <Lbl>骨骼状态</Lbl>
            <div style={{ background:"rgba(0,0,0,.25)",borderRadius:5,padding:7,fontFamily:"monospace",fontSize:8.5,lineHeight:1.85 }}>
              <div style={{ color:C.muted }}>// joints (deg)</div>
              <div style={{ color:C.t0 }}>torso: <V>{vs.bones.torso}°</V> neck: <V>{vs.bones.neck}°</V></div>
              <div style={{ color:C.t0 }}>armL: s<V>{vs.bones.sL}°</V> e<V>{vs.bones.eL}°</V></div>
              <div style={{ color:C.t0 }}>armR: s<V>{vs.bones.sR}°</V> e<V>{vs.bones.eR}°</V></div>
              <div style={{ color:C.t0 }}>hipY: <V>{vs.bones.hipY}px</V></div>
              <div style={{ color:C.muted, marginTop:3 }}>// face</div>
              <div style={{ color:C.t1 }}>eye:<V>{vs.face.eye}</V> gaze:<V>{vs.face.gaze}</V></div>
              <div style={{ color:C.t1 }}>mouth:<V>{vs.face.mouth}</V></div>
              <div style={{ color:C.t1 }}>cheek:<V>{(vs.face.cheek*(vs.bm??1)).toFixed(2)}</V> head:<V>{vs.face.head}°</V></div>
            </div>
          </div>
        </div>

        {/* Center */}
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          {/* Preview */}
          <div style={{ flex:1, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", background:env.bg, transition:"background .8s" }}>
            <div style={{ position:"absolute",bottom:"8%",left:"50%",transform:"translateX(-50%)",width:280,height:280,borderRadius:"50%",background:`radial-gradient(circle,${env.glow}${Math.round(env.go*255).toString(16).padStart(2,'0')} 0%,transparent 70%)`,animation:"glowP 4s ease-in-out infinite",pointerEvents:"none" }}/>
            <Particles type={env.p}/>
            <div style={{ position:"relative", width:view==="half"?320:240, height:view==="half"?380:400, zIndex:5, transition:"width .5s, height .5s" }}>
              {/* Ground shadow - full view only */}
              {view==="full" && <div style={{ position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",width:80,height:12,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(0,0,0,.2) 0%,transparent 70%)" }}/>}
              <CharSVG bones={vs.bones} face={vs.face} bm={vs.bm??1} isHeart={vs.isHeart} isTrem={vs.isTrem} viewBox={vb.vb} showBones={showBones} />
              {showHit && <HitOverlay viewBox={vb.vb} level={level} hz={hZone} az={aZone} sH={setHZone} sA={setAZone}/>}
              {chain?.bub && ph>=chain.bub.in && ph<=chain.bub.out && (
                <div style={{ position:"absolute",top:view==="half"?4:8,left:"50%",transform:"translateX(-50%)",background:"rgba(26,23,20,.93)",border:`1px solid rgba(212,184,150,.2)`,borderRadius:10,padding:"9px 14px",maxWidth:view==="half"?240:200,zIndex:20,animation:"fadeIn .35s",backdropFilter:"blur(10px)" }}>
                  <div style={{ fontSize:view==="half"?13:11.5,lineHeight:1.9,color:C.text,fontFamily:"'Noto Serif SC',serif",whiteSpace:"pre-line" }}>{chain.bub.t}</div>
                  <div style={{ position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%) rotate(45deg)",width:8,height:8,background:"rgba(26,23,20,.93)",borderRight:"1px solid rgba(212,184,150,.2)",borderBottom:"1px solid rgba(212,184,150,.2)" }}/>
                </div>
              )}
            </div>
          </div>
          {/* Timeline */}
          <Timeline chain={chain} ph={ph} dur={dur} playing={playing} onPlay={play} onPause={pause} onReset={reset} onSeek={setPh}/>
        </div>

        {/* Right */}
        <div style={{ width:240, flexShrink:0, borderLeft:`1px solid ${C.border}`, overflowY:"auto", padding:"12px 10px" }}>
          <RightPanel chain={chain} ph={ph} vs={vs} view={view}/>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  骨骼层级角色 SVG
// ═══════════════════════════════════════════════════════════════
const UA = 42; // upper arm length
const FA = 36; // forearm length
const TR = ".3s cubic-bezier(.4,0,.2,1)"; // bone transition

function CharSVG({ bones, face, bm, isHeart, isTrem, viewBox, showBones }) {
  const cb = face.cheek * bm;
  const eb = face.ear * bm;
  const headTilt = face.head + bones.neck; // combined neck + expression tilt
  const isCover = bones.sL < -50 && bones.eL > 100; // coverface detection

  return (
    <svg viewBox={viewBox} style={{ width:"100%", height:"100%", overflow:"visible", transition:"viewBox .5s" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="bL"><stop offset="0%" stopColor="#FF9B9B" stopOpacity={cb}/><stop offset="100%" stopColor="#FF9B9B" stopOpacity="0"/></radialGradient>
        <radialGradient id="bR"><stop offset="0%" stopColor="#FF9B9B" stopOpacity={cb}/><stop offset="100%" stopColor="#FF9B9B" stopOpacity="0"/></radialGradient>
        <radialGradient id="eBlush"><stop offset="0%" stopColor="#FF9B9B" stopOpacity={eb}/><stop offset="100%" stopColor="#FF9B9B" stopOpacity="0"/></radialGradient>
        <linearGradient id="gHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1E1A16"/><stop offset="100%" stopColor="#0E0C0A"/></linearGradient>
        <linearGradient id="gSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFF8F0"/><stop offset="50%" stopColor="#F5E6D3"/><stop offset="100%" stopColor="#E8D0B8"/></linearGradient>
        <linearGradient id="gSweat" x1="0" y1="0" x2=".3" y2="1"><stop offset="0%" stopColor="#F0EAE0"/><stop offset="100%" stopColor="#E8DFD0"/></linearGradient>
        <radialGradient id="gIris" cx="45%" cy="40%"><stop offset="0%" stopColor="#8B6B54"/><stop offset="60%" stopColor="#4A3228"/><stop offset="100%" stopColor="#1A0E08"/></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="1.5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        {/* Shadow filter for face */}
        <linearGradient id="gFaceShadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="transparent"/><stop offset="60%" stopColor="transparent"/><stop offset="100%" stopColor="rgba(100,70,50,0.12)"/></linearGradient>
        <clipPath id="ehL"><rect x="-8" y="-1" width="16" height="9"/></clipPath>
        <clipPath id="ehR"><rect x="-8" y="-1" width="16" height="9"/></clipPath>
      </defs>

      {/* ── ROOT: hipY + breathe ── */}
      <g style={{ animation:"breathe 3.5s ease-in-out infinite" }}>
        <g className="bone-joint" style={{ transform:`translateY(${bones.hipY}px)` }}>

          {/* ── TORSO rotation ── */}
          <g className="bone-joint" style={{ transform:`rotate(${bones.torso}deg)`, transformOrigin:"100px 265px" }}>

            {/* Z0: Ground shadow */}
            <ellipse cx="100" cy="350" rx="32" ry="5" fill="rgba(0,0,0,.15)"/>

            {/* Z1: Legs */}
            <rect x="73" y="296" width="22" height="48" rx="5" fill="#3A3A42"/>
            <rect x="105" y="296" width="22" height="48" rx="5" fill="#3A3A42"/>
            {/* Shoe detail */}
            <rect x="71" y="338" width="26" height="8" rx="4" fill="#2E2E36"/>
            <rect x="103" y="338" width="26" height="8" rx="4" fill="#2E2E36"/>

            {/* Z4: Torso (sweater) */}
            <g style={{ animation:isHeart?"heartBeat .8s ease-in-out infinite":"none", transformOrigin:"100px 230px" }}>
              <path d="M72,172 Q67,185 62,225 L62,294 Q62,300 70,300 L130,300 Q138,300 138,294 L138,225 Q133,185 128,172Z" fill="url(#gSweat)" stroke="#D4CBC0" strokeWidth=".5"/>
              {/* V-neck */}
              <path d="M83,172 L100,188 L117,172" fill="none" stroke="#D4CBC0" strokeWidth="1.5"/>
              {/* ── Shadow: sweater folds ── */}
              <path d="M80,200 Q85,215 80,235" fill="none" stroke="#C8BFB0" strokeWidth=".6" opacity=".4"/>
              <path d="M120,200 Q115,215 120,235" fill="none" stroke="#C8BFB0" strokeWidth=".6" opacity=".4"/>
              <path d="M88,250 Q100,258 112,250" fill="none" stroke="#C8BFB0" strokeWidth=".5" opacity=".3"/>
              {/* Shoulder seam hints */}
              <ellipse cx="65" cy="178" rx="4" ry="1.5" fill="#D4CBC0" opacity=".5"/>
              <ellipse cx="135" cy="178" rx="4" ry="1.5" fill="#D4CBC0" opacity=".5"/>
            </g>

            {/* ── LEFT ARM bone chain ── */}
            <g transform="translate(62, 172)">
              <g className="bone-joint" style={{ transform:`rotate(${-bones.sL}deg)`, transformOrigin:"0 0" }}>
                {/* Upper arm (sweater sleeve) */}
                <line x1="0" y1="0" x2="0" y2={UA} stroke="#E8DFD0" strokeWidth="12" strokeLinecap="round"/>
                <line x1="0" y1="0" x2="0" y2={UA} stroke="#D8CFC0" strokeWidth="12" strokeLinecap="round" strokeDasharray="0 6 42" opacity=".3"/>
                {/* Sleeve cuff fold */}
                <ellipse cx="0" cy={UA-2} rx="6.5" ry="2" fill="none" stroke="#C8BFB0" strokeWidth=".6" opacity=".5"/>
                {showBones && <><circle cx="0" cy="0" r="3" fill="none" stroke="#ff0" strokeWidth=".5" opacity=".5"/><line x1="0" y1="0" x2="0" y2={UA} stroke="#ff0" strokeWidth=".3" opacity=".3"/></>}
                {/* Elbow joint */}
                <g transform={`translate(0, ${UA})`}>
                  <g className="bone-joint" style={{ transform:`rotate(${bones.eL}deg)`, transformOrigin:"0 0" }}>
                    {/* Forearm (skin — 袖口挽到手肘) */}
                    <line x1="0" y1="0" x2="0" y2={FA} stroke="#F2DCC8" strokeWidth="10" strokeLinecap="round"/>
                    {/* Forearm shadow */}
                    <line x1="-3" y1="2" x2="-2" y2={FA-4} stroke="#E0C8B0" strokeWidth="1" opacity=".3" strokeLinecap="round"/>
                    {showBones && <><circle cx="0" cy="0" r="2.5" fill="none" stroke="#ff0" strokeWidth=".5" opacity=".5"/><line x1="0" y1="0" x2="0" y2={FA} stroke="#ff0" strokeWidth=".3" opacity=".3"/></>}
                    {/* Hand */}
                    <g transform={`translate(0, ${FA})`}>
                      <ellipse cx="0" cy="0" rx="6" ry="5" fill="#F5DEB3"/>
                      {/* Finger hints */}
                      <path d="M-3,-2 Q-4,-5 -2,-6" fill="none" stroke="#E8D0B8" strokeWidth=".5" opacity=".4"/>
                    </g>
                  </g>
                </g>
              </g>
            </g>

            {/* ── RIGHT ARM bone chain ── */}
            <g transform="translate(138, 172)" style={{ animation:isTrem?"tremble .125s linear infinite":"none" }}>
              <g className="bone-joint" style={{ transform:`rotate(${bones.sR}deg)`, transformOrigin:"0 0" }}>
                <line x1="0" y1="0" x2="0" y2={UA} stroke="#E8DFD0" strokeWidth="12" strokeLinecap="round"/>
                <line x1="0" y1="0" x2="0" y2={UA} stroke="#D8CFC0" strokeWidth="12" strokeLinecap="round" strokeDasharray="0 6 42" opacity=".3"/>
                <ellipse cx="0" cy={UA-2} rx="6.5" ry="2" fill="none" stroke="#C8BFB0" strokeWidth=".6" opacity=".5"/>
                {showBones && <><circle cx="0" cy="0" r="3" fill="none" stroke="#0ff" strokeWidth=".5" opacity=".5"/><line x1="0" y1="0" x2="0" y2={UA} stroke="#0ff" strokeWidth=".3" opacity=".3"/></>}
                <g transform={`translate(0, ${UA})`}>
                  <g className="bone-joint" style={{ transform:`rotate(${-bones.eR}deg)`, transformOrigin:"0 0" }}>
                    <line x1="0" y1="0" x2="0" y2={FA} stroke="#F2DCC8" strokeWidth="10" strokeLinecap="round"/>
                    <line x1="3" y1="2" x2="2" y2={FA-4} stroke="#E0C8B0" strokeWidth="1" opacity=".3" strokeLinecap="round"/>
                    {showBones && <><circle cx="0" cy="0" r="2.5" fill="none" stroke="#0ff" strokeWidth=".5" opacity=".5"/><line x1="0" y1="0" x2="0" y2={FA} stroke="#0ff" strokeWidth=".3" opacity=".3"/></>}
                    <g transform={`translate(0, ${FA})`}>
                      <ellipse cx="0" cy="0" rx="6" ry="5" fill="#F5DEB3"/>
                      <path d="M3,-2 Q4,-5 2,-6" fill="none" stroke="#E8D0B8" strokeWidth=".5" opacity=".4"/>
                    </g>
                  </g>
                </g>
              </g>
            </g>

            {/* Z6: Neck */}
            <rect x="94" y="152" width="12" height="22" rx="5" fill="#F2DCC8"/>
            {/* Neck shadow */}
            <rect x="94" y="152" width="12" height="8" rx="4" fill="rgba(180,150,120,.12)"/>

            {/* ── HEAD group: neck rotation + expression headTilt ── */}
            <g transform="translate(100, 155)">
              <g className="bone-joint" style={{ transform:`rotate(${headTilt}deg)`, transformOrigin:"0 0" }}>
                <g transform="translate(-100, -155)">
                  {showBones && <circle cx="100" cy="155" r="4" fill="none" stroke="#f80" strokeWidth=".5" opacity=".5"/>}

                  {/* Z7: Hair back */}
                  <path d="M62,115 Q60,65 82,52 Q95,44 112,48 Q132,55 140,75 Q144,95 140,115 Q137,92 130,80 Q120,66 100,62 Q80,65 72,80 Q67,95 62,115Z" fill="url(#gHair)"/>

                  {/* Z8: Face + shadow */}
                  <ellipse cx="100" cy="118" rx="37" ry="43" fill="url(#gSkin)"/>
                  <ellipse cx="100" cy="130" rx="30" ry="33" fill="url(#gSkin)"/>
                  {/* ── Face shadow: jaw underside ── */}
                  <ellipse cx="100" cy="148" rx="26" ry="8" fill="rgba(180,150,120,.1)"/>
                  {/* ── Face shadow: nose side ── */}
                  <path d="M103,128 Q104,132 103,136" fill="none" stroke="rgba(160,130,100,.12)" strokeWidth="1.5" strokeLinecap="round"/>

                  {/* Ears */}
                  <ellipse cx="63" cy="118" rx="5" ry="10" fill="#E8D0B8"/>
                  <ellipse cx="137" cy="118" rx="5" ry="10" fill="#E8D0B8"/>
                  {/* Ear inner */}
                  <ellipse cx="64" cy="118" rx="3" ry="6" fill="#DDBFAA" opacity=".5"/>

                  {/* Z9: Features */}
                  {!isCover && <>
                    {/* Upper eyelid lines */}
                    <path d="M80,108 Q86,106 92,108" fill="none" stroke="#2A2228" strokeWidth=".8"/>
                    <path d="M108,108 Q114,106 120,108" fill="none" stroke="#2A2228" strokeWidth=".8"/>
                    <Eyes face={face}/>
                    {/* Brows */}
                    <path d={`M78,${102+face.bL} Q85,${99+face.bL} 92,${102+face.bL}`} fill="none" stroke="#1E1A16" strokeWidth="1.2"/>
                    <path d={`M108,${102+face.bR} Q115,${99+face.bR} 122,${102+face.bR}`} fill="none" stroke="#1E1A16" strokeWidth="1.2"/>
                    <Mouth type={face.mouth}/>
                    {/* Nose */}
                    <path d="M99,126 Q100,128 101,126" fill="none" stroke="#D4C0A8" strokeWidth=".6" opacity=".5"/>
                    {/* Collarbone hint (visible at neckline) */}
                    <path d="M88,158 Q100,162 112,158" fill="none" stroke="#E0C8B8" strokeWidth=".5" opacity=".3"/>
                  </>}

                  {/* Z10: Blush */}
                  <ellipse cx="80" cy="124" rx="9" ry="5.5" fill="url(#bL)" style={{ transition:"all .6s" }}/>
                  <ellipse cx="120" cy="124" rx="9" ry="5.5" fill="url(#bR)" style={{ transition:"all .6s" }}/>
                  {cb>.4 && <ellipse cx="100" cy="128" rx="4" ry="2" fill="#FF9B9B" opacity={cb*.3}/>}
                  {/* Ear blush */}
                  <ellipse cx="63" cy="116" rx="5" ry="7" fill="url(#eBlush)" style={{ transition:"all .6s" }}/>
                  <ellipse cx="137" cy="116" rx="5" ry="7" fill="url(#eBlush)" style={{ transition:"all .6s" }}/>

                  {/* Z11: Glasses */}
                  <g>
                    <rect x="77" y="106" width="18" height="13" rx="3" fill="none" stroke="#B8B8C8" strokeWidth=".8"/>
                    <rect x="105" y="106" width="18" height="13" rx="3" fill="none" stroke="#B8B8C8" strokeWidth=".8"/>
                    <line x1="95" y1="112" x2="105" y2="112" stroke="#B8B8C8" strokeWidth=".6"/>
                    {/* Temple arms */}
                    <line x1="77" y1="109" x2="64" y2="108" stroke="#B8B8C8" strokeWidth=".5"/>
                    <line x1="123" y1="109" x2="136" y2="108" stroke="#B8B8C8" strokeWidth=".5"/>
                    {/* Lens reflection */}
                    <line x1="89" y1="108" x2="92" y2="106.5" stroke="#E0E0F0" strokeWidth=".4" opacity=".35"/>
                    <line x1="117" y1="108" x2="120" y2="106.5" stroke="#E0E0F0" strokeWidth=".4" opacity=".35"/>
                  </g>

                  {/* Z12: Hair front */}
                  <g style={{ animation:"hairSway 5s ease-in-out infinite", transformOrigin:"100px 58px" }}>
                    <path d="M65,100 Q58,90 62,78 Q60,95 68,105" fill="#2A2A2E" opacity=".6"/>
                    <path d="M132,88 Q140,78 137,68 Q142,84 134,96" fill="#2A2A2E" opacity=".6"/>
                    <path d="M70,96 Q76,72 87,70 Q80,80 76,96" fill="#1E1A16"/>
                    <path d="M81,92 Q88,66 102,62 Q94,74 88,92" fill="#1E1A16"/>
                    <path d="M107,88 Q114,62 128,66 Q120,74 114,88" fill="#1E1A16"/>
                    {/* Hair highlight */}
                    <path d="M84,76 Q92,68 98,72" fill="none" stroke="#3D2E24" strokeWidth=".6" opacity=".35"/>
                    {/* ── Hair shadow on forehead ── */}
                    <path d="M72,96 Q85,92 100,90 Q115,92 128,96" fill="none" stroke="rgba(30,26,22,.15)" strokeWidth="2" strokeLinecap="round"/>
                  </g>

                  {/* Z13: Earring */}
                  <g style={{ animation:"earSwing 3s ease-in-out infinite", transformOrigin:"63px 118px" }}>
                    <circle cx="63" cy="121" r="1.5" fill="#C8C8D8" filter="url(#glow)"/>
                    <circle cx="63" cy="121" r=".8" fill="#E8E8F0"/>
                  </g>

                  {/* Coverface hands (drawn here so they overlay face) */}
                  {isCover && <>
                    <ellipse cx="90" cy="116" rx="8" ry="7" fill="#F5DEB3"/>
                    <ellipse cx="110" cy="116" rx="8" ry="7" fill="#F5DEB3"/>
                    {/* Peek through gap */}
                    <ellipse cx="100" cy="114" rx="3" ry="3.5" fill="url(#gIris)" opacity=".7"/>
                    <circle cx="101" cy="113" r="1" fill="white" opacity=".5"/>
                    {/* Finger lines */}
                    <path d="M86,112 L86,120" stroke="#E8D0B8" strokeWidth=".4" opacity=".4"/>
                    <path d="M114,112 L114,120" stroke="#E8D0B8" strokeWidth=".4" opacity=".4"/>
                  </>}
                </g>
              </g>
            </g>

          </g>{/* end torso */}
        </g>{/* end hipY */}
      </g>{/* end breathe */}
    </svg>
  );
}

// ── Eyes sub-component ──
function Eyes({ face }) {
  const gx = face.gaze==="away"?-3:face.gaze==="side"?4:0;
  const gy = face.gaze==="down"?2:0;
  const p = face.ps;
  if (face.eye==="hidden") return null;
  if (face.eye==="soft_close") return <><path d="M81,113 Q86,116 91,113" fill="none" stroke="#4A3228" strokeWidth="1.3" strokeLinecap="round"/><path d="M109,113 Q114,116 119,113" fill="none" stroke="#4A3228" strokeWidth="1.3" strokeLinecap="round"/></>;
  if (face.eye==="happy_close") return <><path d="M81,113 Q86,118 91,113" fill="none" stroke="#4A3228" strokeWidth="1.3" strokeLinecap="round"/><path d="M109,113 Q114,118 119,113" fill="none" stroke="#4A3228" strokeWidth="1.3" strokeLinecap="round"/></>;
  if (face.eye==="half") return (
    <g>
      <g transform="translate(86,113)"><g clipPath="url(#ehL)"><ellipse cx="0" cy="0" rx="5" ry="5.5" fill="white"/><ellipse cx={1+gx} cy={gy} rx={3.5*p} ry={4*p} fill="url(#gIris)"/><circle cx={2.5+gx} cy="-1.5" r="1.3" fill="white" opacity=".85"/></g></g>
      <g transform="translate(114,113)"><g clipPath="url(#ehR)"><ellipse cx="0" cy="0" rx="5" ry="5.5" fill="white"/><ellipse cx={1+gx} cy={gy} rx={3.5*p} ry={4*p} fill="url(#gIris)"/><circle cx={2.5+gx} cy="-1.5" r="1.3" fill="white" opacity=".85"/></g></g>
      <path d="M80,111 Q86,109 92,111" fill="none" stroke="#2A2228" strokeWidth=".8"/>
      <path d="M108,111 Q114,109 120,111" fill="none" stroke="#2A2228" strokeWidth=".8"/>
    </g>
  );
  if (face.eye==="wide") return (
    <g><ellipse cx="86" cy="113" rx="6" ry="6.5" fill="white"/><ellipse cx={87+gx} cy={113+gy} rx={3*p} ry={3.5*p} fill="url(#gIris)"/><circle cx={88.5+gx} cy="111" r="1.5" fill="white" opacity=".9"/>
    <ellipse cx="114" cy="113" rx="6" ry="6.5" fill="white"/><ellipse cx={115+gx} cy={113+gy} rx={3*p} ry={3.5*p} fill="url(#gIris)"/><circle cx={116.5+gx} cy="111" r="1.5" fill="white" opacity=".9"/></g>
  );
  // Default open with blink
  return (
    <g style={{ animation:"blink 4.2s ease-in-out infinite", transformOrigin:"100px 113px" }}>
      <ellipse cx="86" cy="113" rx="5" ry="5.5" fill="white"/><ellipse cx={87+gx} cy={113+gy} rx={3.5*p} ry={4*p} fill="url(#gIris)"/><circle cx={88.5+gx*.8} cy="111.5" r="1.3" fill="white" opacity=".85"/><circle cx={84+gx*.5} cy="114" r=".6" fill="white" opacity=".4"/>
      <ellipse cx="114" cy="113" rx="5" ry="5.5" fill="white"/><ellipse cx={115+gx} cy={113+gy} rx={3.5*p} ry={4*p} fill="url(#gIris)"/><circle cx={116.5+gx*.8} cy="111.5" r="1.3" fill="white" opacity=".85"/><circle cx={113+gx*.5} cy="114" r=".6" fill="white" opacity=".4"/>
    </g>
  );
}

// ── Mouth sub-component ──
function Mouth({ type }) {
  const M = {
    neutral: <path d="M95,135 Q100,137.5 105,135" fill="none" stroke="#C47070" strokeWidth="1" strokeLinecap="round"/>,
    smile_s: <path d="M94,135 Q100,139 106,135" fill="none" stroke="#C47070" strokeWidth="1.1" strokeLinecap="round"/>,
    smile_w: <path d="M93,134 Q100,140 107,134" fill="none" stroke="#C47070" strokeWidth="1.2" strokeLinecap="round"/>,
    smile_b: <><path d="M92,133 Q100,142 108,133" fill="none" stroke="#C47070" strokeWidth="1.3" strokeLinecap="round"/><path d="M95,134 Q100,137 105,134" fill="#F5C0B0" opacity=".3"/></>,
    open_s: <><ellipse cx="100" cy="136" rx="3.5" ry="2.5" fill="#3A2020" opacity=".5"/><path d="M95,134 Q100,132 105,134" fill="none" stroke="#C47070" strokeWidth=".8"/></>,
    open_l: <><ellipse cx="100" cy="136" rx="4.5" ry="3.5" fill="#3A2020" opacity=".5"/><path d="M94,134 Q100,132 106,134" fill="none" stroke="#C47070" strokeWidth=".8"/></>,
    pout: <path d="M96,136 Q100,134 104,136" fill="none" stroke="#C47070" strokeWidth="1.2" strokeLinecap="round"/>,
    hidden: null,
  };
  return M[type] || M.neutral;
}

// ═══════════════════════════════════════════════════════════════
//  Hitbox / Particles / Timeline / Panels
// ═══════════════════════════════════════════════════════════════
function HitOverlay({ viewBox, level, hz, az, sH, sA }) {
  const [rip, setRip] = useState(null);
  const hc = level>=4?"#FF9B9B":level>=3?"#E8A0A8":"#D4B896";
  const int = level>=4?.18:level>=3?.12:.06;
  return (
    <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"all",zIndex:10 }}>
      {ZONES.map(z=>{const h=hz===z.id,a=az===z.id;return(
        <g key={z.id} onMouseEnter={()=>sH(z.id)} onMouseLeave={()=>sH(null)} onClick={()=>{sA(z.id);setRip({cx:z.cx,cy:z.cy,k:Date.now()})}} style={{ cursor:"pointer" }}>
          <path d={z.path} fill={a?`${hc}30`:h?`${hc}20`:`${hc}${Math.round(int*255).toString(16).padStart(2,'0')}`} stroke={a?hc:h?`${hc}88`:`${hc}22`} strokeWidth={a?1.2:.6} style={{ transition:"all .25s",animation:a?"zoneP 2s infinite":"none" }}/>
          {(h||a)&&<g style={{ animation:"fadeIn .15s" }}><rect x={z.cx-14} y={z.cy-6} width={28} height={12} rx={3} fill="rgba(20,18,14,.88)" stroke={`${hc}55`} strokeWidth=".5"/><text x={z.cx} y={z.cy+3} textAnchor="middle" fill={hc} fontSize="7" fontFamily="'Noto Sans SC'">{z.label}</text></g>}
        </g>
      );})}
      {rip&&<circle key={rip.k} cx={rip.cx} cy={rip.cy} r="8" fill="none" stroke={hc} strokeWidth="1" style={{ animation:"ripple .6s ease-out forwards" }}/>}
    </svg>
  );
}

function Particles({ type }) {
  const ps = useMemo(()=>type?Array.from({length:type==="hearts"?8:12},(_,i)=>({i,l:Math.random()*100,d:Math.random()*5,du:3+Math.random()*4,sz:type==="hearts"?10+Math.random()*8:2+Math.random()*2,t:Math.random()*100})):[], [type]);
  if (!type) return null;
  return <div style={{ position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:1 }}>
    {ps.map(p=>type==="hearts"?<div key={p.i} style={{ position:"absolute",left:`${p.l}%`,bottom:-10,fontSize:p.sz,color:"#E8A0A8",opacity:.4,animation:`floatUp ${p.du+2}s ease-out ${p.d}s infinite` }}>♥</div>:<div key={p.i} style={{ position:"absolute",left:`${p.l}%`,top:`${p.t}%`,width:p.sz,height:p.sz,borderRadius:"50%",background:"#D4B896",animation:`sparkB ${p.du}s ease-in-out ${p.d}s infinite` }}/>)}
  </div>;
}

function Timeline({ chain, ph, dur, playing, onPlay, onPause, onReset, onSeek }) {
  const ref = useRef(null);
  if (!chain) return null;
  const px=.12, tw=dur*px, phx=ph*px;
  const click=e=>{if(!ref.current)return;const r=ref.current.getBoundingClientRect();onSeek(Math.max(0,Math.min(dur,(e.clientX-r.left+ref.current.scrollLeft-70)/px)));};
  return (
    <div style={{ height:175,borderTop:`1px solid ${C.border}`,background:C.surface,display:"flex",flexDirection:"column",flexShrink:0 }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 12px",borderBottom:`1px solid ${C.border}` }}>
        <Btn onClick={onReset}>⏮</Btn><Btn onClick={playing?onPause:onPlay} hi>{playing?"⏸":"▶"}</Btn>
        <span style={{ fontSize:10,color:C.dim,fontFamily:"monospace",minWidth:80 }}>{(ph/1000).toFixed(1)}s / {(dur/1000).toFixed(1)}s</span>
        <span style={{ fontSize:11,color:C.gold,fontWeight:600,fontFamily:"'Noto Serif SC',serif" }}>{chain.label}</span>
        <div style={{ marginLeft:"auto",display:"flex",gap:12,fontSize:9 }}><span style={{ color:C.t0 }}>● T0 骨骼</span><span style={{ color:C.t1 }}>● T1 表情</span></div>
      </div>
      <div ref={ref} onClick={click} style={{ flex:1,overflowX:"auto",overflowY:"hidden",position:"relative",cursor:"crosshair" }}>
        <div style={{ width:Math.max(tw+60,"100%"),height:"100%",position:"relative",paddingLeft:70 }}>
          {/* Ruler */}
          <div style={{ position:"absolute",top:0,left:70,right:0,height:16,borderBottom:`1px solid ${C.border}` }}>
            {Array.from({length:Math.ceil(dur/500)+1},(_,i)=>{const ms=i*500;return<div key={i} style={{ position:"absolute",left:ms*px }}><div style={{ width:1,height:i%2===0?8:4,background:`${C.muted}33` }}/>{i%2===0&&<div style={{ fontSize:7,color:C.muted,fontFamily:"monospace",transform:"translateX(-50%)",marginTop:1 }}>{(ms/1000).toFixed(1)}s</div>}</div>;})}
          </div>
          {/* Labels */}
          <div style={{ position:"absolute",left:0,top:16,width:66 }}>
            <div style={{ height:42,display:"flex",alignItems:"center",paddingLeft:6,borderBottom:`1px solid ${C.border}` }}><div><div style={{ fontSize:9,color:C.t0,fontWeight:600 }}>Track 0</div><div style={{ fontSize:7,color:C.muted }}>骨骼·姿势</div></div></div>
            <div style={{ height:42,display:"flex",alignItems:"center",paddingLeft:6 }}><div><div style={{ fontSize:9,color:C.t1,fontWeight:600 }}>Track 1</div><div style={{ fontSize:7,color:C.muted }}>表情·情感</div></div></div>
          </div>
          {/* T0 */}
          <div style={{ position:"absolute",left:70,top:18,right:0,height:42,borderBottom:`1px solid ${C.border}` }}>
            {chain.t0.map((b,i)=><TB key={i} b={b} px={px} ph={ph} tc={C.t0}/>)}
          </div>
          {/* T1 */}
          <div style={{ position:"absolute",left:70,top:60,right:0,height:42 }}>
            {chain.t1.map((b,i)=><TB key={i} b={{s:b.s,e:b.e,l:b.l,c:b.c,al:b.al}} px={px} ph={ph} tc={C.t1} sa/>)}
          </div>
          {/* Bubble marker */}
          {chain.bub&&<div style={{ position:"absolute",left:70+chain.bub.in*px,top:108,height:12,width:(chain.bub.out-chain.bub.in)*px,background:`${C.gold}12`,border:`1px solid ${C.gold}22`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ fontSize:7,color:C.gold }}>💬</span></div>}
          {/* Playhead */}
          <div style={{ position:"absolute",left:70+phx,top:0,bottom:0,width:2,background:C.gold,zIndex:10,transition:playing?"none":"left .1s",animation:playing?"phG 1s infinite":"none" }}><div style={{ position:"absolute",top:-1,left:-5,width:12,height:12,background:C.gold,borderRadius:"50%",border:`2px solid ${C.bg}` }}/></div>
        </div>
      </div>
    </div>
  );
}
function TB({ b, px, ph, tc, sa }) {
  const x=b.s*px, w=(b.e-b.s)*px, on=ph>=b.s&&ph<=b.e;
  return <div style={{ position:"absolute",left:x,top:3,height:36,width:w,borderRadius:4,background:on?`${b.c}28`:`${b.c}10`,border:`1px solid ${on?b.c:b.c+"33"}`,padding:"2px 4px",overflow:"hidden",transition:"all .15s" }}>
    <div style={{ fontSize:8,color:on?b.c:tc,fontWeight:on?600:400,fontFamily:"monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{b.l}</div>
    {sa&&b.al&&<div style={{ fontSize:7,color:C.muted,fontFamily:"monospace" }}>α {b.al}</div>}
    {on&&<div style={{ position:"absolute",left:0,top:0,bottom:0,width:`${((ph-b.s)/(b.e-b.s))*100}%`,background:`${b.c}0c`,borderRight:`1px solid ${b.c}33` }}/>}
  </div>;
}

function RightPanel({ chain, ph, vs, view }) {
  if (!chain) return null;
  const b0 = chain.t0.find(t=>ph>=t.s&&ph<=t.e);
  const b1 = chain.t1.find(t=>ph>=t.s&&ph<=t.e);
  return <>
    <Lbl>Spine 指令</Lbl>
    <div style={{ background:"rgba(0,0,0,.25)",borderRadius:5,padding:7,fontFamily:"monospace",fontSize:9,lineHeight:2,marginBottom:12 }}>
      <div style={{ color:C.muted }}>// Track 0 · exclusive</div>
      <div style={{ color:C.t0 }}>setAnimation(0, <V>"{b0?.a||"idle"}"</V>, loop)</div>
      <div style={{ color:C.t0 }}>crossfade = <V>0.3s</V></div>
      {b1&&<><div style={{ color:C.muted,marginTop:3 }}>// Track 1 · additive</div><div style={{ color:C.t1 }}>emotion = <V>"{b1.em}"</V></div><div style={{ color:C.t1 }}>alpha = <V>{b1.al}</V></div><div style={{ color:C.t1 }}>mixBlend = <V>add</V></div></>}
    </div>
    <Lbl>骨骼关节</Lbl>
    <div style={{ marginBottom:12 }}>
      {[["torso",`${vs.bones.torso}°`],["neck",`${vs.bones.neck}°`],["head",`${vs.face.head}°`],["hipY",`${vs.bones.hipY}px`],["armL.s",`${vs.bones.sL}°`],["armL.e",`${vs.bones.eL}°`],["armR.s",`${vs.bones.sR}°`],["armR.e",`${vs.bones.eR}°`]].map(([k,v],i)=>(
        <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"2px 0",borderBottom:`1px solid ${C.border}`,fontSize:9.5 }}>
          <span style={{ color:C.muted,fontFamily:"monospace" }}>{k}</span>
          <span style={{ color:C.t0,fontFamily:"monospace" }}>{v}</span>
        </div>
      ))}
    </div>
    <Lbl>面部参数</Lbl>
    <div style={{ marginBottom:12 }}>
      {[["eye",vs.face.eye],["gaze",vs.face.gaze],["pupil",vs.face.ps.toFixed(2)],["mouth",vs.face.mouth],["cheek",(vs.face.cheek*(vs.bm??1)).toFixed(2)],["ear",(vs.face.ear*(vs.bm??1)).toFixed(2)],["brow",`${vs.face.bL}/${vs.face.bR}`]].map(([k,v],i)=>(
        <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"2px 0",borderBottom:`1px solid ${C.border}`,fontSize:9.5 }}>
          <span style={{ color:C.muted,fontFamily:"monospace" }}>{k}</span>
          <span style={{ color:C.t1,fontFamily:"monospace" }}>{v}</span>
        </div>
      ))}
    </div>
    <Lbl>视图</Lbl>
    <div style={{ fontSize:9,color:C.dim,marginBottom:12,fontFamily:"monospace" }}>viewBox: {VIEWS[view].vb}</div>
    <Lbl>台词</Lbl>
    <div style={{ background:"rgba(0,0,0,.15)",borderRadius:5,padding:9,fontSize:12,lineHeight:1.9,color:C.text,fontFamily:"'Noto Serif SC',serif",whiteSpace:"pre-line",borderLeft:`2px solid ${C.gold}33` }}>{chain.bub?.t||"—"}</div>
  </>;
}

// ── Helpers ──
function Lbl({ children }) { return <div style={{ fontSize:8,letterSpacing:3,color:C.muted,marginBottom:5,marginTop:3 }}>{children}</div>; }
function V({ children }) { return <span style={{ color:"#88aacc" }}>{children}</span>; }
function Btn({ children, onClick, hi }) { return <button onClick={onClick} style={{ width:hi?32:24,height:24,border:`1px solid ${C.border}`,borderRadius:4,background:hi?C.goldDim:"transparent",color:hi?C.gold:C.dim,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit" }}>{children}</button>; }
