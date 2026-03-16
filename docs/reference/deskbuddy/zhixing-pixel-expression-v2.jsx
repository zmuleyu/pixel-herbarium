import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── Expanded Palettes: more skin/hair/facial detail tones ───
const PALETTES = {
  mard168: {
    name: "MARD 168色",
    desc: "国产主流，肤色层次丰富",
    colors: {
      skinLight:    "#FBDFCA",
      skin:         "#F5D2B4",
      skinMid:      "#E8BA96",
      skinShadow:   "#D4A074",
      skinDeep:     "#BA8460",
      hairBlack:    "#1C1C28",
      hairDark:     "#2A2838",
      hairMid:      "#3E3C50",
      hairHighlight:"#5A5870",
      hairShine:    "#78768E",
      eyeWhite:     "#FAFAFA",
      eyeIris:      "#3D2B1F",
      eyeIrisMid:   "#5C4030",
      eyeIrisRing:  "#2A1A10",
      eyePupil:     "#0E0E0E",
      eyeHighlight: "#FFFFFF",
      eyeLash:      "#1A1418",
      eyeLid:       "#C8986C",
      eyeBrow:      "#2A2430",
      glassFrame:   "#B0B4BC",
      glassFrameHi: "#D0D4DC",
      glassLens:    "#DAE6F2",
      glassLensSh:  "#C2D0DE",
      glassReflect: "#EEF4FA",
      noseTip:      "#DEB090",
      noseSide:     "#CCA07C",
      lipTop:       "#C87068",
      lipBottom:    "#D88078",
      lipHighlight: "#E09888",
      lipLine:      "#B05850",
      blush:        "#F0B0A0",
      blushLight:   "#F4C8BC",
      earStud:      "#C8CCD4",
      earStudShine: "#E8ECF0",
      sweaterBase:  "#F5F0E4",
      sweaterLight: "#FEFCF6",
      sweaterShadow:"#E0D8C8",
      sweaterKnit:  "#EAE2D2",
      sweaterDeep:  "#D0C4B0",
      outline:      "#1C1C28",
      bg:           "#F8F6F2",
      transparent:  "transparent",
    }
  },
  coco120: {
    name: "COCO 120色",
    desc: "低饱和马卡龙，柔和质感",
    colors: {
      skinLight:    "#F6DCC8",
      skin:         "#F0D0B8",
      skinMid:      "#DEB89C",
      skinShadow:   "#C8A080",
      skinDeep:     "#B08868",
      hairBlack:    "#2E2838",
      hairDark:     "#221C2E",
      hairMid:      "#423C54",
      hairHighlight:"#5E586E",
      hairShine:    "#7A748A",
      eyeWhite:     "#F6F4F2",
      eyeIris:      "#483C34",
      eyeIrisMid:   "#604C40",
      eyeIrisRing:  "#342820",
      eyePupil:     "#181414",
      eyeHighlight: "#FAFAFA",
      eyeLash:      "#201820",
      eyeLid:       "#C09474",
      eyeBrow:      "#302830",
      glassFrame:   "#A8AABC",
      glassFrameHi: "#C8CADC",
      glassLens:    "#D4DEE8",
      glassLensSh:  "#BCC8D4",
      glassReflect: "#E8F0F6",
      noseTip:      "#D4A88C",
      noseSide:     "#C49878",
      lipTop:       "#B86860",
      lipBottom:    "#C87870",
      lipHighlight: "#D49080",
      lipLine:      "#A05048",
      blush:        "#E4AAA0",
      blushLight:   "#ECC0B8",
      earStud:      "#B8BAC8",
      earStudShine: "#D8DAE4",
      sweaterBase:  "#EDE8E0",
      sweaterLight: "#F8F4EE",
      sweaterShadow:"#D4CCC0",
      sweaterKnit:  "#E2DCD0",
      sweaterDeep:  "#C4BAA8",
      outline:      "#2E2838",
      bg:           "#FAF8F4",
      transparent:  "transparent",
    }
  },
  pixel8: {
    name: "经典像素",
    desc: "怀旧暖调，有限色阶",
    colors: {
      skinLight:    "#FCE4A8",
      skin:         "#F8D080",
      skinMid:      "#E0B460",
      skinShadow:   "#C89848",
      skinDeep:     "#A07838",
      hairBlack:    "#102030",
      hairDark:     "#183048",
      hairMid:      "#284860",
      hairHighlight:"#386878",
      hairShine:    "#508890",
      eyeWhite:     "#F8F4E8",
      eyeIris:      "#183048",
      eyeIrisMid:   "#284860",
      eyeIrisRing:  "#102030",
      eyePupil:     "#081020",
      eyeHighlight: "#F8F8F0",
      eyeLash:      "#102030",
      eyeLid:       "#C89848",
      eyeBrow:      "#183048",
      glassFrame:   "#90A8B8",
      glassFrameHi: "#B0C8D8",
      glassLens:    "#C0D4E0",
      glassLensSh:  "#A0B8C8",
      glassReflect: "#D8E8F0",
      noseTip:      "#D8B068",
      noseSide:     "#C09850",
      lipTop:       "#C07058",
      lipBottom:    "#D08068",
      lipHighlight: "#D89878",
      lipLine:      "#A05840",
      blush:        "#E0A080",
      blushLight:   "#E8B898",
      earStud:      "#90A8B8",
      earStudShine: "#B0C8D8",
      sweaterBase:  "#F0E8D0",
      sweaterLight: "#F8F0E0",
      sweaterShadow:"#D8D0B8",
      sweaterKnit:  "#E4DCC4",
      sweaterDeep:  "#C8C0A4",
      outline:      "#081020",
      bg:           "#E8F0E0",
      transparent:  "transparent",
    }
  }
};

// ─── Helper: pixel drawing DSL ───
function makeGrid(W, H) {
  const g = Array.from({ length: H }, () => Array(W).fill("transparent"));
  const api = {
    g,
    s: (r, c, color) => { if (r >= 0 && r < H && c >= 0 && c < W) g[r][c] = color; },
    line: (r, c1, c2, color) => { for (let c = c1; c <= c2; c++) api.s(r, c, color); },
    col: (c, r1, r2, color) => { for (let r = r1; r <= r2; r++) api.s(r, c, color); },
    rect: (r1, c1, r2, c2, color) => { for (let r = r1; r <= r2; r++) api.line(r, c1, c2, color); },
  };
  return api;
}

// ──────────────────────────────────────────────
//  16×16
// ──────────────────────────────────────────────
function generateFace16(expr = "neutral") {
  const { g, s, line, rect } = makeGrid(16, 16);

  // Hair
  line(0, 5, 11, "hairBlack");
  line(1, 4, 12, "hairDark");
  line(2, 3, 12, "hairMid");
  s(1, 6, "hairHighlight"); s(1, 9, "hairHighlight");
  s(2, 5, "hairShine"); s(2, 10, "hairShine");

  // Side hair
  s(3, 3, "hairDark"); s(3, 4, "hairDark"); s(4, 3, "hairDark"); s(5, 3, "hairDark"); s(6, 3, "hairMid");
  s(3, 12, "hairDark"); s(4, 12, "hairDark"); s(5, 12, "hairDark");

  // Face
  line(3, 5, 11, "skinShadow");
  rect(4, 4, 5, 11, "skin");
  rect(6, 4, 7, 11, "skin");
  line(8, 5, 10, "skin");
  line(9, 6, 9, "skinMid");
  s(4, 7, "skinLight"); s(4, 8, "skinLight");
  s(8, 5, "skinMid"); s(8, 10, "skinMid");

  // Brows
  s(4, 5, "eyeBrow"); s(4, 6, "eyeBrow");
  s(4, 9, "eyeBrow"); s(4, 10, "eyeBrow");

  // Glasses
  line(5, 5, 7, "glassFrame"); s(5, 8, "glassFrame"); line(5, 8, 10, "glassFrame");
  s(6, 5, "glassFrame"); s(6, 7, "glassFrame"); s(6, 8, "glassFrame"); s(6, 10, "glassFrame");
  s(5, 6, "glassLens"); s(5, 9, "glassLens");
  s(6, 6, "glassLens"); s(6, 9, "glassLens");

  if (expr === "neutral") {
    s(6, 6, "eyeIris"); s(6, 9, "eyeIris");
  } else if (expr === "happy") {
    s(6, 6, "eyeLash"); s(6, 9, "eyeLash");
  } else if (expr === "shy") {
    s(6, 6, "eyeIris"); s(6, 9, "eyeIris");
    s(7, 5, "blush"); s(7, 6, "blushLight"); s(7, 9, "blushLight"); s(7, 10, "blush");
  } else if (expr === "thinking") {
    s(6, 6, "eyeIris"); s(6, 10, "eyeIris");
    s(3, 5, "hairHighlight");
  } else if (expr === "surprised") {
    s(5, 6, "eyeWhite"); s(5, 9, "eyeWhite");
    s(6, 6, "eyePupil"); s(6, 9, "eyePupil");
  } else if (expr === "sleepy") {
    s(6, 6, "eyeLid"); s(6, 9, "eyeLid");
  }

  s(7, 8, "noseTip");

  if (expr === "happy") {
    s(8, 7, "lipTop"); s(8, 8, "lipBottom");
  } else if (expr === "surprised") {
    s(8, 7, "lipLine"); s(8, 8, "lipLine");
  } else if (expr === "shy") {
    s(8, 8, "lipHighlight");
  } else {
    s(8, 7, "lipTop");
  }

  s(6, 3, "earStud");

  s(10, 7, "skin"); s(10, 8, "skin"); s(10, 6, "skinMid"); s(10, 9, "skinMid");

  line(11, 5, 10, "sweaterBase");
  line(12, 4, 11, "sweaterBase");
  s(12, 7, "sweaterKnit"); s(12, 8, "sweaterKnit");
  line(13, 4, 11, "sweaterKnit");
  s(13, 5, "sweaterShadow"); s(13, 7, "sweaterShadow"); s(13, 9, "sweaterShadow"); s(13, 11, "sweaterShadow");
  line(14, 3, 12, "sweaterShadow");
  line(15, 3, 12, "sweaterBase");

  return g;
}

// ──────────────────────────────────────────────
//  32×32
// ──────────────────────────────────────────────
function generateFace32(expr = "neutral") {
  const { g, s, line, rect } = makeGrid(32, 32);

  // === HAIR ===
  line(0, 10, 22, "hairBlack");
  rect(1, 8, 2, 23, "hairBlack");
  rect(3, 7, 4, 24, "hairDark");
  s(1, 11, "hairHighlight"); s(1, 14, "hairShine"); s(1, 18, "hairHighlight"); s(1, 21, "hairShine");
  s(2, 10, "hairMid"); s(2, 13, "hairHighlight"); s(2, 16, "hairShine"); s(2, 19, "hairHighlight"); s(2, 22, "hairMid");
  s(3, 9, "hairHighlight"); s(3, 12, "hairShine"); s(3, 17, "hairHighlight"); s(3, 20, "hairShine"); s(3, 23, "hairMid");
  s(4, 10, "hairHighlight"); s(4, 15, "hairShine"); s(4, 19, "hairHighlight");

  // Side hair
  rect(5, 6, 9, 7, "hairDark"); rect(5, 24, 8, 25, "hairDark");
  s(5, 7, "hairMid"); s(7, 6, "hairHighlight"); s(9, 7, "hairMid");
  s(6, 25, "hairHighlight"); s(8, 24, "hairMid");
  s(10, 6, "hairDark"); s(11, 6, "hairMid"); s(12, 7, "hairDark"); s(13, 7, "hairMid");
  s(14, 7, "hairDark"); s(15, 7, "hairMid");
  s(9, 25, "hairDark"); s(10, 25, "hairMid"); s(11, 25, "hairDark"); s(12, 24, "hairMid");

  // === FACE ===
  rect(5, 8, 5, 23, "skinShadow");
  rect(6, 8, 6, 23, "skinMid");
  line(7, 8, 23, "skin");
  s(7, 13, "skinLight"); s(7, 14, "skinLight"); s(7, 17, "skinLight"); s(7, 18, "skinLight");
  rect(8, 8, 17, 23, "skin");
  s(8, 14, "skinLight"); s(8, 15, "skinLight"); s(8, 16, "skinLight"); s(8, 17, "skinLight");
  rect(8, 8, 10, 8, "skinMid"); rect(8, 23, 10, 23, "skinMid");
  s(15, 8, "skinMid"); s(16, 8, "skinMid"); s(17, 8, "skinMid");
  s(15, 23, "skinMid"); s(16, 23, "skinMid"); s(17, 23, "skinMid");
  rect(18, 9, 18, 22, "skin"); s(18, 9, "skinMid"); s(18, 22, "skinMid");
  rect(19, 10, 19, 21, "skin"); s(19, 10, "skinMid"); s(19, 21, "skinMid");
  line(20, 12, 19, "skinMid");

  // === EYEBROWS ===
  line(9, 10, 13, "eyeBrow"); s(9, 10, "hairMid");
  line(9, 18, 21, "eyeBrow"); s(9, 21, "hairMid");
  if (expr === "thinking") {
    s(8, 10, "eyeBrow"); s(8, 11, "eyeBrow"); s(8, 12, "eyeBrow"); s(8, 13, "eyeBrow");
    line(9, 10, 13, "skin");
  }

  // === GLASSES ===
  line(10, 9, 14, "glassFrame"); line(10, 17, 22, "glassFrame");
  s(10, 10, "glassFrameHi"); s(10, 18, "glassFrameHi");
  s(11, 15, "glassFrame"); s(11, 16, "glassFrame");
  s(10, 15, "glassFrameHi"); s(10, 16, "glassFrameHi");
  for (let r = 11; r <= 13; r++) { s(r, 9, "glassFrame"); s(r, 14, "glassFrame"); s(r, 17, "glassFrame"); s(r, 22, "glassFrame"); }
  line(13, 9, 14, "glassFrame"); line(13, 17, 22, "glassFrame");
  rect(11, 10, 12, 13, "glassLens"); rect(11, 18, 12, 21, "glassLens");
  s(12, 10, "glassLensSh"); s(12, 13, "glassLensSh"); s(12, 18, "glassLensSh"); s(12, 21, "glassLensSh");
  s(11, 10, "glassReflect"); s(11, 18, "glassReflect");

  // === EYES ===
  const eyeNeutral = () => {
    s(11, 11, "eyeWhite"); s(11, 12, "eyeIrisMid"); s(11, 13, "eyeIris");
    s(12, 11, "eyeWhite"); s(12, 12, "eyeIris"); s(12, 13, "eyeIrisRing");
    s(12, 12, "eyePupil"); s(11, 12, "eyeHighlight");
    s(10, 11, "eyeLash"); s(10, 12, "eyeLash"); s(10, 13, "eyeLash");
    s(13, 12, "eyeLash");
    s(11, 18, "eyeIris"); s(11, 19, "eyeIrisMid"); s(11, 20, "eyeWhite");
    s(12, 18, "eyeIrisRing"); s(12, 19, "eyeIris"); s(12, 20, "eyeWhite");
    s(12, 19, "eyePupil"); s(11, 19, "eyeHighlight");
    s(10, 18, "eyeLash"); s(10, 19, "eyeLash"); s(10, 20, "eyeLash");
    s(13, 19, "eyeLash");
  };

  if (expr === "neutral") {
    eyeNeutral();
  } else if (expr === "happy") {
    s(11, 10, "eyeLash"); s(12, 11, "eyeLash"); s(12, 12, "eyeLash"); s(12, 13, "eyeLash"); s(11, 13, "eyeLash");
    s(11, 18, "eyeLash"); s(12, 18, "eyeLash"); s(12, 19, "eyeLash"); s(12, 20, "eyeLash"); s(11, 21, "eyeLash");
    s(11, 11, "eyeLid"); s(11, 12, "eyeLid"); s(11, 19, "eyeLid"); s(11, 20, "eyeLid");
  } else if (expr === "shy") {
    s(11, 11, "eyeIrisMid"); s(11, 12, "eyeWhite"); s(12, 11, "eyeIris"); s(12, 12, "eyeWhite");
    s(11, 11, "eyeHighlight");
    s(10, 11, "eyeLash"); s(10, 12, "eyeLash"); s(13, 11, "eyeLash");
    s(11, 20, "eyeIrisMid"); s(12, 20, "eyeIris"); s(11, 19, "eyeWhite"); s(12, 19, "eyeWhite");
    s(11, 20, "eyeHighlight");
    s(10, 19, "eyeLash"); s(10, 20, "eyeLash"); s(13, 20, "eyeLash");
    rect(14, 9, 15, 11, "blush"); s(14, 10, "blushLight");
    rect(14, 20, 15, 22, "blush"); s(14, 21, "blushLight");
  } else if (expr === "thinking") {
    s(11, 12, "eyeWhite"); s(11, 13, "eyeIrisMid"); s(12, 12, "eyeWhite"); s(12, 13, "eyeWhite");
    s(11, 13, "eyeHighlight"); s(10, 12, "eyeLash"); s(10, 13, "eyeLash"); s(13, 12, "eyeLash");
    s(11, 20, "eyeWhite"); s(11, 21, "eyeIrisMid"); s(12, 20, "eyeWhite"); s(12, 21, "eyeWhite");
    s(11, 20, "eyeHighlight"); s(10, 19, "eyeLash"); s(10, 20, "eyeLash"); s(13, 19, "eyeLash");
  } else if (expr === "surprised") {
    s(10, 11, "eyeWhite"); s(10, 12, "eyeWhite"); s(10, 13, "eyeWhite");
    s(11, 11, "eyeWhite"); s(11, 12, "eyeIrisMid"); s(11, 13, "eyeWhite");
    s(12, 11, "eyeWhite"); s(12, 12, "eyePupil"); s(12, 13, "eyeWhite");
    s(11, 12, "eyeHighlight");
    s(10, 18, "eyeWhite"); s(10, 19, "eyeWhite"); s(10, 20, "eyeWhite");
    s(11, 18, "eyeWhite"); s(11, 19, "eyeIrisMid"); s(11, 20, "eyeWhite");
    s(12, 18, "eyeWhite"); s(12, 19, "eyePupil"); s(12, 20, "eyeWhite");
    s(11, 19, "eyeHighlight");
    s(9, 11, "eyeLash"); s(9, 12, "eyeLash"); s(9, 13, "eyeLash");
    s(9, 18, "eyeLash"); s(9, 19, "eyeLash"); s(9, 20, "eyeLash");
  } else if (expr === "sleepy") {
    s(11, 10, "eyeLid"); s(11, 11, "eyeLid"); s(11, 12, "eyeLid"); s(11, 13, "eyeLid");
    s(12, 11, "eyeIris"); s(12, 12, "eyeIris"); s(12, 13, "eyeWhite");
    s(11, 17, "eyeLid"); s(11, 18, "eyeLid"); s(11, 19, "eyeLid"); s(11, 20, "eyeLid"); s(11, 21, "eyeLid");
    s(12, 18, "eyeWhite"); s(12, 19, "eyeIris"); s(12, 20, "eyeIris");
    s(13, 12, "eyeLash"); s(13, 19, "eyeLash");
  }

  // === NOSE ===
  s(14, 16, "noseSide"); s(15, 15, "noseTip"); s(15, 16, "noseSide");

  // === MOUTH ===
  if (expr === "happy") {
    line(17, 14, 17, "lipTop"); s(17, 13, "lipLine"); s(17, 18, "lipLine");
    line(18, 14, 17, "lipBottom"); s(18, 15, "lipHighlight"); s(18, 16, "lipHighlight");
  } else if (expr === "surprised") {
    s(17, 15, "lipTop"); s(17, 16, "lipTop");
    s(18, 15, "lipBottom"); s(18, 16, "lipBottom");
  } else if (expr === "shy") {
    s(17, 15, "lipTop"); s(17, 16, "lipHighlight");
  } else if (expr === "sleepy") {
    line(17, 14, 16, "lipTop"); s(17, 15, "lipHighlight");
  } else {
    line(17, 14, 17, "lipTop"); s(17, 15, "lipHighlight");
  }

  // === EAR + STUD ===
  s(11, 7, "skinMid"); s(12, 7, "skin"); s(13, 7, "skinMid");
  s(12, 6, "earStud"); s(13, 6, "earStudShine");

  // === NECK ===
  rect(20, 13, 21, 18, "skin");
  s(20, 13, "skinMid"); s(20, 18, "skinMid"); s(21, 13, "skinShadow"); s(21, 18, "skinShadow");
  s(20, 15, "skinLight"); s(20, 16, "skinLight");

  // === SWEATER ===
  rect(22, 8, 23, 23, "sweaterBase");
  rect(24, 6, 27, 25, "sweaterBase");
  rect(28, 5, 31, 26, "sweaterBase");
  s(22, 14, "sweaterShadow"); s(22, 17, "sweaterShadow");
  s(23, 15, "sweaterDeep"); s(23, 16, "sweaterDeep");
  for (let r = 25; r <= 31; r += 2) {
    for (let c = 7; c <= 24; c += 2) {
      s(r, c, r % 4 === 1 ? "sweaterShadow" : "sweaterKnit");
    }
  }
  rect(26, 14, 28, 15, "sweaterLight");
  rect(26, 7, 28, 8, "sweaterShadow"); rect(26, 23, 28, 24, "sweaterShadow");
  rect(29, 6, 31, 7, "sweaterDeep"); rect(29, 24, 31, 25, "sweaterDeep");

  return g;
}

// ──────────────────────────────────────────────
//  48×48
// ──────────────────────────────────────────────
function generateFace48(expr = "neutral") {
  const { g, s, line, rect } = makeGrid(48, 48);

  // === HAIR ===
  rect(0, 14, 1, 34, "hairBlack");
  rect(2, 11, 3, 36, "hairBlack");
  rect(4, 9, 6, 38, "hairDark");
  rect(7, 8, 8, 39, "hairDark");
  for (let i = 0; i < 7; i++) {
    s(2, 13 + i * 3, "hairHighlight"); s(3, 15 + i * 3, "hairShine");
    s(4, 12 + i * 4, "hairHighlight"); s(5, 14 + i * 4, "hairShine");
    s(6, 11 + i * 4, "hairMid"); s(7, 13 + i * 4, "hairHighlight");
  }
  line(3, 18, 22, "hairShine"); line(4, 20, 24, "hairShine");

  // Side hair
  rect(9, 7, 14, 9, "hairDark"); rect(9, 38, 13, 40, "hairDark");
  s(10, 8, "hairMid"); s(12, 9, "hairHighlight"); s(14, 8, "hairMid");
  s(10, 39, "hairHighlight"); s(12, 40, "hairMid");
  rect(15, 7, 20, 8, "hairDark"); s(16, 8, "hairMid"); s(18, 7, "hairHighlight"); s(20, 8, "hairMid");
  rect(21, 7, 24, 8, "hairMid"); s(22, 7, "hairHighlight");
  rect(14, 39, 18, 40, "hairDark"); s(15, 40, "hairMid"); s(17, 39, "hairHighlight");

  // === FACE ===
  rect(8, 10, 9, 37, "skinShadow");
  rect(10, 10, 11, 37, "skinMid");
  rect(12, 10, 13, 37, "skin");
  rect(11, 18, 12, 28, "skinLight");
  rect(14, 10, 27, 37, "skin");
  rect(10, 10, 14, 11, "skinMid"); rect(10, 36, 14, 37, "skinMid");
  rect(18, 14, 20, 17, "skinLight"); rect(18, 30, 20, 33, "skinLight");
  rect(22, 10, 26, 11, "skinMid"); rect(22, 36, 26, 37, "skinMid");
  rect(27, 12, 27, 35, "skin"); s(27, 12, "skinMid"); s(27, 35, "skinMid");
  rect(28, 13, 28, 34, "skin"); s(28, 13, "skinMid"); s(28, 34, "skinMid");
  rect(29, 14, 29, 33, "skinMid");
  rect(30, 16, 30, 31, "skinMid");
  line(31, 18, 29, "skinShadow");

  // === EYEBROWS ===
  line(13, 14, 21, "eyeBrow"); s(13, 14, "hairMid"); s(13, 21, "hairMid");
  s(12, 16, "eyeBrow"); s(12, 17, "eyeBrow");
  line(13, 26, 33, "eyeBrow"); s(13, 26, "hairMid"); s(13, 33, "hairMid");
  s(12, 30, "eyeBrow"); s(12, 31, "eyeBrow");
  if (expr === "thinking") {
    line(13, 14, 21, "skin"); s(12, 16, "skin"); s(12, 17, "skin");
    line(12, 14, 21, "eyeBrow"); s(12, 14, "hairMid"); s(12, 21, "hairMid");
    s(11, 16, "eyeBrow"); s(11, 17, "eyeBrow"); s(11, 18, "eyeBrow");
  }

  // === GLASSES ===
  line(15, 12, 22, "glassFrame"); line(15, 25, 35, "glassFrame");
  s(15, 13, "glassFrameHi"); s(15, 14, "glassFrameHi"); s(15, 26, "glassFrameHi"); s(15, 27, "glassFrameHi");
  line(16, 22, 25, "glassFrame"); s(15, 23, "glassFrameHi"); s(15, 24, "glassFrameHi");
  for (let r = 16; r <= 21; r++) { s(r, 12, "glassFrame"); s(r, 22, "glassFrame"); s(r, 25, "glassFrame"); s(r, 35, "glassFrame"); }
  line(21, 12, 22, "glassFrame"); line(21, 25, 35, "glassFrame");
  rect(16, 13, 20, 21, "glassLens"); rect(16, 26, 20, 34, "glassLens");
  line(20, 13, 21, "glassLensSh"); line(20, 26, 34, "glassLensSh");
  rect(16, 13, 17, 14, "glassReflect"); rect(16, 26, 17, 27, "glassReflect");

  // === EYES (full detail) ===
  const drawEyeL = (gazeX, wide) => {
    const cx = 17 + gazeX;
    rect(17, 14, 19, 20, "eyeWhite");
    if (wide) { rect(16, 15, 16, 19, "eyeWhite"); }
    line(16, 14, 20, "eyeLash"); if (!wide) { s(16, 15, "eyeLash"); s(16, 19, "eyeLash"); }
    s(16, 13, "eyeLash"); s(16, 21, "eyeLash");
    s(20, 16, "eyeLash"); s(20, 17, "eyeLash"); s(20, 18, "eyeLash");
    rect(17, cx - 1, 19, cx + 1, "eyeIris");
    s(17, cx - 1, "eyeIrisMid"); s(17, cx + 1, "eyeIrisMid");
    s(19, cx - 1, "eyeIrisRing"); s(19, cx, "eyeIrisRing"); s(19, cx + 1, "eyeIrisRing");
    s(18, cx, "eyePupil"); s(18, cx - 1, "eyePupil");
    s(17, cx, "eyeHighlight"); s(17, cx + 1, "eyeHighlight");
    s(15, 15, "eyeLid"); s(15, 16, "eyeLid"); s(15, 17, "eyeLid"); s(15, 18, "eyeLid"); s(15, 19, "eyeLid");
  };
  const drawEyeR = (gazeX, wide) => {
    const cx = 30 + gazeX;
    rect(17, 27, 19, 33, "eyeWhite");
    if (wide) { rect(16, 28, 16, 32, "eyeWhite"); }
    line(16, 27, 33, "eyeLash"); if (!wide) { s(16, 28, "eyeLash"); s(16, 32, "eyeLash"); }
    s(16, 26, "eyeLash"); s(16, 34, "eyeLash");
    s(20, 29, "eyeLash"); s(20, 30, "eyeLash"); s(20, 31, "eyeLash");
    rect(17, cx - 1, 19, cx + 1, "eyeIris");
    s(17, cx - 1, "eyeIrisMid"); s(17, cx + 1, "eyeIrisMid");
    s(19, cx - 1, "eyeIrisRing"); s(19, cx, "eyeIrisRing"); s(19, cx + 1, "eyeIrisRing");
    s(18, cx, "eyePupil"); s(18, cx + 1, "eyePupil");
    s(17, cx, "eyeHighlight"); s(17, cx - 1, "eyeHighlight");
    s(15, 28, "eyeLid"); s(15, 29, "eyeLid"); s(15, 30, "eyeLid"); s(15, 31, "eyeLid"); s(15, 32, "eyeLid");
  };

  if (expr === "neutral") { drawEyeL(0, false); drawEyeR(0, false); }
  else if (expr === "happy") {
    s(18, 14, "eyeLash"); s(19, 15, "eyeLash"); line(19, 16, 19, "eyeLash"); s(19, 20, "eyeLash"); s(18, 21, "eyeLash");
    s(17, 15, "eyeLid"); s(17, 16, "eyeLid"); s(17, 17, "eyeLid"); s(17, 18, "eyeLid"); s(17, 19, "eyeLid"); s(17, 20, "eyeLid");
    s(18, 27, "eyeLash"); s(19, 28, "eyeLash"); line(19, 29, 32, "eyeLash"); s(19, 33, "eyeLash"); s(18, 34, "eyeLash");
    s(17, 28, "eyeLid"); s(17, 29, "eyeLid"); s(17, 30, "eyeLid"); s(17, 31, "eyeLid"); s(17, 32, "eyeLid"); s(17, 33, "eyeLid");
  } else if (expr === "shy") {
    drawEyeL(-1, false); drawEyeR(-1, false);
    rect(22, 12, 24, 16, "blush"); rect(22, 13, 23, 15, "blushLight");
    rect(22, 31, 24, 35, "blush"); rect(22, 32, 23, 34, "blushLight");
  } else if (expr === "thinking") {
    drawEyeL(1, false); drawEyeR(1, false);
  } else if (expr === "surprised") {
    drawEyeL(0, true); drawEyeR(0, true);
  } else if (expr === "sleepy") {
    rect(16, 14, 18, 20, "eyeLid");
    s(19, 15, "eyeWhite"); s(19, 16, "eyeIris"); s(19, 17, "eyeIris"); s(19, 18, "eyeWhite");
    s(19, 16, "eyeHighlight"); s(20, 16, "eyeLash"); s(20, 17, "eyeLash");
    rect(16, 27, 18, 33, "eyeLid");
    s(19, 29, "eyeWhite"); s(19, 30, "eyeIris"); s(19, 31, "eyeIris"); s(19, 32, "eyeWhite");
    s(19, 31, "eyeHighlight"); s(20, 30, "eyeLash"); s(20, 31, "eyeLash");
  }

  // === NOSE ===
  s(22, 24, "noseSide"); s(23, 23, "noseSide"); s(23, 24, "noseTip");
  s(24, 23, "noseTip"); s(24, 24, "noseSide"); s(24, 22, "skinLight"); s(25, 23, "noseSide");

  // === MOUTH ===
  if (expr === "happy") {
    line(26, 20, 27, "lipTop"); s(26, 19, "lipLine"); s(26, 28, "lipLine");
    line(27, 20, 27, "lipBottom"); line(27, 22, 25, "lipHighlight");
    s(28, 21, "lipLine"); s(28, 26, "lipLine");
  } else if (expr === "surprised") {
    rect(26, 22, 28, 25, "lipTop"); rect(27, 22, 28, 25, "lipBottom");
    s(27, 23, "lipHighlight"); s(27, 24, "lipHighlight");
    s(26, 22, "lipLine"); s(26, 25, "lipLine"); s(28, 22, "lipLine"); s(28, 25, "lipLine");
  } else if (expr === "shy") {
    s(26, 23, "lipTop"); s(26, 24, "lipTop"); s(26, 25, "lipHighlight"); s(27, 24, "lipBottom");
  } else if (expr === "sleepy") {
    line(26, 22, 25, "lipTop"); s(26, 23, "lipHighlight");
  } else {
    line(26, 21, 26, "lipTop"); s(26, 23, "lipHighlight"); s(26, 24, "lipHighlight");
    line(27, 22, 25, "lipBottom"); s(27, 23, "lipHighlight");
  }

  // === EAR + STUD ===
  s(17, 9, "skinMid"); s(18, 9, "skin"); s(19, 9, "skin"); s(20, 9, "skinMid");
  s(18, 8, "earStud"); s(19, 8, "earStud"); s(18, 7, "earStudShine");

  // === NECK ===
  rect(31, 19, 33, 28, "skin");
  rect(31, 19, 31, 20, "skinMid"); rect(31, 27, 31, 28, "skinMid");
  s(32, 19, "skinShadow"); s(32, 28, "skinShadow");
  rect(31, 22, 32, 25, "skinLight");

  // === SWEATER ===
  rect(34, 12, 36, 35, "sweaterBase"); rect(37, 9, 41, 38, "sweaterBase"); rect(42, 7, 47, 40, "sweaterBase");
  s(34, 20, "sweaterShadow"); s(34, 27, "sweaterShadow");
  s(35, 21, "sweaterShadow"); s(35, 26, "sweaterShadow");
  s(36, 22, "sweaterDeep"); s(36, 23, "sweaterDeep"); s(36, 24, "sweaterDeep"); s(36, 25, "sweaterDeep");
  s(34, 19, "sweaterLight"); s(34, 28, "sweaterLight");
  for (let r = 38; r <= 47; r += 2) {
    for (let c = 10; c <= 37; c += 3) { s(r, c, r % 4 === 0 ? "sweaterShadow" : "sweaterKnit"); }
  }
  rect(38, 22, 47, 25, "sweaterLight");
  rect(39, 9, 44, 11, "sweaterShadow"); rect(45, 7, 47, 9, "sweaterDeep");
  rect(39, 36, 44, 38, "sweaterShadow"); rect(45, 38, 47, 40, "sweaterDeep");

  return g;
}

const GENERATORS = { 16: generateFace16, 32: generateFace32, 48: generateFace48 };
const EXPRESSIONS = [
  { key: "neutral",   label: "默认",  emoji: "😐" },
  { key: "happy",     label: "开心",  emoji: "😊" },
  { key: "shy",       label: "害羞",  emoji: "😳" },
  { key: "thinking",  label: "思考",  emoji: "🤔" },
  { key: "surprised", label: "惊讶",  emoji: "😮" },
  { key: "sleepy",    label: "困倦",  emoji: "😪" },
];
const SIZES = [16, 32, 48];

// ─── Pixel Canvas ───
function PixelCanvas({ grid, palette, cellSize, showGrid, beadMode }) {
  const canvasRef = useRef(null);
  const H = grid.length, W = grid[0].length;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cw = W * cellSize, ch = H * cellSize;
    canvas.width = cw; canvas.height = ch;
    ctx.clearRect(0, 0, cw, ch);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const ck = grid[r][c];
        const color = palette[ck];
        if (!color || color === "transparent") continue;
        const x = c * cellSize, y = r * cellSize;
        if (beadMode) {
          ctx.fillStyle = "#EDEAE4";
          ctx.fillRect(x, y, cellSize, cellSize);
          const rad = cellSize * 0.42;
          ctx.beginPath(); ctx.arc(x + cellSize / 2, y + cellSize / 2, rad, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.fill();
          ctx.beginPath(); ctx.arc(x + cellSize / 2, y + cellSize / 2, rad * 0.14, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fill();
          ctx.beginPath(); ctx.arc(x + cellSize / 2 - rad * 0.22, y + cellSize / 2 - rad * 0.26, rad * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.38)"; ctx.fill();
        } else {
          ctx.fillStyle = color; ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
    if (showGrid && !beadMode) {
      ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 0.5;
      for (let r = 0; r <= H; r++) { ctx.beginPath(); ctx.moveTo(0, r * cellSize); ctx.lineTo(cw, r * cellSize); ctx.stroke(); }
      for (let c = 0; c <= W; c++) { ctx.beginPath(); ctx.moveTo(c * cellSize, 0); ctx.lineTo(c * cellSize, ch); ctx.stroke(); }
    }
  }, [grid, palette, cellSize, showGrid, beadMode, W, H]);
  return <canvas ref={canvasRef} style={{ imageRendering: beadMode ? "auto" : "pixelated" }} />;
}

function BeadCount({ grid, palette }) {
  const counts = useMemo(() => {
    const m = {};
    grid.forEach(row => row.forEach(k => { if (k !== "transparent" && palette[k]) m[k] = (m[k] || 0) + 1; }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [grid, palette]);
  const total = counts.reduce((s, [, n]) => s + n, 0);
  return (
    <div style={{ fontSize: 11, lineHeight: 1.6, color: "#aaa" }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "#d0c8b8" }}>用量 · {total} 颗 · {counts.length} 色</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px" }}>
        {counts.map(([k, n]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette[k], border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />
            <span style={{ color: "#888", fontSize: 10 }}>{k}</span>
            <span style={{ color: "#666", fontSize: 10 }}>×{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ColorLegend({ palette }) {
  const groups = [
    { label: "肤色", keys: ["skinLight", "skin", "skinMid", "skinShadow", "skinDeep"] },
    { label: "发色", keys: ["hairBlack", "hairDark", "hairMid", "hairHighlight", "hairShine"] },
    { label: "眼部", keys: ["eyeWhite", "eyeIrisMid", "eyeIris", "eyeIrisRing", "eyePupil", "eyeHighlight", "eyeLash", "eyeLid", "eyeBrow"] },
    { label: "五官", keys: ["noseTip", "noseSide", "lipTop", "lipBottom", "lipHighlight", "lipLine", "blush", "blushLight"] },
    { label: "配饰", keys: ["glassFrame", "glassFrameHi", "glassLens", "glassLensSh", "glassReflect", "earStud", "earStudShine"] },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 10 }}>
      {groups.map(gr => (
        <div key={gr.label}>
          <div style={{ color: "#7a8ba8", marginBottom: 2 }}>{gr.label}</div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {gr.keys.map(k => palette[k] ? (
              <span key={k} title={k} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: palette[k], border: "1px solid rgba(255,255,255,0.1)" }} />
            ) : null)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ZhixingPixelLab() {
  const [paletteKey, setPaletteKey] = useState("mard168");
  const [size, setSize] = useState(32);
  const [expr, setExpr] = useState("neutral");
  const [showGrid, setShowGrid] = useState(true);
  const [beadMode, setBeadMode] = useState(false);
  const [animating, setAnimating] = useState(false);

  const palette = PALETTES[paletteKey].colors;
  const grid = useMemo(() => GENERATORS[size](expr), [size, expr]);

  useEffect(() => {
    if (!animating) return;
    const seq = ["neutral", "neutral", "neutral", "sleepy", "neutral", "neutral", "happy", "neutral", "thinking", "neutral", "shy", "neutral"];
    let i = 0;
    const t = setInterval(() => { setExpr(seq[i % seq.length]); i++; }, 500);
    return () => clearInterval(t);
  }, [animating]);

  const cellSize = beadMode ? Math.min(Math.floor(380 / size), 18) : Math.min(Math.floor(440 / size), 22);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #12101C 0%, #1A1830 35%, #141028 100%)",
      fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
      color: "#e0e0e0", padding: "20px 12px",
      display: "flex", flexDirection: "column", alignItems: "center"
    }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{
          fontSize: 18, fontWeight: 700, letterSpacing: 3, margin: 0,
          background: "linear-gradient(90deg, #d4a06c, #f0d4a4, #d4a06c)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>陆知行 · 像素表情工坊 v2</h1>
        <div style={{ fontSize: 10, color: "#5a6880", marginTop: 3, letterSpacing: 2 }}>
          REFINED FACE · {Object.keys(palette).length - 1} DISCRETE COLORS · BEAD-READY
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 920 }}>
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 10
        }}>
          <div style={{
            background: beadMode ? "#EDEAE4" : palette.bg,
            padding: beadMode ? 3 : 6, borderRadius: 6,
            boxShadow: "inset 0 2px 12px rgba(0,0,0,0.25)"
          }}>
            <PixelCanvas grid={grid} palette={palette} cellSize={cellSize} showGrid={showGrid} beadMode={beadMode} />
          </div>
          <div style={{ fontSize: 10, color: "#5a6880", display: "flex", gap: 10 }}>
            <span>{size}×{size}px</span><span>·</span><span>{beadMode ? "拼豆" : "像素"}模式</span>
          </div>
          {beadMode && (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 10, width: "100%", maxWidth: 380 }}>
              <BeadCount grid={grid} palette={palette} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 230, maxWidth: 260 }}>
          <CG label="分辨率">
            <div style={{ display: "flex", gap: 5 }}>
              {SIZES.map(sz => <Btn key={sz} active={size === sz} onClick={() => setSize(sz)}>{sz}×{sz}</Btn>)}
            </div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 3 }}>
              {size === 16 ? "极简 icon" : size === 32 ? "迷你形态（推荐）" : "高细节 / 拼豆大板"}
            </div>
          </CG>

          <CG label="表情">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
              {EXPRESSIONS.map(e => (
                <Btn key={e.key} active={expr === e.key && !animating} onClick={() => { setAnimating(false); setExpr(e.key); }}>
                  {e.emoji} {e.label}
                </Btn>
              ))}
            </div>
          </CG>

          <CG label="色板">
            {Object.entries(PALETTES).map(([key, p]) => (
              <button key={key} onClick={() => setPaletteKey(key)} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "5px 8px", marginBottom: 2, border: "1px solid",
                borderRadius: 6, cursor: "pointer",
                borderColor: paletteKey === key ? "#c89860" : "rgba(255,255,255,0.06)",
                background: paletteKey === key ? "rgba(200,152,96,0.1)" : "transparent",
                fontFamily: "inherit", textAlign: "left",
                color: paletteKey === key ? "#c89860" : "#777", transition: "all 0.15s"
              }}>
                <div style={{ display: "flex", gap: 1.5 }}>
                  {["hairBlack", "skin", "eyeIris", "lipTop", "sweaterBase", "glassFrame"].map(ck => (
                    <span key={ck} style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: p.colors[ck], border: "1px solid rgba(0,0,0,0.2)" }} />
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11 }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: "#555" }}>{p.desc}</div>
                </div>
              </button>
            ))}
          </CG>

          <CG label="渲染">
            <Toggle label="网格线" value={showGrid && !beadMode} onChange={setShowGrid} disabled={beadMode} />
            <Toggle label="拼豆预览" value={beadMode} onChange={setBeadMode} />
            <Toggle label="表情循环" value={animating} onChange={v => { setAnimating(v); if (!v) setExpr("neutral"); }} />
          </CG>

          <CG label="色阶图例">
            <ColorLegend palette={palette} />
          </CG>
        </div>
      </div>

      <div style={{
        marginTop: 20, width: "100%", maxWidth: 920,
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 12, padding: 14
      }}>
        <div style={{ fontSize: 11, color: "#5a6880", marginBottom: 8, letterSpacing: 1 }}>SPRITE SHEET · {size}×{size}</div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
          {EXPRESSIONS.map(e => {
            const eg = GENERATORS[size](e.key);
            const sc = Math.max(Math.floor(110 / size), 2);
            return (
              <div key={e.key} style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{
                  background: palette.bg, borderRadius: 5, padding: 2,
                  border: expr === e.key ? "2px solid #c89860" : "2px solid transparent",
                  cursor: "pointer", transition: "border-color 0.15s"
                }} onClick={() => { setAnimating(false); setExpr(e.key); }}>
                  <PixelCanvas grid={eg} palette={palette} cellSize={sc} showGrid={false} beadMode={false} />
                </div>
                <div style={{ fontSize: 9, color: "#666", marginTop: 3 }}>{e.emoji} {e.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CG({ label, children }) {
  return (<div><div style={{ fontSize: 9, color: "#5a6880", marginBottom: 4, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</div>{children}</div>);
}
function Btn({ active, onClick, children }) {
  return (<button onClick={onClick} style={{
    flex: 1, padding: "5px 0", border: "1px solid",
    borderColor: active ? "#c89860" : "rgba(255,255,255,0.08)",
    borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: "inherit",
    background: active ? "rgba(200,152,96,0.12)" : "rgba(255,255,255,0.02)",
    color: active ? "#c89860" : "#777", transition: "all 0.15s"
  }}>{children}</button>);
}
function Toggle({ label, value, onChange, disabled }) {
  return (<button onClick={() => !disabled && onChange(!value)} style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    width: "100%", padding: "3px 6px", background: "transparent", border: "none",
    cursor: disabled ? "default" : "pointer", fontFamily: "inherit", fontSize: 11,
    color: disabled ? "#444" : "#888", opacity: disabled ? 0.5 : 1, marginBottom: 2
  }}>
    <span>{label}</span>
    <span style={{ width: 26, height: 13, borderRadius: 7, background: value ? "rgba(200,152,96,0.45)" : "rgba(255,255,255,0.08)", position: "relative", transition: "background 0.15s" }}>
      <span style={{ position: "absolute", top: 2, left: value ? 15 : 2, width: 9, height: 9, borderRadius: 5, background: value ? "#c89860" : "#555", transition: "all 0.15s" }} />
    </span>
  </button>);
}
