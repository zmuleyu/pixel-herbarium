import { useState, useEffect, useRef, useCallback } from "react";

/*
 * ══════════════════════════════════════════════════════════════
 *  陆知行 · 角色 SVG v3 — 国乙美学重构
 *  对标：许墨(恋与制作人) × 黎深(恋与深空) × 莫弈(未定事件簿)
 *  
 *  核心修复：
 *  1. 脸型：从圆球 → 椭圆+下颌收窄，成年男性比例
 *  2. 眼睛：从简单圆 → 多层虹膜+3个高光+上下睫毛+瞳孔深度
 *  3. 头发：从扁平黑块 → 多层次发片+高光流线+物理弹性
 *  4. 身体：从矩形 → 肩线+腰线+衣褶立体感
 *  5. 手部：从黄球 → 手掌+手指轮廓
 * ══════════════════════════════════════════════════════════════
 */

// ─── 色彩体系(许墨暖调×黎深冷精度) ───
const C = {
  // 肤色 — 三阶渐变
  skin1: "#FFF6EE",    // 高光·额头/鼻梁
  skin2: "#F8E8D8",    // 中间调·面部主色
  skin3: "#EACED0",    // 暗部·下颌/颈部 (微偏粉)
  skinWarm: "#FDE8D8",  // 暖光区
  
  // 头发 — 深棕黑(不是纯黑)
  hair1: "#1C1814",    // 最深
  hair2: "#2A2420",    // 中间
  hair3: "#3D3028",    // 暗部高光
  hair4: "#5A4838",    // 发丝亮部
  hairShine: "#8B7460", // 光泽带
  
  // 眼睛 — 核心！双层虹膜+多光点
  eyeOuter: "#2A1A10",  // 虹膜外环·最深
  eyeMid: "#4A3228",    // 虹膜中层
  eyeInner: "#7A5A40",  // 虹膜内层·偏暖
  eyeLight: "#A88060",  // 瞳孔亮环
  eyeWhite: "#FFFCF8",  // 巩膜·微暖不是纯白
  eyeHighlight1: "#FFFFFF", // 主高光·纯白
  eyeHighlight2: "#FFF5E8", // 次高光·暖
  eyeHighlight3: "#E8F0FF", // 补光点·冷
  pupil: "#0E0804",     // 瞳孔
  
  // 嘴唇
  lip: "#C8847A",
  lipShadow: "#B07068",
  lipHighlight: "#E0A8A0",
  
  // 眉毛
  brow: "#2A201A",
  
  // 眼镜 — 银色细框(黎深规格)
  glass: "#A8A8B8",
  glassLight: "#D0D0E0",
  glassShine: "#E8E8F8",
  
  // 耳钉
  earring: "#C0C0D0",
  earringGlow: "#E0E0F0",
  
  // 针织衫
  sweater1: "#F5F0E8",   // 亮面
  sweater2: "#EBE4DA",   // 中间
  sweater3: "#D8CCBE",   // 褶皱暗部
  sweater4: "#C8BAA8",   // 深部阴影
  
  // 裤子
  pants1: "#3C3C46",
  pants2: "#2E2E38",
  pants3: "#4A4A54",
  
  // 手
  hand1: "#F5E0CC",
  hand2: "#EAD0B8",
  
  // 脸红
  blush: "#FFB0A8",
  blushSoft: "#FFD0C8",
  
  // 环境光
  rimLight: "#E8E0F8",
};

// ─── 微表情参数 ───
const EXPRESSIONS = {
  default:      { blush: 0, headTilt: 0, bodyLean: 0, eyeType: "open", mouthType: "gentle", browType: "natural", handPose: "relax", glassShift: 0 },
  smile:        { blush: 0.08, headTilt: 2, bodyLean: 0, eyeType: "smile", mouthType: "smile", browType: "natural", handPose: "relax", glassShift: 0 },
  push_glasses: { blush: 0.06, headTilt: -4, bodyLean: 0, eyeType: "over_rim", mouthType: "gentle", browType: "natural", handPose: "push_glass", glassShift: -1.5 },
  shy:          { blush: 0.35, headTilt: -8, bodyLean: 0, eyeType: "glance", mouthType: "pursed", browType: "soft", handPose: "ear_touch", glassShift: 0 },
  blush_light:  { blush: 0.3, headTilt: -4, bodyLean: 0, eyeType: "open", mouthType: "surprised", browType: "soft_up", handPose: "relax", glassShift: 0 },
  blush_deep:   { blush: 0.55, headTilt: -12, bodyLean: 0, eyeType: "half", mouthType: "flustered", browType: "soft_up", handPose: "cover", glassShift: 1 },
  peek:         { blush: 0.4, headTilt: 7, bodyLean: 0, eyeType: "peek", mouthType: "neutral", browType: "natural", handPose: "cover", glassShift: 0 },
  jealous:      { blush: 0, headTilt: 10, bodyLean: 0, eyeType: "narrow", mouthType: "flat", browType: "furrow", handPose: "book", glassShift: 0 },
  gentle_close: { blush: 0.12, headTilt: 3, bodyLean: 5, eyeType: "closed", mouthType: "warm_smile", browType: "relaxed", handPose: "relax", glassShift: 0 },
  heartbeat:    { blush: 0.25, headTilt: 0, bodyLean: 2, eyeType: "sparkle", mouthType: "surprised", browType: "soft_up", handPose: "relax", glassShift: 0 },
  protective:   { blush: 0, headTilt: 2, bodyLean: 4, eyeType: "protective", mouthType: "tight", browType: "inner_furrow", handPose: "relax", glassShift: 0 },
  confession:   { blush: 0.45, headTilt: 0, bodyLean: 2, eyeType: "direct", mouthType: "tremble", browType: "tension", handPose: "tremble", glassShift: 0.5 },
};

// ═══════════════════════════════════════════════════
//  角色 SVG 主组件
// ═══════════════════════════════════════════════════
function ZhixingV3({ emotion = "default", scale = 1, env = "day" }) {
  const [breathT, setBreathT] = useState(0);
  const [blinkT, setBlinkT] = useState(1); // 1 = open
  const [hairT, setHairT] = useState(0);
  const [trembleX, setTrembleX] = useState(0);
  const rafRef = useRef(0);
  const blinkRef = useRef(null);

  const cfg = EXPRESSIONS[emotion] || EXPRESSIONS.default;
  const isDark = ["night","night_deep","rain","confess","dim"].includes(env);

  // 动画循环
  useEffect(() => {
    let raf;
    const loop = () => {
      rafRef.current++;
      const f = rafRef.current;
      setBreathT(Math.sin(f * 0.025) * 1.2);
      setHairT(Math.sin(f * 0.02) * 1.5 + Math.sin(f * 0.035) * 0.6);
      if (emotion === "confession") {
        setTrembleX((Math.random() - 0.5) * 0.8);
      } else {
        setTrembleX(0);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [emotion]);

  // 眨眼
  useEffect(() => {
    const doBlink = () => {
      setBlinkT(0.3);
      setTimeout(() => setBlinkT(0.05), 50);
      setTimeout(() => setBlinkT(0.3), 100);
      setTimeout(() => setBlinkT(1), 160);
      blinkRef.current = setTimeout(doBlink, 2800 + Math.random() * 3500);
    };
    blinkRef.current = setTimeout(doBlink, 1500 + Math.random() * 2000);
    return () => clearTimeout(blinkRef.current);
  }, []);

  const vw = 300, vh = 520;

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width: vw * scale, height: vh * scale, overflow: "visible" }}>
      <defs>
        {/* 皮肤：三阶渐变模拟双光源 */}
        <radialGradient id="v3_skin" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor={C.skin1} />
          <stop offset="50%" stopColor={C.skin2} />
          <stop offset="100%" stopColor={C.skin3} />
        </radialGradient>
        {/* 头发主色 */}
        <linearGradient id="v3_hair" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={C.hair2} />
          <stop offset="50%" stopColor={C.hair1} />
          <stop offset="100%" stopColor={C.hair2} />
        </linearGradient>
        {/* 头发光泽带 */}
        <linearGradient id="v3_hairShine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.hairShine} stopOpacity="0" />
          <stop offset="40%" stopColor={C.hairShine} stopOpacity="0.35" />
          <stop offset="60%" stopColor={C.hair4} stopOpacity="0.25" />
          <stop offset="100%" stopColor={C.hairShine} stopOpacity="0" />
        </linearGradient>
        {/* 虹膜 — 多层径向(核心！) */}
        <radialGradient id="v3_irisL" cx="42%" cy="38%" r="50%">
          <stop offset="0%" stopColor={C.eyeLight} />
          <stop offset="30%" stopColor={C.eyeInner} />
          <stop offset="65%" stopColor={C.eyeMid} />
          <stop offset="100%" stopColor={C.eyeOuter} />
        </radialGradient>
        <radialGradient id="v3_irisR" cx="42%" cy="38%" r="50%">
          <stop offset="0%" stopColor={C.eyeLight} />
          <stop offset="30%" stopColor={C.eyeInner} />
          <stop offset="65%" stopColor={C.eyeMid} />
          <stop offset="100%" stopColor={C.eyeOuter} />
        </radialGradient>
        {/* 针织衫 */}
        <linearGradient id="v3_sweater" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={C.sweater1} />
          <stop offset="50%" stopColor={C.sweater2} />
          <stop offset="100%" stopColor={C.sweater3} />
        </linearGradient>
        {/* 脸红区域 */}
        <radialGradient id="v3_blushL" cx="40%" cy="50%">
          <stop offset="0%" stopColor={C.blush} stopOpacity={cfg.blush} />
          <stop offset="50%" stopColor={C.blushSoft} stopOpacity={cfg.blush * 0.5} />
          <stop offset="100%" stopColor={C.blushSoft} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="v3_blushR" cx="60%" cy="50%">
          <stop offset="0%" stopColor={C.blush} stopOpacity={cfg.blush} />
          <stop offset="50%" stopColor={C.blushSoft} stopOpacity={cfg.blush * 0.5} />
          <stop offset="100%" stopColor={C.blushSoft} stopOpacity="0" />
        </radialGradient>
        {/* 投影 */}
        <radialGradient id="v3_shadow">
          <stop offset="0%" stopColor="#000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* 柔光 */}
        <filter id="v3_glow"><feGaussianBlur stdDeviation="2" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="v3_softGlow"><feGaussianBlur stdDeviation="1" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        {/* 头发柔化边缘 */}
        <filter id="v3_hairSoft"><feGaussianBlur stdDeviation="0.4" /></filter>
      </defs>

      <g transform={`translate(${trembleX}, 0)`}>
        {/* ════ 地面投影 ════ */}
        <ellipse cx="150" cy="505" rx="55" ry="8" fill="url(#v3_shadow)" />

        <g transform={`rotate(${cfg.bodyLean}, 150, 300)`}>

          {/* ════════════════════════════════════════
               身体 (Layer 1-5)
             ════════════════════════════════════════ */}

          {/* 裤子 */}
          <path d="M110,390 L110,465 Q110,475 118,475 L135,475 Q140,475 140,468 L140,390 Z" fill={C.pants1} />
          <path d="M160,390 L160,465 Q160,475 168,475 L185,475 Q190,475 190,468 L190,390 Z" fill={C.pants1} />
          {/* 裤子高光 */}
          <path d="M114,395 L114,450 Q114,455 118,455 L125,455 L125,395 Z" fill={C.pants3} opacity="0.25" />
          <path d="M164,395 L164,450 Q164,455 168,455 L175,455 L175,395 Z" fill={C.pants3} opacity="0.25" />
          {/* 裤子中缝 */}
          <line x1="125" y1="390" x2="125" y2="470" stroke={C.pants2} strokeWidth="0.5" opacity="0.3" />
          <line x1="175" y1="390" x2="175" y2="470" stroke={C.pants2} strokeWidth="0.5" opacity="0.3" />

          {/* 鞋 */}
          <ellipse cx="126" cy="476" rx="18" ry="5" fill="#2A2A32" />
          <ellipse cx="174" cy="476" rx="18" ry="5" fill="#2A2A32" />

          {/* 身体/针织衫 */}
          <g transform={`translate(0, ${breathT * 0.3})`}>
            {/* 躯干 — 带肩线弧度 */}
            <path
              d="M95,250 
                 Q88,260 84,290 L82,385 Q82,395 92,398 
                 L208,398 Q218,395 218,385 L216,290 
                 Q212,260 205,250 
                 Q195,242 175,238 L150,236 L125,238 Q105,242 95,250 Z"
              fill="url(#v3_sweater)"
            />
            {/* 肩部弧线 */}
            <path d="M95,250 Q105,244 125,240" fill="none" stroke={C.sweater3} strokeWidth="0.6" opacity="0.5" />
            <path d="M205,250 Q195,244 175,240" fill="none" stroke={C.sweater3} strokeWidth="0.6" opacity="0.5" />

            {/* V领 — 精确 */}
            <path d="M125,238 L150,268 L175,238" fill={C.skin3} />
            <path d="M126,239 L150,266 L174,239" fill="none" stroke={C.sweater4} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M128,240 L150,264 L172,240" fill="none" stroke={C.sweater3} strokeWidth="0.5" strokeLinejoin="round" />

            {/* 衣褶线 */}
            <path d="M100,300 Q115,296 130,302" fill="none" stroke={C.sweater3} strokeWidth="0.6" opacity="0.5" />
            <path d="M170,302 Q185,296 200,300" fill="none" stroke={C.sweater3} strokeWidth="0.6" opacity="0.5" />
            <path d="M96,340 Q130,334 150,338 Q170,334 204,340" fill="none" stroke={C.sweater3} strokeWidth="0.5" opacity="0.35" />
            <path d="M92,380 Q120,375 150,378 Q180,375 208,380" fill="none" stroke={C.sweater3} strokeWidth="0.5" opacity="0.3" />
            {/* 中线微痕 */}
            <line x1="150" y1="268" x2="150" y2="395" stroke={C.sweater3} strokeWidth="0.3" opacity="0.15" />

            {/* ═══ 手臂 ═══ */}
            {/* 左臂 */}
            <path d="M95,252 Q78,268 68,308" fill="none" stroke={C.sweater2} strokeWidth="20" strokeLinecap="round" />
            <path d="M95,252 Q78,268 68,308" fill="none" stroke={C.sweater3} strokeWidth="0.7" opacity="0.4" />
            {/* 挽袖折边 */}
            <ellipse cx="70" cy="298" rx="11" ry="4.5" fill="none" stroke={C.sweater4} strokeWidth="0.8" opacity="0.4" />
            <ellipse cx="70" cy="302" rx="11.5" ry="4" fill="none" stroke={C.sweater3} strokeWidth="0.5" opacity="0.3" />

            {/* 右臂 */}
            <path d="M205,252 Q222,268 232,308" fill="none" stroke={C.sweater2} strokeWidth="20" strokeLinecap="round" />
            <path d="M205,252 Q222,268 232,308" fill="none" stroke={C.sweater3} strokeWidth="0.7" opacity="0.4" />
            <ellipse cx="230" cy="298" rx="11" ry="4.5" fill="none" stroke={C.sweater4} strokeWidth="0.8" opacity="0.4" />
            <ellipse cx="230" cy="302" rx="11.5" ry="4" fill="none" stroke={C.sweater3} strokeWidth="0.5" opacity="0.3" />

            {/* ═══ 手部 ═══ */}
            {renderHands(cfg.handPose, trembleX)}
          </g>

          {/* ════════════════════════════════════════
               颈部
             ════════════════════════════════════════ */}
          <path d="M137,220 L137,242 Q137,248 143,248 L157,248 Q163,248 163,242 L163,220 Z" fill={C.skin2} />
          <ellipse cx="150" cy="242" rx="16" ry="4" fill={C.skin3} opacity="0.3" />

          {/* ════════════════════════════════════════
               头部 (Layer 7-14)
             ════════════════════════════════════════ */}
          <g transform={`rotate(${cfg.headTilt}, 150, 150) translate(0, ${breathT * -0.2})`}>

            {/* ── 后发层 ── */}
            <path
              d="M78,150 Q72,95 98,70 Q120,52 148,48 Q176,52 198,70 Q224,95 218,150 
                 Q216,125 208,108 Q195,85 150,78 Q105,85 92,108 Q84,125 78,150 Z"
              fill="url(#v3_hair)"
            />
            {/* 后发延伸到耳后 */}
            <path d="M78,150 Q75,165 78,178 Q80,172 82,160 Z" fill={C.hair1} />
            <path d="M218,150 Q221,165 218,178 Q216,172 214,160 Z" fill={C.hair1} />

            {/* ── 面部基础 ── */}
            {/* 脸型：椭圆+下颌收窄(关键！不是圆球) */}
            <ellipse cx="150" cy="148" rx="52" ry="60" fill="url(#v3_skin)" />
            {/* 下颌线修型 — 让脸不那么圆 */}
            <path
              d="M98,160 Q100,190 118,205 Q135,215 150,218 Q165,215 182,205 Q200,190 202,160"
              fill="url(#v3_skin)"
            />
            {/* 面部暖光区 */}
            <ellipse cx="145" cy="138" rx="35" ry="40" fill={C.skinWarm} opacity="0.15" />

            {/* ── 耳朵 ── */}
            <ellipse cx="97" cy="155" rx="8" ry="16" fill={C.skin2} />
            <ellipse cx="97" cy="155" rx="5.5" ry="12" fill={C.skin1} />
            <path d="M95,148 Q93,155 95,160" fill="none" stroke={C.skin3} strokeWidth="0.6" opacity="0.5" />
            <ellipse cx="203" cy="155" rx="8" ry="16" fill={C.skin2} />
            <ellipse cx="203" cy="155" rx="5.5" ry="12" fill={C.skin1} />
            <path d="M205,148 Q207,155 205,160" fill="none" stroke={C.skin3} strokeWidth="0.6" opacity="0.5" />
            {/* 耳尖泛红(脸红时) */}
            {cfg.blush > 0.1 && (
              <>
                <ellipse cx="96" cy="148" rx="5" ry="8" fill={C.blush} opacity={cfg.blush * 0.5} />
              </>
            )}

            {/* ── 耳钉(左耳) ── */}
            <g>
              <circle cx="96" cy="168" r="3" fill={C.earring} filter="url(#v3_softGlow)" />
              <circle cx="96" cy="168" r="1.3" fill={C.earringGlow} opacity="0.8" />
              <circle cx="95.2" cy="167" r="0.7" fill="#FFF" opacity="0.6" />
            </g>

            {/* ═══ 眉毛 ═══ */}
            {renderBrows(cfg.browType)}

            {/* ═══ 眼睛 — 角色灵魂 ═══ */}
            {renderEyesV3(cfg.eyeType, blinkT)}

            {/* ═══ 脸红区域 ═══ */}
            <ellipse cx="120" cy="168" rx="16" ry="8" fill="url(#v3_blushL)" />
            <ellipse cx="180" cy="168" rx="16" ry="8" fill="url(#v3_blushR)" />

            {/* ═══ 鼻子 — 极简暗示 ═══ */}
            <path d="M148,172 Q150,177 152,172" fill="none" stroke={C.skin3} strokeWidth="0.8" opacity="0.6" />
            <ellipse cx="149" cy="174" rx="1" ry="0.5" fill={C.skin3} opacity="0.2" />

            {/* ═══ 嘴巴 ═══ */}
            {renderMouthV3(cfg.mouthType)}

            {/* ═══ 眼镜 — 银色细框 ═══ */}
            <g transform={`translate(${cfg.glassShift}, 0)`}>
              {/* 左镜框 */}
              <rect x="112" y="144" width="30" height="22" rx="6" fill="none" stroke={C.glass} strokeWidth="1.2" />
              {/* 右镜框 */}
              <rect x="158" y="144" width="30" height="22" rx="6" fill="none" stroke={C.glass} strokeWidth="1.2" />
              {/* 鼻梁 */}
              <path d="M142,155 Q150,152 158,155" fill="none" stroke={C.glass} strokeWidth="0.9" />
              {/* 镜腿 */}
              <path d="M112,155 Q104,157 97,159" fill="none" stroke={C.glass} strokeWidth="0.7" />
              <path d="M188,155 Q196,157 203,159" fill="none" stroke={C.glass} strokeWidth="0.7" />
              {/* 镜片反光 — 主光(暖) */}
              <line x1="116" y1="148" x2="124" y2="146" stroke={C.glassShine} strokeWidth="0.6" opacity="0.5" />
              <line x1="162" y1="148" x2="170" y2="146" stroke={C.glassShine} strokeWidth="0.6" opacity="0.5" />
              {/* 镜片反光 — 补光(冷) */}
              <line x1="136" y1="162" x2="132" y2="164" stroke="#E0E8F8" strokeWidth="0.4" opacity="0.3" />
              <line x1="182" y1="162" x2="178" y2="164" stroke="#E0E8F8" strokeWidth="0.4" opacity="0.3" />
            </g>

            {/* ═══ 前发/刘海 — 多层(核心体积感修复) ═══ */}
            <g>
              {/* 发层1: 左侧大刘海 */}
              <path
                d={`M92,135 
                    Q${98 + hairT*0.3},100 ${110 + hairT*0.2},88
                    Q${105 + hairT*0.15},108 ${98 + hairT*0.2},130
                    Q95,138 92,142 Z`}
                fill={C.hair1}
              />
              {/* 发层2: 左中刘海 */}
              <path
                d={`M104,128 
                    Q${112 + hairT*0.25},86 ${128 + hairT*0.15},80
                    Q${118 + hairT*0.2},100 ${112 + hairT*0.2},125
                    Q108,132 104,135 Z`}
                fill={C.hair1}
              />
              {/* 发层3: 中央刘海 */}
              <path
                d={`M118,122 
                    Q${130 + hairT*0.15},78 ${150 + hairT*0.1},72
                    Q${140 + hairT*0.1},92 ${130 + hairT*0.15},118
                    Q124,125 118,128 Z`}
                fill={C.hair1}
              />
              {/* 发层4: 右侧刘海 */}
              <path
                d={`M142,118 
                    Q${155 - hairT*0.2},76 ${178 - hairT*0.3},82
                    Q${165 - hairT*0.25},95 ${155 - hairT*0.2},115
                    Q148,122 142,125 Z`}
                fill={C.hair1}
              />
              {/* 发层5: 右大 */}
              <path
                d={`M165,128 
                    Q${175 - hairT*0.25},84 ${200 - hairT*0.3},90
                    Q${190 - hairT*0.3},105 ${180 - hairT*0.25},130
                    Q172,138 165,140 Z`}
                fill={C.hair1}
              />

              {/* 高光流线 — 关键！让头发有光泽 */}
              <path
                d={`M100,130 Q${105 + hairT*0.2},98 ${115 + hairT*0.15},86`}
                fill="none" stroke={C.hairShine} strokeWidth="2.5" opacity="0.2" strokeLinecap="round"
              />
              <path
                d={`M116,122 Q${125 + hairT*0.15},88 ${140 + hairT*0.1},78`}
                fill="none" stroke={C.hair4} strokeWidth="2" opacity="0.2" strokeLinecap="round"
              />
              <path
                d={`M160,125 Q${168 - hairT*0.2},90 ${185 - hairT*0.25},85`}
                fill="none" stroke={C.hairShine} strokeWidth="2.5" opacity="0.18" strokeLinecap="round"
              />

              {/* 发丝细线 — 增加质感 */}
              <path d={`M96,138 Q${93 + hairT*0.4},145 ${95 + hairT*0.3},150`} fill="none" stroke={C.hair3} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
              <path d={`M200,135 Q${204 - hairT*0.3},142 ${202 - hairT*0.3},148`} fill="none" stroke={C.hair3} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

              {/* 微卷末梢(特征) */}
              <path
                d={`M88,142 Q${84 + hairT*0.5},150 ${87 + hairT*0.3},155`}
                fill="none" stroke={C.hair2} strokeWidth="3" strokeLinecap="round" opacity="0.7"
              />
              <path
                d={`M208,140 Q${212 - hairT*0.4},148 ${210 - hairT*0.3},153`}
                fill="none" stroke={C.hair2} strokeWidth="2.5" strokeLinecap="round" opacity="0.6"
              />

              {/* 头顶蓬松感 */}
              <ellipse cx="150" cy="62" rx="38" ry="12" fill={C.hair1} />
            </g>

            {/* ── 轮廓光(左侧微紫) ── */}
            <path
              d="M96,160 Q90,130 100,95"
              fill="none" stroke={C.rimLight} strokeWidth="1.5" opacity="0.12" strokeLinecap="round"
            />
          </g>
        </g>
      </g>

      {/* 心动粒子 */}
      {emotion === "heartbeat" && (
        <g>
          <circle cx="150" cy="280" r="3" fill={C.blush} opacity="0.3">
            <animate attributeName="r" values="3;7;3" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.08;0.3" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
}

// ─── 眼睛渲染(v3 — 对标国乙品质) ───
function renderEyesV3(eyeType, blinkT) {
  const L = { cx: 127, cy: 157 };
  const R = { cx: 173, cy: 157 };
  const irisRx = 8, irisRy = 9;

  // 闭眼
  if (eyeType === "closed") {
    return (
      <g>
        {[L, R].map((e, i) => (
          <g key={i}>
            <path d={`M${e.cx-10},${e.cy} Q${e.cx},${e.cy+5} ${e.cx+10},${e.cy}`} fill="none" stroke={C.eyeOuter} strokeWidth="1.5" strokeLinecap="round" />
            {/* 闭眼睫毛 */}
            <path d={`M${e.cx-9},${e.cy} Q${e.cx-12},${e.cy+3} ${e.cx-13},${e.cy+2}`} fill="none" stroke={C.brow} strokeWidth="0.6" opacity="0.5" />
            <path d={`M${e.cx+9},${e.cy} Q${e.cx+12},${e.cy+3} ${e.cx+13},${e.cy+2}`} fill="none" stroke={C.brow} strokeWidth="0.6" opacity="0.5" />
          </g>
        ))}
      </g>
    );
  }

  // 半闭/偷看
  if (eyeType === "half" || eyeType === "peek") {
    const openness = eyeType === "peek" ? 0.35 : 0.45;
    const gazeX = eyeType === "peek" ? 2.5 : 0;
    return (
      <g>
        {[L, R].map((e, i) => (
          <g key={i}>
            {/* 眼白 */}
            <ellipse cx={e.cx} cy={e.cy} rx={10} ry={10 * openness} fill={C.eyeWhite} />
            {/* 虹膜 */}
            <ellipse cx={e.cx + gazeX} cy={e.cy} rx={irisRx * 0.85} ry={irisRy * openness * 0.9} fill={`url(#v3_iris${i===0?'L':'R'})`} />
            {/* 瞳孔 */}
            <ellipse cx={e.cx + gazeX} cy={e.cy} rx="2.5" ry={3 * openness} fill={C.pupil} />
            {/* 高光 */}
            <circle cx={e.cx + gazeX + 2} cy={e.cy - 1} r={1.5 * openness} fill={C.eyeHighlight1} opacity="0.9" />
            {/* 上睫毛 */}
            <path d={`M${e.cx-10},${e.cy - 10*openness} Q${e.cx},${e.cy - 10*openness - 3} ${e.cx+10},${e.cy - 10*openness}`} fill="none" stroke={C.brow} strokeWidth="1.5" strokeLinecap="round" />
            {/* 下睫毛线 */}
            <path d={`M${e.cx-8},${e.cy + 10*openness - 1} Q${e.cx},${e.cy + 10*openness + 1} ${e.cx+8},${e.cy + 10*openness - 1}`} fill="none" stroke={C.skin3} strokeWidth="0.5" opacity="0.4" />
          </g>
        ))}
      </g>
    );
  }

  // 窄眼(吃醋)
  if (eyeType === "narrow") {
    return (
      <g>
        {[L, R].map((e, i) => (
          <g key={i}>
            <ellipse cx={e.cx} cy={e.cy} rx="9" ry="5" fill={C.eyeWhite} />
            <ellipse cx={e.cx + 1} cy={e.cy} rx={irisRx * 0.8} ry="4.5" fill={`url(#v3_iris${i===0?'L':'R'})`} />
            <ellipse cx={e.cx + 1} cy={e.cy} rx="2" ry="2.5" fill={C.pupil} />
            <circle cx={e.cx + 2.5} cy={e.cy - 1} r="1.2" fill={C.eyeHighlight1} opacity="0.85" />
            <path d={`M${e.cx-10},${e.cy-4} Q${e.cx},${e.cy-8} ${e.cx+10},${e.cy-4}`} fill="none" stroke={C.brow} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        ))}
      </g>
    );
  }

  // 视线移开
  if (eyeType === "glance") {
    return (
      <g>
        {[L, R].map((e, i) => (
          <g key={i}>
            <ellipse cx={e.cx} cy={e.cy} rx="10" ry="10" fill={C.eyeWhite} />
            <ellipse cx={e.cx - 3} cy={e.cy + 1.5} rx={irisRx} ry={irisRy} fill={`url(#v3_iris${i===0?'L':'R'})`} />
            <ellipse cx={e.cx - 3} cy={e.cy + 1.5} rx="2.8" ry="3.2" fill={C.pupil} />
            <circle cx={e.cx - 1} cy={e.cy - 0.5} r="1.8" fill={C.eyeHighlight1} opacity="0.85" />
            <circle cx={e.cx - 4} cy={e.cy + 3} r="0.8" fill={C.eyeHighlight3} opacity="0.4" />
            {renderLashes(e, 10)}
          </g>
        ))}
      </g>
    );
  }

  // 透过镜片上方看
  if (eyeType === "over_rim") {
    return (
      <g>
        {[L, R].map((e, i) => (
          <g key={i}>
            <ellipse cx={e.cx} cy={e.cy - 2} rx="9.5" ry="9" fill={C.eyeWhite} />
            <ellipse cx={e.cx} cy={e.cy - 3} rx={irisRx} ry={irisRy * 0.9} fill={`url(#v3_iris${i===0?'L':'R'})`} />
            <ellipse cx={e.cx} cy={e.cy - 3} rx="2.8" ry="3" fill={C.pupil} />
            <circle cx={e.cx + 2} cy={e.cy - 5.5} r="2" fill={C.eyeHighlight1} opacity="0.9" />
            <circle cx={e.cx - 1.5} cy={e.cy - 1} r="0.8" fill={C.eyeHighlight3} opacity="0.35" />
            {renderLashes({ cx: e.cx, cy: e.cy - 2 }, 9)}
          </g>
        ))}
      </g>
    );
  }

  // 心动·瞳孔扩大
  if (eyeType === "sparkle") {
    return (
      <g>
        {[L, R].map((e, i) => (
          <g key={i}>
            <ellipse cx={e.cx} cy={e.cy} rx="11" ry="11.5" fill={C.eyeWhite} />
            <ellipse cx={e.cx + 0.5} cy={e.cy} rx={irisRx + 1} ry={irisRy + 1} fill={`url(#v3_iris${i===0?'L':'R'})`} />
            <ellipse cx={e.cx + 0.5} cy={e.cy} rx="3.5" ry="4" fill={C.pupil} />
            {/* 大主高光 */}
            <circle cx={e.cx + 3} cy={e.cy - 3} r="2.8" fill={C.eyeHighlight1} opacity="0.95" />
            {/* 次高光 */}
            <circle cx={e.cx - 2} cy={e.cy + 2} r="1.5" fill={C.eyeHighlight2} opacity="0.5" />
            {/* 星光点 */}
            <circle cx={e.cx + 4.5} cy={e.cy - 5} r="0.8" fill="#FFF" opacity="0.7" />
            <circle cx={e.cx - 3.5} cy={e.cy + 4} r="0.6" fill={C.eyeHighlight3} opacity="0.4" />
            {renderLashes(e, 11.5)}
          </g>
        ))}
      </g>
    );
  }

  // 直视(告白)
  if (eyeType === "direct") {
    return (
      <g>
        {[L, R].map((e, i) => (
          <g key={i}>
            <ellipse cx={e.cx} cy={e.cy} rx="10" ry="10.5" fill={C.eyeWhite} />
            <ellipse cx={e.cx} cy={e.cy} rx={irisRx} ry={irisRy} fill={`url(#v3_iris${i===0?'L':'R'})`} />
            <ellipse cx={e.cx} cy={e.cy} rx="3" ry="3.5" fill={C.pupil} />
            <circle cx={e.cx + 2.5} cy={e.cy - 2.5} r="2.2" fill={C.eyeHighlight1} opacity="0.95" />
            <circle cx={e.cx - 1.5} cy={e.cy + 1.5} r="1" fill={C.eyeHighlight3} opacity="0.45" />
            {renderLashes(e, 10.5)}
          </g>
        ))}
      </g>
    );
  }

  // 守护注视
  if (eyeType === "protective") {
    return (
      <g>
        {[L, R].map((e, i) => (
          <g key={i}>
            <ellipse cx={e.cx} cy={e.cy} rx="10" ry="9.5" fill={C.eyeWhite} />
            <ellipse cx={e.cx + 0.5} cy={e.cy + 0.5} rx={irisRx} ry={irisRy * 0.95} fill={`url(#v3_iris${i===0?'L':'R'})`} />
            <ellipse cx={e.cx + 0.5} cy={e.cy + 0.5} rx="2.8" ry="3.2" fill={C.pupil} />
            {/* 柔化高光——心疼 */}
            <circle cx={e.cx + 2} cy={e.cy - 1.5} r="2.5" fill={C.eyeHighlight2} opacity="0.7" />
            <circle cx={e.cx - 1.5} cy={e.cy + 2} r="1.2" fill={C.eyeHighlight3} opacity="0.35" />
            {renderLashes(e, 9.5)}
          </g>
        ))}
      </g>
    );
  }

  // 微笑眼
  if (eyeType === "smile") {
    return (
      <g>
        {[L, R].map((e, i) => (
          <g key={i}>
            <ellipse cx={e.cx} cy={e.cy} rx="10" ry="7.5" fill={C.eyeWhite} />
            <ellipse cx={e.cx + 0.5} cy={e.cy} rx={irisRx} ry="6.5" fill={`url(#v3_iris${i===0?'L':'R'})`} />
            <ellipse cx={e.cx + 0.5} cy={e.cy} rx="2.5" ry="3" fill={C.pupil} />
            <circle cx={e.cx + 2} cy={e.cy - 2} r="1.8" fill={C.eyeHighlight1} opacity="0.9" />
            <circle cx={e.cx - 1} cy={e.cy + 1} r="0.8" fill={C.eyeHighlight3} opacity="0.35" />
            {/* 眼尾微弯——笑意 */}
            <path d={`M${e.cx+8},${e.cy-4} Q${e.cx+11},${e.cy-1} ${e.cx+9},${e.cy+2}`} fill="none" stroke={C.brow} strokeWidth="0.5" opacity="0.3" />
            {renderLashes(e, 7.5)}
          </g>
        ))}
      </g>
    );
  }

  // 默认开眼(含眨眼)
  const ry = 10 * blinkT;
  return (
    <g>
      {[L, R].map((e, i) => (
        <g key={i}>
          {blinkT > 0.15 ? (
            <>
              <ellipse cx={e.cx} cy={e.cy} rx="10" ry={ry} fill={C.eyeWhite} />
              <ellipse cx={e.cx + 0.5} cy={e.cy} rx={irisRx} ry={Math.min(irisRy, ry - 1)} fill={`url(#v3_iris${i===0?'L':'R'})`} />
              <ellipse cx={e.cx + 0.5} cy={e.cy} rx="2.8" ry={Math.min(3.2, ry * 0.32)} fill={C.pupil} />
              {blinkT > 0.5 && (
                <>
                  {/* 主高光——右上(暖) */}
                  <circle cx={e.cx + 2.5} cy={e.cy - Math.max(ry * 0.3, 1)} r={2 * blinkT} fill={C.eyeHighlight1} opacity="0.9" />
                  {/* 次高光——左下(冷) */}
                  <circle cx={e.cx - 1.5} cy={e.cy + Math.max(ry * 0.15, 0.5)} r={0.9 * blinkT} fill={C.eyeHighlight3} opacity="0.4" />
                </>
              )}
              {/* 上睫毛 */}
              <path
                d={`M${e.cx-10},${e.cy - ry} Q${e.cx-6},${e.cy - ry - 2.5*blinkT} ${e.cx},${e.cy - ry - 3*blinkT} Q${e.cx+6},${e.cy - ry - 2.5*blinkT} ${e.cx+10},${e.cy - ry}`}
                fill="none" stroke={C.brow} strokeWidth="1.5" strokeLinecap="round"
              />
              {/* 上睫毛延伸 */}
              {blinkT > 0.6 && (
                <>
                  <path d={`M${e.cx-9},${e.cy - ry + 0.5} Q${e.cx-12},${e.cy - ry - 1} ${e.cx-13},${e.cy - ry + 1}`} fill="none" stroke={C.brow} strokeWidth="0.7" opacity="0.5" />
                  <path d={`M${e.cx+9},${e.cy - ry + 0.5} Q${e.cx+12},${e.cy - ry - 1} ${e.cx+13},${e.cy - ry + 1}`} fill="none" stroke={C.brow} strokeWidth="0.7" opacity="0.5" />
                </>
              )}
              {/* 下睫毛暗示 */}
              {blinkT > 0.7 && (
                <path d={`M${e.cx-7},${e.cy + ry - 1} Q${e.cx},${e.cy + ry + 0.5} ${e.cx+7},${e.cy + ry - 1}`} fill="none" stroke={C.skin3} strokeWidth="0.4" opacity="0.35" />
              )}
            </>
          ) : (
            /* 完全闭合 */
            <path d={`M${e.cx-10},${e.cy} Q${e.cx},${e.cy+2} ${e.cx+10},${e.cy}`} fill="none" stroke={C.eyeOuter} strokeWidth="1.5" strokeLinecap="round" />
          )}
        </g>
      ))}
    </g>
  );
}

// ─── 睫毛渲染辅助 ───
function renderLashes(e, ry) {
  return (
    <>
      {/* 上睫毛弧线 */}
      <path
        d={`M${e.cx-10},${e.cy - ry} Q${e.cx-5},${e.cy - ry - 3} ${e.cx},${e.cy - ry - 3.5} Q${e.cx+5},${e.cy - ry - 3} ${e.cx+10},${e.cy - ry}`}
        fill="none" stroke={C.brow} strokeWidth="1.6" strokeLinecap="round"
      />
      {/* 外角睫毛 */}
      <path d={`M${e.cx-9},${e.cy - ry + 0.5} Q${e.cx-12},${e.cy - ry - 1} ${e.cx-13},${e.cy - ry + 1}`} fill="none" stroke={C.brow} strokeWidth="0.7" opacity="0.5" />
      <path d={`M${e.cx+9},${e.cy - ry + 0.5} Q${e.cx+12},${e.cy - ry - 1} ${e.cx+13},${e.cy - ry + 1}`} fill="none" stroke={C.brow} strokeWidth="0.7" opacity="0.5" />
      {/* 下睫毛线 */}
      <path d={`M${e.cx-7},${e.cy + ry - 1} Q${e.cx},${e.cy + ry + 0.5} ${e.cx+7},${e.cy + ry - 1}`} fill="none" stroke={C.skin3} strokeWidth="0.4" opacity="0.35" />
    </>
  );
}

// ─── 眉毛渲染 ───
function renderBrows(browType) {
  const L = 127, R = 173, y = 138;
  const w = 1.4;

  switch (browType) {
    case "furrow":
      return (
        <g>
          <path d={`M${L-12},${y-1} Q${L},${y-6} ${L+12},${y}`} fill="none" stroke={C.brow} strokeWidth={w + 0.2} strokeLinecap="round" />
          <path d={`M${R-12},${y} Q${R},${y-6} ${R+12},${y-1}`} fill="none" stroke={C.brow} strokeWidth={w + 0.2} strokeLinecap="round" />
        </g>
      );
    case "inner_furrow":
      return (
        <g>
          <path d={`M${L-12},${y} Q${L},${y-4} ${L+12},${y+1}`} fill="none" stroke={C.brow} strokeWidth={w} strokeLinecap="round" />
          <path d={`M${R-12},${y+1} Q${R},${y-4} ${R+12},${y}`} fill="none" stroke={C.brow} strokeWidth={w} strokeLinecap="round" />
        </g>
      );
    case "soft_up":
      return (
        <g>
          <path d={`M${L-11},${y+1} Q${L},${y-5} ${L+11},${y}`} fill="none" stroke={C.brow} strokeWidth={w} strokeLinecap="round" />
          <path d={`M${R-11},${y} Q${R},${y-5} ${R+11},${y+1}`} fill="none" stroke={C.brow} strokeWidth={w} strokeLinecap="round" />
        </g>
      );
    case "tension":
      return (
        <g>
          <path d={`M${L-12},${y} Q${L},${y-5} ${L+12},${y-1}`} fill="none" stroke={C.brow} strokeWidth={w + 0.2} strokeLinecap="round" />
          <path d={`M${R-12},${y-1} Q${R},${y-5} ${R+12},${y}`} fill="none" stroke={C.brow} strokeWidth={w + 0.2} strokeLinecap="round" />
        </g>
      );
    case "relaxed":
      return (
        <g>
          <path d={`M${L-11},${y+1} Q${L},${y-3} ${L+11},${y+1}`} fill="none" stroke={C.brow} strokeWidth={w - 0.2} strokeLinecap="round" />
          <path d={`M${R-11},${y+1} Q${R},${y-3} ${R+11},${y+1}`} fill="none" stroke={C.brow} strokeWidth={w - 0.2} strokeLinecap="round" />
        </g>
      );
    default: // natural
      return (
        <g>
          <path d={`M${L-11},${y} Q${L},${y-4} ${L+11},${y}`} fill="none" stroke={C.brow} strokeWidth={w} strokeLinecap="round" />
          <path d={`M${R-11},${y} Q${R},${y-4} ${R+11},${y}`} fill="none" stroke={C.brow} strokeWidth={w} strokeLinecap="round" />
        </g>
      );
  }
}

// ─── 嘴巴渲染 ───
function renderMouthV3(mouthType) {
  const cx = 150, cy = 190;

  switch (mouthType) {
    case "smile":
      return (
        <g>
          <path d={`M${cx-8},${cy-1} Q${cx},${cy+5} ${cx+8},${cy-1}`} fill="none" stroke={C.lip} strokeWidth="1.3" strokeLinecap="round" />
          {/* 唇部光泽 */}
          <ellipse cx={cx + 1} cy={cy + 1} rx="3" ry="1" fill={C.lipHighlight} opacity="0.15" />
        </g>
      );
    case "warm_smile":
      return (
        <g>
          <path d={`M${cx-7},${cy} Q${cx},${cy+4} ${cx+7},${cy}`} fill="none" stroke={C.lip} strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx={cx} cy={cy + 1.5} rx="2.5" ry="0.8" fill={C.lipHighlight} opacity="0.12" />
        </g>
      );
    case "gentle":
      return (
        <path d={`M${cx-6},${cy} Q${cx},${cy+3} ${cx+6},${cy}`} fill="none" stroke={C.lip} strokeWidth="1.1" strokeLinecap="round" />
      );
    case "flat":
      return <line x1={cx-6} y1={cy} x2={cx+6} y2={cy} stroke={C.lipShadow} strokeWidth="1" strokeLinecap="round" />;
    case "surprised":
      return (
        <g>
          <ellipse cx={cx} cy={cy + 1} rx="3.5" ry="2.5" fill={C.lipShadow} opacity="0.5" />
          <path d={`M${cx-4},${cy} Q${cx},${cy-1} ${cx+4},${cy}`} fill="none" stroke={C.lip} strokeWidth="0.8" />
        </g>
      );
    case "pursed":
      return <path d={`M${cx-4},${cy} Q${cx},${cy+1.5} ${cx+4},${cy}`} fill="none" stroke={C.lip} strokeWidth="1" strokeLinecap="round" />;
    case "flustered":
      return (
        <g>
          <path d={`M${cx-4},${cy} Q${cx-1},${cy+1} ${cx},${cy} Q${cx+1},${cy+1} ${cx+4},${cy}`} fill="none" stroke={C.lip} strokeWidth="1" strokeLinecap="round" />
        </g>
      );
    case "tight":
      return <path d={`M${cx-5},${cy} Q${cx},${cy+0.5} ${cx+5},${cy}`} fill="none" stroke={C.lip} strokeWidth="1.2" strokeLinecap="round" />;
    case "tremble":
      return <path d={`M${cx-5},${cy} Q${cx-2},${cy+1} ${cx},${cy-0.5} Q${cx+2},${cy+1} ${cx+5},${cy}`} fill="none" stroke={C.lip} strokeWidth="1" strokeLinecap="round" />;
    default: // neutral
      return <path d={`M${cx-5},${cy} Q${cx},${cy+2.5} ${cx+5},${cy}`} fill="none" stroke={C.lip} strokeWidth="1.1" strokeLinecap="round" />;
  }
}

// ─── 手部渲染 ───
function renderHands(handPose, trembleX) {
  switch (handPose) {
    case "push_glass":
      return (
        <g>
          {/* 左手自然 */}
          <g>
            <ellipse cx="68" cy="316" rx="8" ry="9" fill={C.hand1} />
            <ellipse cx="68" cy="316" rx="6" ry="7" fill={C.hand1} />
            {/* 手指暗示 */}
            <path d="M62,312 Q60,316 62,320" fill="none" stroke={C.hand2} strokeWidth="0.6" opacity="0.4" />
          </g>
          {/* 右手推镜——中指触碰镜框中梁 */}
          <g>
            <path d="M220,300 Q200,270 175,200 Q170,185 165,175 Q160,168 155,165" fill="none" stroke={C.hand1} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
            <ellipse cx="156" cy="163" rx="4" ry="5" fill={C.hand1} />
            {/* 指尖细节 */}
            <circle cx="154" cy="160" r="2" fill={C.hand2} opacity="0.5" />
          </g>
        </g>
      );
    case "ear_touch":
      return (
        <g>
          <g>
            <ellipse cx="68" cy="316" rx="8" ry="9" fill={C.hand1} />
            <path d="M62,312 Q60,316 62,320" fill="none" stroke={C.hand2} strokeWidth="0.6" opacity="0.4" />
          </g>
          {/* 右手摸左耳 */}
          <g>
            <path d="M230,308 Q210,260 180,200 Q165,175 140,165 Q120,158 100,160" fill="none" stroke={C.hand1} strokeWidth="6" strokeLinecap="round" opacity="0.85" />
            <ellipse cx="100" cy="160" rx="5" ry="6" fill={C.hand1} />
          </g>
        </g>
      );
    case "cover":
      return (
        <g>
          {/* 双手捂脸 */}
          <ellipse cx="130" cy="168" rx="9" ry="10" fill={C.hand1} />
          <ellipse cx="150" cy="162" rx="8" ry="9" fill={C.hand1} />
          <ellipse cx="170" cy="168" rx="9" ry="10" fill={C.hand1} />
          {/* 指缝 */}
          <line x1="138" y1="164" x2="140" y2="174" stroke={C.hand2} strokeWidth="0.7" opacity="0.5" />
          <line x1="160" y1="164" x2="162" y2="174" stroke={C.hand2} strokeWidth="0.7" opacity="0.5" />
        </g>
      );
    case "book":
      return (
        <g>
          <g>
            <ellipse cx="68" cy="316" rx="8" ry="9" fill={C.hand1} />
            <path d="M62,312 Q60,316 62,320" fill="none" stroke={C.hand2} strokeWidth="0.6" opacity="0.4" />
          </g>
          <g>
            <ellipse cx="232" cy="316" rx="8" ry="9" fill={C.hand1} />
            <path d="M238,312 Q240,316 238,320" fill="none" stroke={C.hand2} strokeWidth="0.6" opacity="0.4" />
            {/* 书 */}
            <rect x="218" y="300" width="20" height="28" rx="2" fill="#EAE2D6" stroke={C.sweater4} strokeWidth="0.5" transform="rotate(-8, 228, 314)" />
            <line x1="228" y1="301" x2="228" y2="327" stroke={C.sweater4} strokeWidth="0.4" transform="rotate(-8, 228, 314)" />
          </g>
        </g>
      );
    case "tremble":
      return (
        <g>
          <ellipse cx={68 + trembleX * 1.5} cy={316 + Math.random() * 0.5} rx="8" ry="9" fill={C.hand1} />
          <ellipse cx={232 + trembleX * 1.5} cy={316 + Math.random() * 0.5} rx="8" ry="9" fill={C.hand1} />
        </g>
      );
    default: // relax
      return (
        <g>
          <g>
            <ellipse cx="68" cy="316" rx="8" ry="9" fill={C.hand1} />
            <ellipse cx="68" cy="316" rx="6.5" ry="7.5" fill={C.hand1} />
            <path d="M62,312 Q60,316 62,320" fill="none" stroke={C.hand2} strokeWidth="0.6" opacity="0.4" />
            <path d="M65,310 Q63,311 62,313" fill="none" stroke={C.hand2} strokeWidth="0.5" opacity="0.3" />
          </g>
          <g>
            <ellipse cx="232" cy="316" rx="8" ry="9" fill={C.hand1} />
            <ellipse cx="232" cy="316" rx="6.5" ry="7.5" fill={C.hand1} />
            <path d="M238,312 Q240,316 238,320" fill="none" stroke={C.hand2} strokeWidth="0.6" opacity="0.4" />
            <path d="M235,310 Q237,311 238,313" fill="none" stroke={C.hand2} strokeWidth="0.5" opacity="0.3" />
          </g>
        </g>
      );
  }
}

// ═══════════════════════════════════════════════════
//  交互展示面板
// ═══════════════════════════════════════════════════

const EXPR_GROUPS = [
  {
    label: "基础",
    items: [
      { id: "default", name: "默认 · 温和", desc: "国乙学者型标配：温润、可靠、让人安心", level: "L1+" },
      { id: "smile", name: "微笑", desc: "笑意到眼底——许墨式'不是商业微笑'", level: "L1+" },
      { id: "push_glasses", name: "推眼镜", desc: "黎深标志动作：中指触碰镜框中梁，微低头", level: "L1+" },
    ],
  },
  {
    label: "情感升温",
    items: [
      { id: "shy", name: "害羞 · 摸耳朵", desc: "原创紧张小动作，耳钉微晃——被指出后会停", level: "L3+" },
      { id: "blush_light", name: "微泛红", desc: "颧骨→耳根蔓延，耳尖同步，瞳孔微扩", level: "L3+" },
      { id: "blush_deep", name: "深度脸红", desc: "捂脸但指缝偷看——黎深被调戏的经典反应", level: "L4+" },
      { id: "peek", name: "偷看", desc: "头微侧，瞳孔偏移，假装不在看你", level: "L3+" },
      { id: "heartbeat", name: "心动", desc: "瞳孔扩大+星光高光+心跳粒子——恋爱脑时刻", level: "L4+" },
    ],
  },
  {
    label: "深层表达",
    items: [
      { id: "gentle_close", name: "温柔闭眼", desc: "许墨式温柔：闭眼微笑，身体微倾向你", level: "L4+" },
      { id: "jealous", name: "吃醋", desc: "窄眼+抿嘴+书拿反了——嘴上说没事体温升了两度", level: "L3+" },
      { id: "protective", name: "守护注视", desc: "心疼但不说——眉微蹙，嘴抿紧，眼神柔到化", level: "L4+" },
      { id: "confession", name: "告白微颤", desc: "看似平静手在抖——这就是陆知行的告白", level: "L4" },
    ],
  },
];

const ENV_LIST = [
  { id: "day", label: "白天", bg: "linear-gradient(180deg, #f5f0ea 0%, #e8ddd0 100%)" },
  { id: "morning", label: "清晨", bg: "linear-gradient(180deg, #FFF5E8 0%, #F0E4D4 100%)" },
  { id: "night", label: "夜晚", bg: "linear-gradient(180deg, #1a1a2e 0%, #0f3460 100%)" },
  { id: "rain", label: "雨天", bg: "linear-gradient(180deg, #5a6570 0%, #8a9aab 100%)" },
  { id: "confess", label: "告白", bg: "linear-gradient(180deg, #2d1b33 0%, #3a2030 100%)" },
  { id: "warm", label: "暖光", bg: "linear-gradient(180deg, #FFF8F0 0%, #F0E4D4 100%)" },
];

export default function ZhixingShowcaseV3() {
  const [emotion, setEmotion] = useState("default");
  const [env, setEnv] = useState("day");

  const envBg = ENV_LIST.find(e => e.id === env)?.bg || ENV_LIST[0].bg;
  const isDark = ["night", "rain", "confess"].includes(env);
  const currentExpr = EXPR_GROUPS.flatMap(g => g.items).find(i => i.id === emotion);
  const cfg = EXPRESSIONS[emotion] || EXPRESSIONS.default;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08070A",
      color: "#d8d0c8",
      fontFamily: "'Noto Sans SC', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        button { font-family: inherit; }
      `}</style>

      {/* Header */}
      <header style={{ padding: "20px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 3 }}>
          <span style={{ fontSize: 9, letterSpacing: 4, color: "#4a3a2a" }}>DESKBUDDY</span>
          <span style={{ fontSize: 9, color: "#2a2520" }}>×</span>
          <span style={{ fontSize: 9, letterSpacing: 2, color: "#3a2a1a" }}>Character v3 · 国乙美学</span>
        </div>
        <h1 style={{
          fontSize: 18, fontWeight: 600,
          fontFamily: "'Noto Serif SC', Georgia, serif",
          color: "#D4B896",
        }}>
          陆知行 · 角色重构
        </h1>
        <p style={{ fontSize: 10, color: "#4a4540", marginTop: 2 }}>
          对标：许墨 温润感 × 黎深 精度感 × 莫弈 知性感 → Spine 2D 融合
        </p>
      </header>

      {/* Main */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>

        {/* ── 左：表情选择 ── */}
        <div style={{
          width: 240, borderRight: "1px solid rgba(255,255,255,0.03)",
          overflowY: "auto", padding: "14px 10px", flexShrink: 0,
        }}>
          <div style={{ fontSize: 8, letterSpacing: 3, color: "#5a4a3a", marginBottom: 10 }}>EXPRESSION</div>
          {EXPR_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 9, color: "#4a4540", letterSpacing: 2, marginBottom: 5,
                paddingBottom: 3, borderBottom: "1px solid rgba(255,255,255,0.02)",
              }}>{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setEmotion(item.id)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "7px 8px", marginBottom: 1, borderRadius: 5,
                    background: emotion === item.id ? "rgba(212,184,150,0.06)" : "transparent",
                    border: emotion === item.id ? "1px solid rgba(212,184,150,0.12)" : "1px solid transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, color: emotion === item.id ? "#e0d8d0" : "#908880",
                      fontWeight: emotion === item.id ? 500 : 400,
                    }}>
                      {item.name}
                    </span>
                    <span style={{
                      fontSize: 8, padding: "1px 5px", borderRadius: 99,
                      background: "rgba(212,184,150,0.06)", color: "#6a5a4a",
                    }}>{item.level}</span>
                  </div>
                  {emotion === item.id && (
                    <div style={{ fontSize: 10, color: "#5a5550", marginTop: 2, lineHeight: 1.5 }}>{item.desc}</div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* ── 中央：舞台 ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* 环境条 */}
          <div style={{
            padding: "8px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.02)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 8, letterSpacing: 2, color: "#4a4540" }}>ENV</span>
            {ENV_LIST.map(e => (
              <button key={e.id} onClick={() => setEnv(e.id)} style={{
                padding: "2px 8px", borderRadius: 99, fontSize: 9,
                background: env === e.id ? "rgba(212,184,150,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${env === e.id ? "rgba(212,184,150,0.18)" : "rgba(255,255,255,0.03)"}`,
                color: env === e.id ? "#D4B896" : "#4a4540",
                cursor: "pointer",
              }}>
                {e.label}
              </button>
            ))}
          </div>

          {/* 舞台 */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            background: envBg,
            transition: "background 0.6s ease",
          }}>
            <div style={{ position: "relative", zIndex: 10 }}>
              <ZhixingV3 emotion={emotion} env={env} scale={0.95} />
            </div>
            {/* 标签 */}
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              padding: "4px 14px", borderRadius: 99, fontSize: 10,
              background: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.65)",
              backdropFilter: "blur(6px)",
              color: isDark ? "#c8c0b8" : "#3a3530",
              fontFamily: "'Noto Serif SC', Georgia, serif",
              zIndex: 15,
            }}>
              {currentExpr?.name || "—"}
            </div>
          </div>
        </div>

        {/* ── 右：规格 ── */}
        <div style={{
          width: 230, borderLeft: "1px solid rgba(255,255,255,0.03)",
          overflowY: "auto", padding: "14px 12px", flexShrink: 0,
        }}>
          <div style={{ fontSize: 8, letterSpacing: 3, color: "#5a4a3a", marginBottom: 12 }}>SPEC</div>

          {currentExpr && (() => {
            const params = [
              { label: "脸红", value: `${(cfg.blush * 100).toFixed(0)}%`, on: cfg.blush > 0 },
              { label: "头倾", value: `${cfg.headTilt}°`, on: cfg.headTilt !== 0 },
              { label: "身倾", value: `${cfg.bodyLean}°`, on: cfg.bodyLean > 0 },
              { label: "眼型", value: cfg.eyeType, on: true },
              { label: "嘴型", value: cfg.mouthType, on: true },
              { label: "眉型", value: cfg.browType, on: cfg.browType !== "natural" },
              { label: "手部", value: cfg.handPose, on: cfg.handPose !== "relax" },
              { label: "镜移", value: `${cfg.glassShift}`, on: cfg.glassShift !== 0 },
            ];
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "#e0d8d0", marginBottom: 3,
                  fontFamily: "'Noto Serif SC', Georgia, serif",
                }}>{currentExpr.name}</div>
                <div style={{ fontSize: 10, color: "#5a5550", lineHeight: 1.5, marginBottom: 12 }}>{currentExpr.desc}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {params.map((p, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "3px 6px", borderRadius: 3,
                      background: p.on ? "rgba(212,184,150,0.04)" : "transparent",
                      fontSize: 10,
                    }}>
                      <span style={{ color: p.on ? "#908880" : "#2a2520" }}>{p.label}</span>
                      <span style={{
                        color: p.on ? "#C8A878" : "#2a2520",
                        fontFamily: "monospace", fontSize: 9,
                      }}>{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Spine调用 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 8, letterSpacing: 2, color: "#4a4540", marginBottom: 6 }}>SPINE</div>
            <div style={{
              background: "rgba(0,0,0,0.2)", borderRadius: 5, padding: 8,
              fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 9, lineHeight: 1.8,
              border: "1px solid rgba(255,255,255,0.02)",
            }}>
              <div style={{ color: "#4a4540" }}>// Track 0</div>
              <div style={{ color: "#6a8a5a" }}>play(<span style={{ color: "#b09060" }}>"idle"</span>)</div>
              {cfg.blush > 0 && (
                <>
                  <div style={{ color: "#4a4540", marginTop: 3 }}>// Track 1</div>
                  <div style={{ color: "#6a8a5a" }}>blend(<span style={{ color: "#b09060" }}>"{emotion}"</span>)</div>
                </>
              )}
            </div>
          </div>

          {/* 对标参考 */}
          <div>
            <div style={{ fontSize: 8, letterSpacing: 2, color: "#4a4540", marginBottom: 6 }}>美学对标</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { src: "许墨", trait: "温润色调 · 暖光高光", c: "#C4386A" },
                { src: "黎深", trait: "眼镜精度 · 虹膜层次", c: "#1B6B93" },
                { src: "莫弈", trait: "知性气质 · 微表情", c: "#3A6EA5" },
              ].map((ref, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 6px", borderRadius: 4,
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.02)",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: ref.c, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: "#908880", fontWeight: 500 }}>{ref.src}</div>
                    <div style={{ fontSize: 9, color: "#4a4540" }}>{ref.trait}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
