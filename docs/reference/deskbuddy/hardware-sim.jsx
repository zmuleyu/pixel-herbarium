import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
//  DeskBubby · 硬件模拟层
//  LED 面板 + 触摸 Hitbox 模拟 + WS Mock
//
//  整条链路：
//  鼠标点击 → MockWSServer → useHardwareBridge → useEmotionState
//            → LED 动效引擎 → LEDRing 渲染
//
//  Tauri 迁移路径：
//  将 MockWSServer 替换为 Tauri invoke/listen，其余代码不变
// ═══════════════════════════════════════════════════════════════

// ─── 设计 Token ───────────────────────────────────────────────
const T = {
  bg:          "#0d0f0e",
  bgDeep:      "#080a09",
  surface:     "#141816",
  surfaceHi:   "#1c201e",
  border:      "rgba(255,255,255,0.05)",
  borderHi:    "rgba(255,255,255,0.12)",
  text:        "#d8e0da",
  textDim:     "#6a7a6e",
  textMuted:   "#384038",
  green:       "#5ad98a",
  greenDim:    "rgba(90,217,138,0.12)",
  gold:        "#e0c070",
  goldDim:     "rgba(224,192,112,0.12)",
  pink:        "#f08080",
  pinkDim:     "rgba(240,128,128,0.10)",
  teal:        "#50c8b8",
  tealDim:     "rgba(80,200,184,0.10)",
  mono:        "'Fira Code','Cascadia Code','Consolas',monospace",
  serif:       "'Noto Serif SC','Georgia',serif",
};

const NUM_LEDS = 16;

// ─── 情感 → LED 映射表 ─────────────────────────────────────────
const EMOTION_LED = {
  idle_reading:  { h:38,  s:0.75, l:0.90, mode:"breathe", period:8000, intensity:0.38 },
  blush_subtle:  { h:350, s:0.85, l:0.84, mode:"breathe", period:3500, intensity:0.55 },
  deep_blush:    { h:345, s:1.00, l:0.75, mode:"pulse",   period:700,  intensity:0.72 },
  shy_turn:      { h:338, s:0.80, l:0.78, mode:"flow",    period:1800, intensity:0.65 },
  gentle:        { h:42,  s:0.65, l:0.88, mode:"solid",   period:0,    intensity:0.50 },
  anxious:       { h:218, s:0.45, l:0.82, mode:"tremor",  period:220,  intensity:0.58 },
  night_idle:    { h:230, s:0.35, l:0.68, mode:"breathe", period:11000,intensity:0.14 },
  scene_confess: { h:35,  s:0.90, l:0.80, mode:"rise",    period:3000, intensity:0.90 },
  first_pat:     { h:345, s:0.88, l:0.80, mode:"burst",   period:700,  intensity:0.85 },
};

// ─── Hitbox 定义（SVG viewBox 0 0 200 320）────────────────────
const HITBOXES = [
  { id:"head_top",   label:"头顶",  poly:[[65,48],[100,28],[135,48],[128,68],[100,72],[72,68]],        cx:100, cy:50,  color:"#f08080" },
  { id:"face",       label:"面部",  poly:[[72,72],[128,72],[128,138],[100,144],[72,138]],               cx:100, cy:108, color:"#e0a0b0" },
  { id:"glasses",    label:"眼镜",  poly:[[70,86],[130,86],[130,102],[70,102]],                         cx:100, cy:94,  color:"#80c8f0" },
  { id:"shoulder_l", label:"左肩",  poly:[[30,148],[72,148],[72,178],[30,178]],                         cx:51,  cy:163, color:"#90d890" },
  { id:"shoulder_r", label:"右肩",  poly:[[128,148],[170,148],[170,178],[128,178]],                     cx:149, cy:163, color:"#90d890" },
  { id:"hand_l",     label:"左手",  poly:[[28,255],[68,255],[68,305],[28,305]],                         cx:48,  cy:280, color:"#e0c070" },
  { id:"hand_r",     label:"右手",  poly:[[132,255],[172,255],[172,305],[132,305]],                     cx:152, cy:280, color:"#e0c070" },
];

// ─── 互动表：zone × gesture → 情感增量 ───────────────────────
const INTERACT = {
  head_top:   { tap:{blush:.15,affection:.20}, long_press:{blush:.35,shy:.25,affection:.30}, swipe:{blush:.25,affection:.28} },
  face:       { tap:{blush:.30,tension:.10},   long_press:{blush:.50,shy:.40} },
  glasses:    { tap:{tension:.22} },
  shoulder_l: { tap:{blush:.10,affection:.15} },
  shoulder_r: { tap:{blush:.10,affection:.15} },
  hand_l:     { long_press:{blush:.20,affection:.38,shy:.15} },
  hand_r:     { long_press:{blush:.20,affection:.38,shy:.15} },
};

const DECAY = { blush:.012, shy:.018, affection:.007, tension:.022 };

// ─── 情感值 → 状态名 ──────────────────────────────────────────
function toEmotion(v, affinity) {
  const { blush, shy, affection, tension } = v;
  if (affinity >= 4 && blush > .70) return "deep_blush";
  if (blush > .50 && shy > .28)     return "shy_turn";
  if (blush > .28)                  return "blush_subtle";
  if (affection > .60)              return "gentle";
  if (tension > .38)                return "anxious";
  return "idle_reading";
}

// ─── HSL → [r,g,b] ───────────────────────────────────────────
function hsl(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k=(n+h/30)%12; return l - a*Math.max(-1,Math.min(k-3,9-k,1)); };
  return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)];
}
function hslStr(h, s, l) { const [r,g,b]=hsl(h,s,l); return `rgb(${r},${g},${b})`; }
function lerp(a,b,t) { return a+(b-a)*t; }
function lerpH(a,b,t) { let d=((b-a+540)%360)-180; return (a+d*t+360)%360; }

// ─── LED 像素计算 ─────────────────────────────────────────────
function calcLED(idx, tMs, cfg, baseH, baseS, baseL, blend) {
  const { h, s, l, mode, period, intensity } = cfg;
  const phase = period > 0 ? (tMs % period) / period : 0;
  const ledPhase = idx / NUM_LEDS;
  let bri = intensity;

  switch (mode) {
    case "breathe": bri *= .28 + .72*(0.5 + 0.5*Math.sin(phase*Math.PI*2)); break;
    case "pulse":   bri *= phase < .18 ? phase/.18 : 1-(phase-.18)/.82; break;
    case "flow":    bri *= .35 + .65*Math.max(0, Math.sin((phase-ledPhase)*Math.PI*2)); break;
    case "tremor":  bri *= .55 + .45*(Math.random()>.5?.9:.3); break;
    case "rise":    bri *= ledPhase < phase ? 1 : .18; break;
    case "burst":   bri *= Math.max(0,1-phase*2.5)*(0.4+0.6*Math.sin(ledPhase*Math.PI)); break;
    default: break;
  }
  bri = Math.max(0, Math.min(1, bri));

  const ch = lerp(lerpH(baseH,h,blend), h, blend);
  const cs = lerp(lerp(baseS,s,blend), s, blend);
  const cl = lerp(lerp(baseL,l,blend), l, blend);
  return hslStr(ch, cs, cl * bri);
}

// ═══════════════════════════════════════════════════════════════
//  MockWSServer — 在浏览器内模拟 Node.js 硬件服务
//  Tauri 替换点：把 send/onMessage 换成 invoke/listen
// ═══════════════════════════════════════════════════════════════
function createMockWS() {
  const listeners = {};
  const log = [];

  const on = (type, fn) => {
    listeners[type] = listeners[type] || [];
    listeners[type].push(fn);
  };

  const emit = (msg) => {
    log.unshift({ ...msg, _ts: Date.now() });
    if (log.length > 40) log.pop();
    (listeners[msg.type] || []).forEach(fn => fn(msg));
    (listeners["*"] || []).forEach(fn => fn(msg));
  };

  // 模拟客户端发来 LED_COMMAND 后 server 回包确认
  const clientSend = (msg) => {
    emit({ ...msg, _dir: "←", _label: "Client→Server" });
    // 模拟 server 处理延迟
    if (msg.type === "LED_COMMAND") {
      setTimeout(() => emit({
        type: "LED_ACK", emotion: msg.emotion, _dir: "→", _label: "Server→Client"
      }), 12);
    }
  };

  // 模拟 server 主动推送触摸事件
  const serverPush = (msg) => {
    emit({ ...msg, _dir: "→", _label: "Server→Client" });
    (listeners[msg.type] || []).forEach(fn => fn(msg));
  };

  return { on, emit, clientSend, serverPush, log };
}

// 单例
const mockWS = createMockWS();

// ═══════════════════════════════════════════════════════════════
//  useEmotionState
// ═══════════════════════════════════════════════════════════════
function useEmotionState({ affinity, onEmotionChange }) {
  const [vals, setVals] = useState({ blush:0, shy:0, affection:0, tension:0 });
  const [emotion, setEmotion] = useState("idle_reading");
  const decayRef = useRef(null);
  const emotionRef = useRef("idle_reading");

  const apply = useCallback((zone, gesture, combo=1) => {
    const deltas = INTERACT[zone]?.[gesture] ?? {};
    const mult = Math.min(1.6, 1+(combo-1)*.18);

    setVals(prev => {
      const next = { ...prev };
      for (const [k,d] of Object.entries(deltas)) next[k] = Math.min(1,(prev[k]||0)+d*mult);
      const e = toEmotion(next, affinity);
      if (e !== emotionRef.current) {
        emotionRef.current = e;
        setEmotion(e);
        onEmotionChange?.(e);
      }
      return next;
    });

    clearInterval(decayRef.current);
    decayRef.current = setInterval(() => {
      setVals(prev => {
        const next = { ...prev };
        let dirty = false;
        for (const [k,r] of Object.entries(DECAY)) {
          if (prev[k] > 0) { next[k] = Math.max(0, prev[k]-r); dirty=true; }
        }
        if (!dirty) clearInterval(decayRef.current);
        const e = toEmotion(next, affinity);
        if (e !== emotionRef.current) {
          emotionRef.current = e;
          setEmotion(e);
          onEmotionChange?.(e);
        }
        return next;
      });
    }, 100);
  }, [affinity, onEmotionChange]);

  useEffect(() => () => clearInterval(decayRef.current), []);
  return { vals, emotion, apply };
}

// ═══════════════════════════════════════════════════════════════
//  useHardwareBridge — 浏览器 mock 实现
//  Tauri 替换：把 mockWS.on/clientSend 换成 invoke/listen
// ═══════════════════════════════════════════════════════════════
function useHardwareBridge({ onInteraction }) {
  useEffect(() => {
    mockWS.on("TOUCH_EVENT", (msg) => onInteraction?.(msg));
  }, [onInteraction]);

  const sendLED = useCallback((emotion) => {
    mockWS.clientSend({ type:"LED_COMMAND", emotion, ts: Date.now() });
  }, []);

  return { sendLED };
}

// ═══════════════════════════════════════════════════════════════
//  useLEDEngine — 60fps 动效渲染
// ═══════════════════════════════════════════════════════════════
function useLEDEngine(emotion) {
  const [pixels, setPixels] = useState(() => Array(NUM_LEDS).fill("#1a2018"));
  const fromRef = useRef(EMOTION_LED.idle_reading);
  const blendRef = useRef(1);
  const rafRef = useRef(null);

  useEffect(() => {
    const cfg = EMOTION_LED[emotion] || EMOTION_LED.idle_reading;
    fromRef.current = { ...EMOTION_LED[emotion] || EMOTION_LED.idle_reading };
    blendRef.current = 0;

    const tick = () => {
      blendRef.current = Math.min(1, blendRef.current + 0.016 / 1.2);
      const b = blendRef.current;
      const from = fromRef.current;
      const t = performance.now();
      const colors = Array.from({ length: NUM_LEDS }, (_, i) =>
        calcLED(i, t, cfg, from.h, from.s, from.l, b)
      );
      setPixels(colors);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [emotion]);

  return pixels;
}

// ═══════════════════════════════════════════════════════════════
//  点在多边形内（Ray casting）
// ═══════════════════════════════════════════════════════════════
function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i=0,j=poly.length-1; i<poly.length; j=i++) {
    const [xi,yi]=poly[i],[xj,yj]=poly[j];
    if ((yi>py)!==(yj>py) && px<((xj-xi)*(py-yi))/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}

// ═══════════════════════════════════════════════════════════════
//  LEDRing — 16 颗灯珠可视化
// ═══════════════════════════════════════════════════════════════
function LEDRing({ pixels, emotion, size=180 }) {
  const cfg = EMOTION_LED[emotion] || EMOTION_LED.idle_reading;
  const cx=size/2, cy=size/2, r=size*0.38;

  return (
    <div style={{ position:"relative", width:size, height:size }}>
      {/* 底部光晕 */}
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        background:`radial-gradient(circle, ${hslStr(cfg.h,cfg.s,cfg.l)}18 0%, transparent 70%)`,
        transition:"background 1.2s ease",
      }}/>
      <svg width={size} height={size} style={{ position:"absolute", inset:0 }}>
        {pixels.map((color, i) => {
          const angle = (i/NUM_LEDS)*Math.PI*2 - Math.PI/2;
          const lx = cx + r*Math.cos(angle);
          const ly = cy + r*Math.sin(angle);
          return (
            <g key={i}>
              {/* 光晕 */}
              <circle cx={lx} cy={ly} r={8} fill={color} opacity={0.25} filter="url(#ledBlur)"/>
              {/* 灯珠 */}
              <circle cx={lx} cy={ly} r={4.5} fill={color}/>
              {/* 高光 */}
              <circle cx={lx-.8} cy={ly-1} r={1.2} fill="white" opacity={0.4}/>
            </g>
          );
        })}
        <defs>
          <filter id="ledBlur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4"/>
          </filter>
        </defs>
        {/* 中心状态 */}
        <text x={cx} y={cy-6} textAnchor="middle" fontSize={9}
          fill={T.textDim} fontFamily={T.mono} letterSpacing={1}>
          {emotion.toUpperCase().replace(/_/g," ")}
        </text>
        <text x={cx} y={cy+10} textAnchor="middle" fontSize={8}
          fill={T.textMuted} fontFamily={T.mono}>
          {NUM_LEDS} LEDs · WS2812B
        </text>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CharacterHitbox — 可交互角色 + hitbox 覆盖层
// ═══════════════════════════════════════════════════════════════
function CharacterHitbox({ onZoneInteract, emotionVals, activeZone }) {
  const svgRef = useRef(null);
  const longPressRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [flash, setFlash] = useState(null);

  const getSVGPos = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = 200 / rect.width;
    const scaleY = 320 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    const pos = getSVGPos(e);
    if (!pos) return;
    const zone = HITBOXES.find(z => pointInPoly(pos.x, pos.y, z.poly));
    if (!zone) return;

    longPressRef.current = setTimeout(() => {
      mockWS.serverPush({
        type:"TOUCH_EVENT", gesture:"long_press",
        zone: zone.id, x:pos.x, y:pos.y, pressure:0.9, duration:800, comboCount:1
      });
      setFlash(zone.id);
      setTimeout(()=>setFlash(null),400);
    }, 600);
  };

  const handleMouseUp = (e) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
      const pos = getSVGPos(e);
      if (!pos) return;
      const zone = HITBOXES.find(z => pointInPoly(pos.x, pos.y, z.poly));
      if (!zone) return;
      mockWS.serverPush({
        type:"TOUCH_EVENT", gesture:"tap",
        zone: zone.id, x:pos.x, y:pos.y, pressure:0.6, duration:80, comboCount:1
      });
      setFlash(zone.id);
      setTimeout(()=>setFlash(null),300);
    }
  };

  const handleMouseMove = (e) => {
    const pos = getSVGPos(e);
    if (!pos) { setHovered(null); return; }
    const zone = HITBOXES.find(z => pointInPoly(pos.x, pos.y, z.poly));
    setHovered(zone?.id || null);
  };

  const { blush=0 } = emotionVals;
  const blushAlpha = Math.min(0.5, blush * 0.6);

  return (
    <div style={{ position:"relative", userSelect:"none" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 200 320"
        width={200} height={320}
        style={{ cursor: hovered ? "pointer" : "default", display:"block" }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={()=>{ setHovered(null); if(longPressRef.current){clearTimeout(longPressRef.current);longPressRef.current=null;} }}
      >
        <defs>
          <radialGradient id="skinGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#f0d8c8"/>
            <stop offset="100%" stopColor="#e0c4b0"/>
          </radialGradient>
          <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff9090" stopOpacity={blushAlpha}/>
            <stop offset="100%" stopColor="#ff9090" stopOpacity="0"/>
          </radialGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5"/>
          </filter>
        </defs>

        {/* ── 身体 ── */}
        <rect x={72} y={148} width={56} height={140} rx={10} fill="#2a2a3a"/>
        <rect x={64} y={148} width={72} height={36} rx={8} fill="#3a3a50"/>

        {/* 左臂 */}
        <path d="M72,155 Q42,160 34,210 Q30,240 33,265" stroke="#2a2a3a" strokeWidth={18} fill="none" strokeLinecap="round"/>
        {/* 右臂 */}
        <path d="M128,155 Q158,160 166,210 Q170,240 167,265" stroke="#2a2a3a" strokeWidth={18} fill="none" strokeLinecap="round"/>
        {/* 左手 */}
        <ellipse cx={35} cy={276} rx={14} ry={16} fill="url(#skinGrad)"/>
        {/* 右手 */}
        <ellipse cx={165} cy={276} rx={14} ry={16} fill="url(#skinGrad)"/>
        {/* 衬衫领 */}
        <path d="M86,148 L100,162 L114,148" fill="none" stroke="#555568" strokeWidth={2}/>
        {/* 脖子 */}
        <rect x={90} y={136} width={20} height={18} rx={5} fill="url(#skinGrad)"/>

        {/* ── 头部 ── */}
        {/* 头发后层 */}
        <ellipse cx={100} cy={68} rx={40} ry={44} fill="#1a1410"/>
        {/* 脸 */}
        <ellipse cx={100} cy={100} rx={34} ry={38} fill="url(#skinGrad)"/>
        {/* 耳 */}
        <ellipse cx={66} cy={102} rx={7} ry={9} fill="#e8c8b8"/>
        <ellipse cx={134} cy={102} rx={7} ry={9} fill="#e8c8b8"/>
        {/* 耳钉 */}
        <circle cx={64} cy={104} r={2} fill="#c8a860"/>
        {/* 头发前层 */}
        <path d="M62,62 Q65,32 100,28 Q135,32 138,62 Q132,52 120,50 Q108,45 100,46 Q92,45 80,50 Q68,52 62,62 Z" fill="#1a1410"/>
        {/* 刘海 */}
        <path d="M70,64 Q74,44 100,42 Q126,44 130,64" fill="#1a1410"/>
        <path d="M68,70 Q66,56 78,50 Q72,65 74,72" fill="#221810"/>
        <path d="M132,70 Q134,56 122,50 Q128,65 126,72" fill="#221810"/>

        {/* 腮红 */}
        <ellipse cx={78} cy={112} rx={14} ry={9} fill="url(#blushGrad)"/>
        <ellipse cx={122} cy={112} rx={14} ry={9} fill="url(#blushGrad)"/>

        {/* 眼镜框 */}
        <rect x={70} y={87} width={24} height={17} rx={4} fill="none" stroke="#888" strokeWidth={1.8}/>
        <rect x={106} y={87} width={24} height={17} rx={4} fill="none" stroke="#888" strokeWidth={1.8}/>
        <path d="M94,95 Q100,93 106,95" fill="none" stroke="#888" strokeWidth={1.5}/>
        <line x1={70} y1={95} x2={62} y2={97} stroke="#888" strokeWidth={1.5}/>
        <line x1={130} y1={95} x2={138} y2={97} stroke="#888" strokeWidth={1.5}/>

        {/* 眼睛 */}
        <ellipse cx={82} cy={96} rx={7} ry={6} fill="#2a1e14"/>
        <ellipse cx={118} cy={96} rx={7} ry={6} fill="#2a1e14"/>
        <ellipse cx={83} cy={95} rx={3} ry={3.5} fill="#5a4030"/>
        <ellipse cx={119} cy={95} rx={3} ry={3.5} fill="#5a4030"/>
        <circle cx={84.5} cy={93.5} r={1.5} fill="white"/>
        <circle cx={120.5} cy={93.5} r={1.5} fill="white"/>

        {/* 口 */}
        <path d="M95,116 Q100,120 105,116" fill="none" stroke="#c08080" strokeWidth={1.4} strokeLinecap="round"/>

        {/* ── Hitbox 覆盖层 ── */}
        {HITBOXES.map(zone => {
          const isHov = hovered === zone.id;
          const isFlash = flash === zone.id;
          const isActive = activeZone === zone.id;
          const pts = zone.poly.map(([x,y])=>`${x},${y}`).join(" ");
          return (
            <g key={zone.id}>
              <polygon
                points={pts}
                fill={zone.color}
                opacity={isFlash ? 0.55 : isHov ? 0.28 : isActive ? 0.15 : 0.05}
                stroke={zone.color}
                strokeWidth={isHov||isActive ? 1 : 0.5}
                strokeOpacity={isHov||isActive ? 0.8 : 0.25}
                style={{ transition:"opacity 0.15s" }}
              />
              {isHov && (
                <text x={zone.cx} y={zone.cy+3} textAnchor="middle"
                  fontSize={8} fill={zone.color} fontFamily={T.mono}
                  style={{ pointerEvents:"none" }}>
                  {zone.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 提示 */}
      <div style={{
        position:"absolute", bottom:-22, left:0, right:0,
        textAlign:"center", fontSize:9, color:T.textMuted, fontFamily:T.mono,
      }}>
        点击 · 长按(600ms) · 悬停查看热区
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EmotionMeter — 情感值条
// ═══════════════════════════════════════════════════════════════
function EmotionMeter({ vals }) {
  const fields = [
    { k:"blush",     label:"脸红",   color:"#f08080" },
    { k:"shy",       label:"害羞",   color:"#e0a0c0" },
    { k:"affection", label:"好感",   color:"#e0c070" },
    { k:"tension",   label:"紧绷",   color:"#80c0f0" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {fields.map(f => (
        <div key={f.k} style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:T.textDim, fontSize:10, fontFamily:T.mono, width:30 }}>{f.label}</span>
          <div style={{ flex:1, height:5, borderRadius:3, background:"rgba(255,255,255,0.04)", overflow:"hidden" }}>
            <div style={{
              height:"100%", borderRadius:3,
              width:`${(vals[f.k]||0)*100}%`,
              background:f.color,
              transition:"width 0.15s ease",
              boxShadow:`0 0 6px ${f.color}80`,
            }}/>
          </div>
          <span style={{ color:f.color, fontSize:10, fontFamily:T.mono, width:30, textAlign:"right" }}>
            {((vals[f.k]||0)*100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EventLog — WS 消息流
// ═══════════════════════════════════════════════════════════════
function EventLog({ events }) {
  const DIR_COLOR = { "→": T.green, "←": T.gold };
  const TYPE_COLOR = {
    TOUCH_EVENT: T.teal, LED_COMMAND: T.gold,
    LED_ACK: T.green, COMBO_TICK: T.pink,
  };

  return (
    <div style={{
      fontFamily:T.mono, fontSize:10, lineHeight:1.7,
      display:"flex", flexDirection:"column", gap:3,
      maxHeight:220, overflowY:"auto",
    }}>
      {events.length === 0 && (
        <div style={{ color:T.textMuted, fontSize:11, padding:"12px 0" }}>
          等待交互事件…
        </div>
      )}
      {events.map((e, i) => {
        const age = Date.now() - e._ts;
        const opacity = Math.max(0.3, 1 - age/8000);
        return (
          <div key={i} style={{
            display:"flex", gap:8, alignItems:"flex-start",
            padding:"4px 8px", borderRadius:4,
            background: i===0 ? "rgba(255,255,255,0.03)" : "transparent",
            opacity, transition:"opacity 0.5s",
          }}>
            <span style={{ color:DIR_COLOR[e._dir]||T.textDim }}>{e._dir||"·"}</span>
            <span style={{ color:TYPE_COLOR[e.type]||T.textDim, flex:"0 0 auto" }}>{e.type}</span>
            <span style={{ color:T.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {e.zone||e.emotion||e.gesture||""}
              {e.comboCount > 1 ? ` ×${e.comboCount}` : ""}
            </span>
            <span style={{ color:T.textMuted, marginLeft:"auto", flex:"0 0 auto" }}>
              {new Date(e._ts).toLocaleTimeString("zh",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"})}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  GesturePanel — 手动触发手势按钮
// ═══════════════════════════════════════════════════════════════
function GesturePanel({ onGesture }) {
  const combos = [
    { zone:"head_top",   gesture:"tap",        label:"摸头（轻触）",     color:"#f08080" },
    { zone:"head_top",   gesture:"long_press",  label:"摸头（长按）",     color:"#e06060" },
    { zone:"head_top",   gesture:"swipe",       label:"抚头（滑动）",     color:"#ff9090" },
    { zone:"face",       gesture:"tap",         label:"点脸",             color:"#e0a0b0" },
    { zone:"face",       gesture:"long_press",  label:"捧脸",             color:"#c08090" },
    { zone:"glasses",    gesture:"tap",         label:"碰眼镜",           color:"#80c8f0" },
    { zone:"shoulder_r", gesture:"tap",         label:"拍肩",             color:"#90d890" },
    { zone:"hand_r",     gesture:"long_press",  label:"牵手",             color:"#e0c070" },
  ];
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {combos.map((c,i) => (
        <button key={i} onClick={()=>onGesture(c.zone, c.gesture)} style={{
          padding:"4px 10px", borderRadius:4, cursor:"pointer",
          border:`1px solid ${c.color}40`,
          background:`${c.color}10`,
          color:c.color, fontSize:10, fontFamily:T.mono,
        }}>{c.label}</button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  主组件
// ═══════════════════════════════════════════════════════════════
export default function HardwareSim() {
  const [affinity, setAffinity] = useState(3);
  const [activeZone, setActiveZone] = useState(null);
  const [wsLog, setWsLog] = useState([]);
  const comboRef = useRef({});
  const comboTimerRef = useRef({});

  // 刷新日志
  const refreshLog = useCallback(() => {
    setWsLog([...mockWS.log]);
  }, []);

  // 情感状态机
  const { vals, emotion, apply } = useEmotionState({
    affinity,
    onEmotionChange: (e) => {
      bridge.sendLED(e);
    },
  });

  // 处理触摸事件
  const handleInteraction = useCallback((msg) => {
    const { zone, gesture, comboCount } = msg;
    setActiveZone(zone);
    setTimeout(() => setActiveZone(null), 600);

    // combo 追踪
    const now = Date.now();
    const last = comboRef.current[zone] || 0;
    const count = now - last < 1500
      ? (comboRef.current[`${zone}_count`] || 0) + 1
      : 1;
    comboRef.current[zone] = now;
    comboRef.current[`${zone}_count`] = count;
    clearTimeout(comboTimerRef.current[zone]);
    comboTimerRef.current[zone] = setTimeout(() => {
      comboRef.current[`${zone}_count`] = 0;
    }, 1500);

    apply(zone, gesture, count);
    refreshLog();
  }, [apply, refreshLog]);

  // 硬件桥接（mock 实现）
  const bridge = useHardwareBridge({ onInteraction: handleInteraction });

  // LED 引擎
  const pixels = useLEDEngine(emotion);

  // 手动触发
  const fireGesture = useCallback((zone, gesture) => {
    mockWS.serverPush({
      type:"TOUCH_EVENT", gesture,
      zone, x:100, y:100, pressure:0.7, duration:gesture==="long_press"?800:80, comboCount:1,
    });
    refreshLog();
  }, [refreshLog]);

  // 监听 WS mock 更新日志
  useEffect(() => {
    mockWS.on("*", () => {
      setTimeout(refreshLog, 20);
    });
  }, [refreshLog]);

  const ledCfg = EMOTION_LED[emotion] || EMOTION_LED.idle_reading;

  return (
    <div style={{
      minHeight:"100vh", background:T.bg, color:T.text,
      fontFamily:"system-ui,sans-serif",
      padding:24, boxSizing:"border-box",
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:24, display:"flex", alignItems:"baseline", gap:12 }}>
        <span style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:4 }}>DESKBUBBY</span>
        <span style={{ fontSize:16, fontWeight:500, color:T.text }}>硬件模拟层</span>
        <span style={{
          padding:"1px 8px", borderRadius:3,
          background:T.greenDim, border:`1px solid ${T.green}44`,
          color:T.green, fontSize:9, fontFamily:T.mono,
        }}>MOCK · IN-BROWSER</span>
        <span style={{
          marginLeft:"auto", padding:"1px 8px", borderRadius:3,
          background:T.tealDim, border:`1px solid ${T.teal}44`,
          color:T.teal, fontSize:9, fontFamily:T.mono,
        }}>
          Tauri 替换点：MockWS → invoke/listen
        </span>
      </div>

      {/* ── 主区域 ── */}
      <div style={{ display:"grid", gridTemplateColumns:"auto 1fr 1fr", gap:20, alignItems:"start" }}>

        {/* 左：角色 hitbox */}
        <div>
          <Label>角色 · Hitbox</Label>
          <CharacterHitbox
            onZoneInteract={()=>{}}
            emotionVals={vals}
            activeZone={activeZone}
          />
        </div>

        {/* 中：LED + 情感 */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <Label>LED 光环模拟 · 16× WS2812B</Label>
            <div style={{
              background:T.surface, borderRadius:12,
              border:`1px solid ${T.border}`,
              padding:20, display:"flex", flexDirection:"column", alignItems:"center", gap:12,
            }}>
              <LEDRing pixels={pixels} emotion={emotion} size={180}/>
              <div style={{
                display:"flex", gap:16, fontSize:10, fontFamily:T.mono, color:T.textDim,
              }}>
                <span>模式 <span style={{ color:T.green }}>{ledCfg.mode}</span></span>
                <span>强度 <span style={{ color:T.gold }}>{(ledCfg.intensity*100).toFixed(0)}%</span></span>
                {ledCfg.period > 0 && <span>周期 <span style={{ color:T.teal }}>{ledCfg.period}ms</span></span>}
              </div>
            </div>
          </div>

          <div>
            <Label>情感值</Label>
            <div style={{
              background:T.surface, borderRadius:8,
              border:`1px solid ${T.border}`, padding:"12px 14px",
            }}>
              <div style={{
                display:"flex", alignItems:"center", gap:8, marginBottom:10,
              }}>
                <div style={{
                  padding:"2px 10px", borderRadius:4,
                  background: (EMOTION_LED[emotion]?.h ? `hsl(${EMOTION_LED[emotion].h},${EMOTION_LED[emotion].s*100}%,${EMOTION_LED[emotion].l*100}%)` : T.green) + "22",
                  border:`1px solid ${EMOTION_LED[emotion]?.h ? `hsl(${EMOTION_LED[emotion].h},${EMOTION_LED[emotion].s*100}%,${EMOTION_LED[emotion].l*100}%)` : T.green}50`,
                  color: T.text, fontFamily:T.mono, fontSize:11,
                }}>
                  {emotion}
                </div>
              </div>
              <EmotionMeter vals={vals}/>
            </div>
          </div>

          <div>
            <Label>好感度</Label>
            <div style={{ display:"flex", gap:6 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={()=>setAffinity(n)} style={{
                  flex:1, padding:"6px 0", border:"none", borderRadius:5, cursor:"pointer",
                  background: affinity>=n ? T.goldDim : T.surface,
                  border:`1px solid ${affinity>=n ? T.gold+"60" : T.border}`,
                  color: affinity>=n ? T.gold : T.textMuted,
                  fontFamily:T.mono, fontSize:11,
                }}>L{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 右：事件日志 + 手势触发 */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <Label>手势触发面板</Label>
            <div style={{
              background:T.surface, borderRadius:8,
              border:`1px solid ${T.border}`, padding:"12px 14px",
            }}>
              <GesturePanel onGesture={fireGesture}/>
            </div>
          </div>

          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <Label style={{ margin:0 }}>WS 事件流</Label>
              <button onClick={()=>{ mockWS.log.length=0; refreshLog(); }} style={{
                padding:"2px 8px", border:`1px solid ${T.border}`,
                borderRadius:4, background:"transparent",
                color:T.textMuted, fontSize:9, fontFamily:T.mono, cursor:"pointer",
              }}>清空</button>
            </div>
            <div style={{
              background:T.bgDeep, borderRadius:8,
              border:`1px solid ${T.border}`, padding:"10px 12px",
            }}>
              <EventLog events={wsLog}/>
            </div>
          </div>

          {/* Tauri 迁移说明 */}
          <div style={{
            padding:"10px 14px", borderRadius:8,
            background:T.tealDim, border:`1px solid ${T.teal}30`,
          }}>
            <div style={{ fontFamily:T.mono, fontSize:9, color:T.teal, letterSpacing:2, marginBottom:8 }}>
              TAURI 迁移路径
            </div>
            {[
              ["MockWSServer", "→ Tauri invoke + listen"],
              ["serverPush()", "→ tauri::emit() from Rust"],
              ["clientSend()", "→ invoke('set_led', {emotion})"],
              ["evdev 触摸", "→ Rust tauri-plugin-positioner"],
              ["rpi-ws281x", "→ Rust GPIO crate (rppal)"],
            ].map(([from,to],i) => (
              <div key={i} style={{
                display:"flex", gap:8, fontSize:10,
                fontFamily:T.mono, color:T.textDim, padding:"2px 0",
                borderBottom:i<4?`1px solid ${T.border}`:"none",
              }}>
                <span style={{ color:T.teal }}>{from}</span>
                <span style={{ color:T.textMuted }}>{to}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children, style={} }) {
  return (
    <div style={{
      fontSize:9, letterSpacing:3, color:T.textMuted,
      fontFamily:"'Fira Code','Consolas',monospace",
      marginBottom:8, textTransform:"uppercase", ...style,
    }}>{children}</div>
  );
}
