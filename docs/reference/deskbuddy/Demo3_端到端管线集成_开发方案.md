# Demo 3：端到端管线集成 — 开发方案

> DeskBuddy · v0.1 · 2026.03
> 前置文档：Demo 2 验证通过后启动本阶段

---

## 0. 本 Demo 的定位

Demo 3 是整个"照片→桌宠皮肤"管线的**首次端到端贯通**。它把 Demo 1 验证的 AI 风格化能力和 Demo 2 验证的 Spine Skin 热替换能力串联起来，中间补上最关键的缺失环节——**部件拆分与 Atlas 组装**。

完成后，用户可以第一次体验到：上传一张照片 → 等待 10~25 秒 → 桌宠变成"像自己"的专属角色。

**预计工时：5–7 天**

### 与前两个 Demo 的关系

```
Demo 1 (已完成)          Demo 2 (已完成)          Demo 3 (本阶段)
───────────────         ───────────────         ───────────────
AI 分析照片              Spine Skin 热替换        AI 图像生成
输出角色描述 JSON        运行时纹理替换验证       部件拆分
Prompt 调优              atlas 模板坐标固化       Atlas 自动组装
                         方案 A/B 确定            全流程串联
                         ↓                        ↓
                    atlas-template.json  ←──── 作为组装模板
                    skin-swap.ts         ←──── 作为替换引擎
```

---

## 1. 验证目标 & 成功标准

### 1.1 必须通过

| # | 验证项 | 成功标准 |
|---|--------|----------|
| V1 | 照片→卡通风格图 | 输入真人照片，AI 输出风格统一的 512×512 卡通全身角色，保留发型/发色/服装颜色 |
| V2 | 卡通图→部件拆分 | 全身图被正确拆分为 ≥6 个部件（head/face/torso/arm×2/leg×2），无严重截断 |
| V3 | 部件→Atlas 组装 | 各部件按 atlas-template.json 的坐标打包到 1024×1024 图集，region 对齐误差 ≤2px |
| V4 | Atlas→桌宠换肤 | 生成的图集通过 Demo 2 的 skin-swap 模块应用到桌宠，动画正常播放 |
| V5 | 端到端成功率 | 10 张不同照片测试，≥6 张能走完全流程生成可用皮肤（60% 成功率） |

### 1.2 可选验证

| # | 验证项 | 成功标准 |
|---|--------|----------|
| V6 | 多风格一致性 | 同一照片 × 3 种风格模板，输出的角色特征一致（可辨认为同一人）|
| V7 | 边缘质量 | 部件裁剪边缘经羽化处理，动画过程中无硬边锯齿 |
| V8 | 耗时控制 | 端到端 ≤25 秒（不含用户操作时间） |

---

## 2. 技术架构

### 2.1 整体管线

```
┌─────────────────────────────────────────────────────────────┐
│                     Demo 3 管线全景                          │
│                                                             │
│  [用户照片]                                                  │
│      │                                                      │
│      ▼                                                      │
│  ┌──────────┐   512×512 PNG                                 │
│  │ Stage 1  │──────────────┐                                │
│  │ 预处理    │              │                                │
│  └──────────┘              ▼                                │
│                    ┌──────────────┐   512×512 卡通全身图      │
│                    │   Stage 2    │─────────────┐            │
│                    │ AI 风格化     │             │            │
│                    └──────────────┘             ▼            │
│                              ┌──────────────────────────┐    │
│                              │        Stage 3           │    │
│                              │   ┌──────────────────┐   │    │
│                              │   │ 3a. AI 语义分割   │   │    │
│                              │   │    (边界框检测)    │   │    │
│                              │   └────────┬─────────┘   │    │
│                              │            ▼             │    │
│                              │   ┌──────────────────┐   │    │
│                              │   │ 3b. 模板约束裁剪  │   │    │
│                              │   │  (atlas 坐标对齐) │   │    │
│                              │   └────────┬─────────┘   │    │
│                              │            ▼             │    │
│                              │   ┌──────────────────┐   │    │
│                              │   │ 3c. 边缘修正     │   │    │
│                              │   │  (羽化/修复)      │   │    │
│                              │   └────────┬─────────┘   │    │
│                              └────────────┼─────────────┘    │
│                                           ▼                  │
│                    ┌──────────────┐   1024×1024 atlas.png    │
│                    │   Stage 4    │ + atlas.json             │
│                    │ Atlas 组装   │─────────────┐            │
│                    └──────────────┘             ▼            │
│                                        ┌─────────────┐      │
│                                        │  skin-swap   │      │
│                                        │  (Demo 2)    │      │
│                                        └──────┬──────┘      │
│                                               ▼              │
│                                        [桌宠换肤完成]         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Stage 对应关系

| Stage | 输入 | 输出 | 执行位置 | 依赖 |
|-------|------|------|----------|------|
| Stage 1 预处理 | 用户原图 (JPEG/PNG) | 512×512 PNG | 前端 + 本地 | react-easy-crop |
| Stage 2 风格化 | 512×512 PNG | 512×512 卡通全身图 PNG | 云端 AI API | GPT-4o / Gemini |
| Stage 3 拆分 | 卡通全身图 | N 个部件 PNG + 边界框 JSON | 云端 AI API + 本地 | AI API + Canvas |
| Stage 4 组装 | 部件 PNG + atlas-template.json | 1024×1024 atlas.png + atlas.json | 本地 | Canvas / Sharp |

---

## 3. 各 Stage 详细设计

### 3.1 Stage 1：照片预处理

#### 3.1.1 裁剪组件

```tsx
// src/skin-gen/components/PhotoCropper.tsx

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface Props {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
}

export function PhotoCropper({ imageSrc, onCropComplete }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(async (_: any, croppedAreaPixels: any) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    img.src = imageSrc;
    await new Promise(r => img.onload = r);

    ctx.drawImage(
      img,
      croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0, 512, 512
    );

    const base64 = canvas.toDataURL('image/png').split(',')[1];
    onCropComplete(base64);
  }, [imageSrc, onCropComplete]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 400 }}>
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={handleCropComplete}
        cropShape="rect"
        showGrid={true}
      />
    </div>
  );
}
```

#### 3.1.2 输入校验

```typescript
// src/skin-gen/validators.ts

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePhoto(file: File): ValidationResult {
  // 格式检查
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return { valid: false, error: '仅支持 JPEG / PNG 格式' };
  }
  // 大小检查
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: '文件大小不能超过 5MB' };
  }
  return { valid: true };
}

export async function validateImageDimensions(base64: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width < 256 || img.height < 256) {
        resolve({ valid: false, error: '图片分辨率不能低于 256×256' });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => resolve({ valid: false, error: '图片加载失败' });
    img.src = `data:image/png;base64,${base64}`;
  });
}
```

---

### 3.2 Stage 2：AI 风格化

#### 3.2.1 API 抽象层

```typescript
// src/skin-gen/ai/types.ts

export interface StylizeRequest {
  imageBase64: string;
  styleId: string;          // 'kawaii' | 'pixel' | 'cyber'
  outputSize?: number;      // 默认 512
}

export interface StylizeResponse {
  imageBase64: string;      // 风格化后的图片
  provider: string;         // 'openai' | 'gemini'
  latencyMs: number;
}

export interface AIProvider {
  name: string;
  stylize(req: StylizeRequest): Promise<StylizeResponse>;
}
```

#### 3.2.2 GPT-4o 实现

```typescript
// src/skin-gen/ai/openai-provider.ts

import type { AIProvider, StylizeRequest, StylizeResponse } from './types';

const STYLE_PROMPTS: Record<string, string> = {
  kawaii: `Transform this photo into a cute chibi-style desktop pet character.
Requirements:
- 2.5-head body proportion (large head, compact body)
- Soft pastel outlines, large expressive eyes
- Japanese kawaii aesthetic, warm soft cel-shading
- Character faces slightly left at 3/4 angle
- Full body visible including feet, arms slightly away from body
- Clean white background, no shadows on ground
- PRESERVE exactly: hair style, hair color, eye color, clothing colors, distinctive accessories (glasses, hat, etc.)
- Simple clothing silhouette that retains original color scheme
- Hands visible as simple mitten-like shapes`,

  pixel: `Transform this photo into a pixel art desktop pet character.
Requirements:
- 16-bit retro game character style
- Clean pixel edges, NO anti-aliasing
- Limited color palette (max 24 colors)
- Blocky proportions, 3-head ratio
- Character faces slightly left at 3/4 angle
- Full body visible including feet
- Clean white background
- PRESERVE exactly: hair style, hair color, clothing colors, distinctive accessories
- Each body part should be clearly distinguishable by color blocks`,

  cyber: `Transform this photo into a cyberpunk-style desktop pet character.
Requirements:
- Sleek futuristic chibi design, 3-head proportion
- Neon glow accents on edges (cyan/magenta)
- Clean vector-like lines with tech details
- Character faces slightly left at 3/4 angle
- Full body visible including feet
- Clean white background (NOT dark background)
- PRESERVE exactly: hair style, hair color, clothing colors
- Add subtle tech accessories (earpiece, wrist device) that don't obscure original features
- Clothing simplified but with circuit-pattern details`,
};

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async stylize(req: StylizeRequest): Promise<StylizeResponse> {
    const start = performance.now();
    const prompt = STYLE_PROMPTS[req.styleId] || STYLE_PROMPTS.kawaii;

    // GPT-4o image edit API
    const formData = new FormData();
    // 将 base64 转为 Blob
    const imageBlob = base64ToBlob(req.imageBase64, 'image/png');
    formData.append('image', imageBlob, 'photo.png');
    formData.append('prompt', prompt);
    formData.append('model', 'gpt-image-1');
    formData.append('size', `${req.outputSize || 512}x${req.outputSize || 512}`);
    formData.append('quality', 'high');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${err?.error?.message || response.status}`);
    }

    const data = await response.json();
    // gpt-image-1 返回 b64_json
    const imageBase64 = data.data?.[0]?.b64_json;
    if (!imageBase64) throw new Error('No image in response');

    return {
      imageBase64,
      provider: 'openai',
      latencyMs: performance.now() - start,
    };
  }
}

function base64ToBlob(base64: string, mime: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
```

#### 3.2.3 Gemini 实现

```typescript
// src/skin-gen/ai/gemini-provider.ts

import type { AIProvider, StylizeRequest, StylizeResponse } from './types';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async stylize(req: StylizeRequest): Promise<StylizeResponse> {
    const start = performance.now();

    // Gemini 2.0 Flash - 使用 generateContent 的图文混合输入
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: req.imageBase64,
                },
              },
              {
                text: STYLE_PROMPTS[req.styleId] || STYLE_PROMPTS.kawaii,
              },
            ],
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            // Gemini 图像生成配置
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    // 从 Gemini 响应中提取生成的图片
    const imagePart = data.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart) throw new Error('No image in Gemini response');

    return {
      imageBase64: imagePart.inlineData.data,
      provider: 'gemini',
      latencyMs: performance.now() - start,
    };
  }
}
```

#### 3.2.4 Provider 工厂 & 容错

```typescript
// src/skin-gen/ai/provider-factory.ts

import type { AIProvider, StylizeRequest, StylizeResponse } from './types';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';

interface ProviderConfig {
  primary: 'openai' | 'gemini';
  openaiKey?: string;
  geminiKey?: string;
  maxRetries: number;
  timeoutMs: number;
}

export function createProvider(config: ProviderConfig): AIProvider {
  const providers: Record<string, AIProvider> = {};
  if (config.openaiKey) providers.openai = new OpenAIProvider(config.openaiKey);
  if (config.geminiKey) providers.gemini = new GeminiProvider(config.geminiKey);

  const primary = providers[config.primary];
  if (!primary) throw new Error(`Primary provider ${config.primary} not configured`);

  // 包装：超时 + 重试 + 降级
  return {
    name: `${config.primary} (with fallback)`,
    async stylize(req: StylizeRequest): Promise<StylizeResponse> {
      for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
          return await withTimeout(
            primary.stylize(req),
            config.timeoutMs
          );
        } catch (err) {
          console.warn(`[AI] Attempt ${attempt + 1} failed:`, err);
          if (attempt === config.maxRetries) {
            // 尝试降级到备用 provider
            const fallbackName = config.primary === 'openai' ? 'gemini' : 'openai';
            const fallback = providers[fallbackName];
            if (fallback) {
              console.log(`[AI] Falling back to ${fallbackName}`);
              return await fallback.stylize(req);
            }
            throw err;
          }
          // 退避等待
          await sleep(1000 * (attempt + 1));
        }
      }
      throw new Error('All attempts exhausted');
    },
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
```

#### 3.2.5 输出质量校验

风格化输出不能直接信任——必须做基本校验再进入 Stage 3。

```typescript
// src/skin-gen/ai/output-validator.ts

export interface QualityCheckResult {
  pass: boolean;
  issues: string[];
  metrics: {
    hasTransparentBg: boolean;
    isFullBody: boolean;         // 角色是否完整（头到脚）
    aspectRatio: number;         // 角色主体的宽高比
    coverageRatio: number;       // 角色占画面的比例
  };
}

/**
 * 校验风格化输出图片的基本质量
 * 使用 Canvas 像素分析，不依赖 AI
 */
export async function checkStylizedOutput(imageBase64: string): Promise<QualityCheckResult> {
  const issues: string[] = [];

  // 加载图片到 Canvas
  const img = await loadImage(imageBase64);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // 1. 检查背景（白色或透明）
  const bgSample = sampleEdgePixels(pixels, canvas.width, canvas.height);
  const hasTransparentBg = bgSample.transparentRatio > 0.7;
  const hasWhiteBg = bgSample.whiteRatio > 0.7;
  if (!hasTransparentBg && !hasWhiteBg) {
    issues.push('背景不干净：可能包含复杂场景');
  }

  // 2. 检查角色是否完整（主体 bounding box）
  const bbox = findContentBoundingBox(pixels, canvas.width, canvas.height);
  const contentHeight = bbox.bottom - bbox.top;
  const contentWidth = bbox.right - bbox.left;
  const coverageRatio = (contentWidth * contentHeight) / (canvas.width * canvas.height);
  const aspectRatio = contentWidth / contentHeight;

  // 全身角色的宽高比通常在 0.3~0.7 之间（窄长形）
  const isFullBody = aspectRatio >= 0.2 && aspectRatio <= 0.8 && coverageRatio >= 0.15;
  if (!isFullBody) {
    issues.push(`角色比例异常 (宽高比 ${aspectRatio.toFixed(2)}, 覆盖率 ${(coverageRatio * 100).toFixed(1)}%)`);
  }

  // 3. 检查角色是否触达底部（有脚）
  const bottomRow = scanRow(pixels, canvas.width, canvas.height, canvas.height - 20);
  if (bottomRow.contentPixels < 5) {
    // 角色没有延伸到图片底部附近，可能缺少脚部
    // 但这不是严格错误，只是警告
    issues.push('角色可能未延伸到底部（脚部可能被截断）');
  }

  return {
    pass: issues.filter(i => !i.includes('可能')).length === 0,
    issues,
    metrics: {
      hasTransparentBg: hasTransparentBg || hasWhiteBg,
      isFullBody,
      aspectRatio,
      coverageRatio,
    },
  };
}

// --- 辅助函数 ---

function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64}`;
  });
}

function sampleEdgePixels(pixels: Uint8ClampedArray, w: number, h: number) {
  let transparent = 0, white = 0, total = 0;
  // 采样四条边各 50 个点
  const positions = [
    ...Array.from({ length: 50 }, (_, i) => ({ x: Math.floor(i * w / 50), y: 0 })),
    ...Array.from({ length: 50 }, (_, i) => ({ x: Math.floor(i * w / 50), y: h - 1 })),
    ...Array.from({ length: 50 }, (_, i) => ({ x: 0, y: Math.floor(i * h / 50) })),
    ...Array.from({ length: 50 }, (_, i) => ({ x: w - 1, y: Math.floor(i * h / 50) })),
  ];
  for (const { x, y } of positions) {
    const idx = (y * w + x) * 4;
    const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2], a = pixels[idx + 3];
    if (a < 30) transparent++;
    if (r > 240 && g > 240 && b > 240 && a > 200) white++;
    total++;
  }
  return { transparentRatio: transparent / total, whiteRatio: white / total };
}

function findContentBoundingBox(pixels: Uint8ClampedArray, w: number, h: number) {
  let top = h, bottom = 0, left = w, right = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = pixels[idx + 3];
      const isWhite = pixels[idx] > 240 && pixels[idx + 1] > 240 && pixels[idx + 2] > 240;
      if (a > 30 && !isWhite) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  return { top, bottom, left, right };
}

function scanRow(pixels: Uint8ClampedArray, w: number, h: number, y: number) {
  let contentPixels = 0;
  for (let x = 0; x < w; x++) {
    const idx = (y * w + x) * 4;
    if (pixels[idx + 3] > 30) contentPixels++;
  }
  return { contentPixels };
}
```

---

### 3.3 Stage 3：部件拆分（核心难点）

这是全管线中技术风险最高的环节。提供三种并行方案，按推荐顺序排列。

#### 3.3.1 方案 Alpha：AI 单次调用直出分层图（推荐首选）

**核心思路：** 跳过"先生成全身图再拆"的两步流程，在 Stage 2 的 AI 调用中直接要求按 slot 输出各部件。

```typescript
// src/skin-gen/segment/alpha-direct-gen.ts
// 方案 Alpha：AI 直出分层部件

import type { AIProvider } from '../ai/types';

interface SlotSpec {
  name: string;
  width: number;
  height: number;
  description: string;
}

// 从 atlas-template.json 加载的 slot 规格
const SLOT_SPECS: SlotSpec[] = [
  { name: 'head',   width: 256, height: 256, description: 'head with hair, ears, from above shoulders' },
  { name: 'face',   width: 128, height: 128, description: 'expression layer: eyes, eyebrows, mouth, nose, glasses' },
  { name: 'torso',  width: 192, height: 256, description: 'upper body clothing, from shoulders to waist' },
  { name: 'arm_L',  width: 64,  height: 192, description: 'left arm with sleeve, slightly bent' },
  { name: 'arm_R',  width: 64,  height: 192, description: 'right arm with sleeve, slightly bent' },
  { name: 'leg_L',  width: 80,  height: 192, description: 'left leg with pants/skirt, from waist to ankle' },
  { name: 'leg_R',  width: 80,  height: 192, description: 'right leg with pants/skirt, from waist to ankle' },
  { name: 'foot_L', width: 64,  height: 64,  description: 'left foot/shoe' },
  { name: 'foot_R', width: 64,  height: 64,  description: 'right foot/shoe' },
];

function buildDirectGenPrompt(stylePrompt: string): string {
  const slotList = SLOT_SPECS
    .map(s => `  - "${s.name}" (${s.width}×${s.height}px): ${s.description}`)
    .join('\n');

  return `You are a character sprite sheet designer.

Given this reference photo, generate a grid of character body parts for a desktop pet.

STYLE: ${stylePrompt}

REQUIRED OUTPUT: A single image containing a grid layout of body parts.
Arrange the parts in a 4×3 grid, each cell clearly separated by white space:

Row 1: [head 256×256] [torso 192×256] [face 128×128]
Row 2: [arm_L 64×192] [arm_R 64×192] [leg_L 80×192] [leg_R 80×192]
Row 3: [foot_L 64×64] [foot_R 64×64] [empty] [empty]

CRITICAL RULES:
- Each part must be on a TRANSPARENT or WHITE background
- Parts must be drawn to fill their cell (no tiny parts in large cells)
- All parts must share the same art style, color palette, and lighting
- Skin color must be consistent across all exposed skin parts
- Clothing color/pattern must be consistent between torso, arms, and legs
- PRESERVE from the photo: hair style, hair color, eye color, clothing colors, accessories
- The head part includes hair and ears
- The face part is ONLY the expression features (eyes, brows, mouth) — it overlays on top of the head
- Arms are drawn slightly bent at a natural rest pose
- Left/right parts should be mirror-appropriate (not identical)

Output a single image with all parts arranged in this grid.`;
}

export interface DirectGenResult {
  gridImageBase64: string;    // AI 输出的网格图
  slotSpecs: SlotSpec[];       // 用于后续裁剪的 slot 规格
}

export async function directGenParts(
  photoBase64: string,
  styleId: string,
  provider: AIProvider,
): Promise<DirectGenResult> {
  const stylePrompt = STYLE_PROMPTS[styleId] || STYLE_PROMPTS.kawaii;
  const prompt = buildDirectGenPrompt(stylePrompt);

  const result = await provider.stylize({
    imageBase64: photoBase64,
    styleId,
    outputSize: 1024,  // 需要更大尺寸来容纳网格
  });

  return {
    gridImageBase64: result.imageBase64,
    slotSpecs: SLOT_SPECS,
  };
}

/**
 * 从网格图中裁剪各部件
 * 基于预定义的网格布局坐标
 */
export async function cropPartsFromGrid(
  gridBase64: string,
): Promise<Map<string, string>> {
  const img = await loadImage(gridBase64);
  const parts = new Map<string, string>();

  // 网格布局定义（基于 1024×1024 图）
  // 这些坐标需要根据 AI 实际输出微调
  const gridLayout: Record<string, { x: number; y: number; w: number; h: number }> = {
    head:   { x: 10,  y: 10,  w: 256, h: 256 },
    torso:  { x: 276, y: 10,  w: 192, h: 256 },
    face:   { x: 478, y: 10,  w: 128, h: 128 },
    arm_L:  { x: 10,  y: 276, w: 64,  h: 192 },
    arm_R:  { x: 84,  y: 276, w: 64,  h: 192 },
    leg_L:  { x: 158, y: 276, w: 80,  h: 192 },
    leg_R:  { x: 248, y: 276, w: 80,  h: 192 },
    foot_L: { x: 10,  y: 478, w: 64,  h: 64  },
    foot_R: { x: 84,  y: 478, w: 64,  h: 64  },
  };

  for (const [name, rect] of Object.entries(gridLayout)) {
    const canvas = document.createElement('canvas');
    canvas.width = rect.w;
    canvas.height = rect.h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
    parts.set(name, canvas.toDataURL('image/png').split(',')[1]);
  }

  return parts;
}
```

> **方案 Alpha 的关键风险：** AI 是否能按 prompt 要求输出严格的网格布局。GPT-4o 的图像生成在结构化布局上表现不稳定——需要实测并迭代 prompt。如果布局不准，fallback 到方案 Beta。

#### 3.3.2 方案 Beta：全身图 + AI 语义分割（稳妥路线）

**核心思路：** Stage 2 输出一张完整的卡通全身图，然后用第二次 AI 调用做语义分割，返回各部件的边界框坐标。

```typescript
// src/skin-gen/segment/beta-ai-segment.ts
// 方案 Beta：AI 语义分割 + 模板约束裁剪

/**
 * 使用 AI 识别卡通角色各部件的边界框
 */
export async function detectBodyParts(
  stylizedImageBase64: string,
): Promise<Record<string, BoundingBox>> {

  // 调用 AI API（这里用 Claude 或 GPT-4o 的 vision 能力）
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: stylizedImageBase64 },
          },
          {
            type: 'text',
            text: `Analyze this cartoon character image and identify the bounding box of each body part.

Return ONLY a JSON object with these keys. Each value is [x, y, width, height] in pixels (image is 512×512):

{
  "head": [x, y, w, h],
  "face": [x, y, w, h],
  "torso": [x, y, w, h],
  "arm_L": [x, y, w, h],
  "arm_R": [x, y, w, h],
  "leg_L": [x, y, w, h],
  "leg_R": [x, y, w, h],
  "foot_L": [x, y, w, h],
  "foot_R": [x, y, w, h]
}

Rules:
- "head" includes hair and ears
- "face" is just the facial features area (eyes, nose, mouth) within the head
- Left/right are from the CHARACTER's perspective
- Bounding boxes can overlap (head and face will overlap)
- Be precise — the coordinates will be used for automated cropping
- Return ONLY the JSON, no other text`,
          },
        ],
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid bounding boxes');

  return JSON.parse(jsonMatch[0]);
}

interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 使用 AI 检测到的边界框 + atlas 模板的目标尺寸进行约束裁剪
 *
 * 核心逻辑：
 *   1. AI 返回的 bbox 告诉我们"部件在哪"（粗定位）
 *   2. atlas-template 告诉我们"部件应该多大"（精确尺寸）
 *   3. 我们以 AI bbox 的中心为基准，按模板尺寸裁剪（精确裁剪）
 */
export async function cropWithTemplateConstraint(
  stylizedBase64: string,
  aiBboxes: Record<string, number[]>,       // AI 检测到的 [x,y,w,h]
  atlasTemplate: Record<string, { w: number; h: number }>,  // 目标尺寸
): Promise<Map<string, string>> {
  const img = await loadImage(stylizedBase64);
  const parts = new Map<string, string>();

  for (const [slotName, targetSize] of Object.entries(atlasTemplate)) {
    const aiBbox = aiBboxes[slotName];
    if (!aiBbox) {
      console.warn(`[Segment] No bbox for slot: ${slotName}`);
      continue;
    }

    // AI bbox 中心点
    const centerX = aiBbox[0] + aiBbox[2] / 2;
    const centerY = aiBbox[1] + aiBbox[3] / 2;

    // 以中心点为基准，按目标尺寸计算裁剪区域
    // 需要先计算缩放比：AI bbox 尺寸 → 目标尺寸
    const scaleX = targetSize.w / aiBbox[2];
    const scaleY = targetSize.h / aiBbox[3];
    const scale = Math.min(scaleX, scaleY);  // 保持比例，取较小值

    // 从原图中裁剪（使用 AI bbox + 小幅扩展）
    const srcX = Math.max(0, aiBbox[0] - 5);
    const srcY = Math.max(0, aiBbox[1] - 5);
    const srcW = Math.min(img.width - srcX, aiBbox[2] + 10);
    const srcH = Math.min(img.height - srcY, aiBbox[3] + 10);

    const canvas = document.createElement('canvas');
    canvas.width = targetSize.w;
    canvas.height = targetSize.h;
    const ctx = canvas.getContext('2d')!;

    // 居中绘制，保持比例
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const drawX = (targetSize.w - drawW) / 2;
    const drawY = (targetSize.h - drawH) / 2;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, drawX, drawY, drawW, drawH);

    // 边缘羽化
    applyFeathering(ctx, canvas.width, canvas.height, 4);

    parts.set(slotName, canvas.toDataURL('image/png').split(',')[1]);
  }

  return parts;
}

/**
 * 边缘羽化处理：对裁剪边缘做渐变透明，避免硬边
 */
function applyFeathering(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  radius: number,
) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      // 到边缘的最小距离
      const distToEdge = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (distToEdge < radius) {
        const factor = distToEdge / radius;
        pixels[idx + 3] = Math.round(pixels[idx + 3] * factor);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
```

#### 3.3.3 方案 Gamma：本地模型分割（离线备用）

**核心思路：** 使用 MediaPipe / ONNX 本地模型做 pose estimation + segmentation，不依赖云端 AI。

```typescript
// src/skin-gen/segment/gamma-local-model.ts
// 方案 Gamma：本地模型分割（不依赖网络）
// 仅在方案 Alpha/Beta 都不可用时启用

/**
 * 使用 MediaPipe Pose 检测关键点，据此推算各部件边界框
 *
 * MediaPipe Pose 返回 33 个关键点：
 *   0: nose, 11: left_shoulder, 12: right_shoulder,
 *   23: left_hip, 24: right_hip, 25: left_knee, 26: right_knee,
 *   27: left_ankle, 28: right_ankle, ...
 *
 * 我们用关键点坐标推算各部件的 bounding box
 */

interface Keypoint {
  x: number;  // 归一化 0~1
  y: number;
  visibility: number;
}

// 从关键点推算部件边界框的映射规则
function keypointsToBboxes(
  keypoints: Keypoint[],
  imgW: number,
  imgH: number,
): Record<string, [number, number, number, number]> {

  const kp = (idx: number) => ({
    x: keypoints[idx].x * imgW,
    y: keypoints[idx].y * imgH,
  });

  const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const nose = kp(0);
  const lShoulder = kp(11);
  const rShoulder = kp(12);
  const lHip = kp(23);
  const rHip = kp(24);
  const lKnee = kp(25);
  const rKnee = kp(26);
  const lAnkle = kp(27);
  const rAnkle = kp(28);

  const shoulderMid = midpoint(lShoulder, rShoulder);
  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);

  return {
    // head: 从图顶部到肩膀上方
    head: [
      shoulderMid.x - shoulderWidth * 0.8,
      Math.max(0, nose.y - shoulderWidth * 1.2),
      shoulderWidth * 1.6,
      shoulderMid.y - (nose.y - shoulderWidth * 1.2),
    ],
    // face: nose 为中心的小区域
    face: [
      nose.x - shoulderWidth * 0.35,
      nose.y - shoulderWidth * 0.3,
      shoulderWidth * 0.7,
      shoulderWidth * 0.6,
    ],
    // torso: 肩膀到臀部
    torso: [
      rShoulder.x - 10,
      shoulderMid.y,
      shoulderWidth + 20,
      lHip.y - shoulderMid.y,
    ],
    // arms (简化：肩膀到臀部高度的侧方区域)
    arm_L: [lShoulder.x, lShoulder.y, shoulderWidth * 0.4, lHip.y - lShoulder.y],
    arm_R: [rShoulder.x - shoulderWidth * 0.4, rShoulder.y, shoulderWidth * 0.4, rHip.y - rShoulder.y],
    // legs
    leg_L: [lHip.x - 15, lHip.y, 40, lAnkle.y - lHip.y],
    leg_R: [rHip.x - 25, rHip.y, 40, rAnkle.y - rHip.y],
    // feet
    foot_L: [lAnkle.x - 20, lAnkle.y, 50, 40],
    foot_R: [rAnkle.x - 30, rAnkle.y, 50, 40],
  };
}

// 注意：MediaPipe Pose 对卡通图的识别精度不如真人照片
// 这是方案 Gamma 的主要局限性
```

#### 3.3.4 方案选择决策树

```
用户上传照片
    │
    ▼
Stage 2 生成卡通全身图
    │
    ▼
尝试方案 Alpha（AI 直出网格）
    │
    ├── 成功：网格布局正确 ──▶ 从网格裁剪各部件 ──▶ Stage 4
    │
    └── 失败：网格布局混乱
        │
        ▼
    尝试方案 Beta（AI 语义分割）
        │
        ├── 成功：bbox 合理 ──▶ 模板约束裁剪 ──▶ Stage 4
        │
        └── 失败：bbox 严重偏差
            │
            ▼
        方案 Gamma（本地 MediaPipe）
            │
            ├── 成功 ──▶ 模板约束裁剪 ──▶ Stage 4
            │
            └── 失败 ──▶ 降级方案：仅替换 head 和 torso 的颜色
```

---

### 3.4 Stage 4：Atlas 组装

#### 3.4.1 组装器

```typescript
// src/skin-gen/atlas/assembler.ts

import type { AtlasTemplate, AtlasRegion } from './types';

/**
 * 将各部件 PNG 按 atlas 模板坐标组装为 1024×1024 图集
 */
export async function assembleAtlas(
  parts: Map<string, string>,           // slot name → base64 PNG
  template: AtlasTemplate,              // Demo 2 产出的 atlas-template.json
): Promise<{ atlasBase64: string; atlasJson: AtlasOutput }> {

  const canvas = document.createElement('canvas');
  canvas.width = template.width;    // 1024
  canvas.height = template.height;  // 1024
  const ctx = canvas.getContext('2d')!;

  // 清空为透明
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const usedRegions: AtlasRegion[] = [];

  for (const region of template.regions) {
    const partBase64 = parts.get(region.name);
    if (!partBase64) {
      console.warn(`[Atlas] Missing part for region: ${region.name}`);
      continue;
    }

    const img = await loadImage(partBase64);

    // 绘制到图集的对应位置
    // 注意 gutter（2px 间距）
    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      region.x, region.y, region.width, region.height,
    );

    usedRegions.push(region);
  }

  // 生成 atlas JSON（兼容 Spine atlas 格式）
  const atlasJson: AtlasOutput = {
    pages: [{
      name: 'user-custom.png',
      size: { w: template.width, h: template.height },
      format: 'RGBA8888',
      filter: { min: 'Linear', mag: 'Linear' },
      repeat: 'none',
    }],
    regions: usedRegions.map(r => ({
      name: r.name,
      page: 0,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      rotate: r.rotate || false,
      offsetX: 0,
      offsetY: 0,
      originalWidth: r.width,
      originalHeight: r.height,
      index: -1,
    })),
  };

  return {
    atlasBase64: canvas.toDataURL('image/png').split(',')[1],
    atlasJson,
  };
}

// --- Types ---

export interface AtlasTemplate {
  width: number;
  height: number;
  regions: AtlasRegion[];
}

export interface AtlasRegion {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate?: boolean;
}

export interface AtlasOutput {
  pages: Array<{
    name: string;
    size: { w: number; h: number };
    format: string;
    filter: { min: string; mag: string };
    repeat: string;
  }>;
  regions: Array<{
    name: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotate: boolean;
    offsetX: number;
    offsetY: number;
    originalWidth: number;
    originalHeight: number;
    index: number;
  }>;
}
```

#### 3.4.2 Atlas 校验

```typescript
// src/skin-gen/atlas/validator.ts

export interface AtlasValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  coverage: number;     // 0~1，图集利用率
}

export function validateAtlas(
  atlasBase64: string,
  atlasJson: AtlasOutput,
  template: AtlasTemplate,
): Promise<AtlasValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. 检查所有模板 region 都有对应内容
  for (const tplRegion of template.regions) {
    const found = atlasJson.regions.find(r => r.name === tplRegion.name);
    if (!found) {
      errors.push(`缺少 region: ${tplRegion.name}`);
    } else {
      // 坐标是否匹配
      if (found.x !== tplRegion.x || found.y !== tplRegion.y) {
        errors.push(`${tplRegion.name} 坐标偏移: 期望 (${tplRegion.x},${tplRegion.y}), 实际 (${found.x},${found.y})`);
      }
      // 尺寸是否匹配
      if (found.width !== tplRegion.width || found.height !== tplRegion.height) {
        warnings.push(`${tplRegion.name} 尺寸不匹配: 期望 ${tplRegion.width}×${tplRegion.height}, 实际 ${found.width}×${found.height}`);
      }
    }
  }

  // 2. 检查 region 之间无重叠
  for (let i = 0; i < atlasJson.regions.length; i++) {
    for (let j = i + 1; j < atlasJson.regions.length; j++) {
      const a = atlasJson.regions[i];
      const b = atlasJson.regions[j];
      if (rectsOverlap(a, b)) {
        warnings.push(`Region 重叠: ${a.name} 与 ${b.name}`);
      }
    }
  }

  // 3. 计算图集利用率
  const totalArea = atlasJson.pages[0].size.w * atlasJson.pages[0].size.h;
  const usedArea = atlasJson.regions.reduce((sum, r) => sum + r.width * r.height, 0);
  const coverage = usedArea / totalArea;
  if (coverage < 0.1) warnings.push(`图集利用率过低: ${(coverage * 100).toFixed(1)}%`);

  return Promise.resolve({
    valid: errors.length === 0,
    errors,
    warnings,
    coverage,
  });
}

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}
```

---

## 4. 管线编排器

将 Stage 1–4 串联为一个统一的异步流程，带进度推送和错误恢复。

```typescript
// src/skin-gen/pipeline.ts

import { checkStylizedOutput } from './ai/output-validator';
import { createProvider } from './ai/provider-factory';
import { directGenParts, cropPartsFromGrid } from './segment/alpha-direct-gen';
import { detectBodyParts, cropWithTemplateConstraint } from './segment/beta-ai-segment';
import { assembleAtlas, type AtlasTemplate } from './atlas/assembler';
import { validateAtlas } from './atlas/validator';

// --- 状态定义 ---

export type PipelineStatus =
  | 'idle'
  | 'preprocessing'
  | 'stylizing'
  | 'segmenting'
  | 'assembling'
  | 'validating'
  | 'ready'
  | 'error';

export interface PipelineState {
  status: PipelineStatus;
  progress: number;          // 0~100
  message: string;
  result?: PipelineResult;
  error?: string;
}

export interface PipelineResult {
  atlasBase64: string;
  atlasJson: any;
  thumbnailBase64: string;   // 缩略图（用于皮肤选择界面）
  metadata: {
    provider: string;
    styleId: string;
    latencyMs: number;
    segmentMethod: 'alpha' | 'beta' | 'gamma';
    timestamp: number;
  };
}

export interface PipelineConfig {
  openaiKey?: string;
  geminiKey?: string;
  primaryProvider: 'openai' | 'gemini';
  atlasTemplate: AtlasTemplate;       // Demo 2 产出
  maxRetries: number;
  onStateChange: (state: PipelineState) => void;
}

// --- 管线编排 ---

export async function runPipeline(
  photoBase64: string,
  styleId: string,
  config: PipelineConfig,
): Promise<PipelineResult> {
  const { onStateChange, atlasTemplate } = config;
  const startTime = performance.now();

  const emit = (status: PipelineStatus, progress: number, message: string) => {
    onStateChange({ status, progress, message });
  };

  try {
    // ========== Stage 1: 预处理 ==========
    emit('preprocessing', 5, '正在处理照片...');
    // 照片已由前端裁剪组件处理为 512×512，此处做最终校验
    // （省略，直接使用输入的 photoBase64）
    emit('preprocessing', 10, '照片预处理完成');

    // ========== Stage 2: AI 风格化 ==========
    emit('stylizing', 15, '正在生成卡通风格角色...');
    const provider = createProvider({
      primary: config.primaryProvider,
      openaiKey: config.openaiKey,
      geminiKey: config.geminiKey,
      maxRetries: config.maxRetries,
      timeoutMs: 30000,
    });

    const stylizeResult = await provider.stylize({
      imageBase64: photoBase64,
      styleId,
      outputSize: 512,
    });
    emit('stylizing', 35, `风格化完成 (${stylizeResult.provider}, ${Math.round(stylizeResult.latencyMs)}ms)`);

    // 风格化输出质量校验
    emit('stylizing', 38, '正在校验输出质量...');
    const qualityCheck = await checkStylizedOutput(stylizeResult.imageBase64);
    if (!qualityCheck.pass) {
      console.warn('[Pipeline] Quality issues:', qualityCheck.issues);
      // 不立即失败，带着警告继续
    }
    emit('stylizing', 40, '风格化校验完成');

    // ========== Stage 3: 部件拆分 ==========
    emit('segmenting', 45, '正在拆分角色部件...');
    let parts: Map<string, string>;
    let segmentMethod: 'alpha' | 'beta' | 'gamma';

    // 尝试方案 Alpha
    try {
      emit('segmenting', 48, '尝试方案 Alpha: AI 直出分层...');
      const gridResult = await directGenParts(photoBase64, styleId, provider);
      parts = await cropPartsFromGrid(gridResult.gridImageBase64);

      // 快速校验：至少 6 个 slot 有内容
      const validParts = [...parts.entries()].filter(([_, b64]) => b64.length > 100);
      if (validParts.length < 6) throw new Error(`Only ${validParts.length} valid parts`);

      segmentMethod = 'alpha';
      emit('segmenting', 65, `方案 Alpha 成功 (${validParts.length} 个部件)`);
    } catch (alphaErr) {
      console.warn('[Pipeline] Alpha failed:', alphaErr);

      // 降级到方案 Beta
      try {
        emit('segmenting', 50, '方案 Alpha 失败，切换方案 Beta: AI 语义分割...');
        const bboxes = await detectBodyParts(stylizeResult.imageBase64);

        // 构建目标尺寸映射
        const targetSizes: Record<string, { w: number; h: number }> = {};
        for (const region of atlasTemplate.regions) {
          targetSizes[region.name] = { w: region.width, h: region.height };
        }

        parts = await cropWithTemplateConstraint(
          stylizeResult.imageBase64,
          bboxes,
          targetSizes,
        );

        segmentMethod = 'beta';
        emit('segmenting', 65, `方案 Beta 成功 (${parts.size} 个部件)`);
      } catch (betaErr) {
        console.warn('[Pipeline] Beta failed:', betaErr);
        // 最终降级：仅替换 head + torso 颜色
        emit('segmenting', 55, '方案 Beta 失败，执行最小化降级...');
        parts = await minimalFallback(stylizeResult.imageBase64, atlasTemplate);
        segmentMethod = 'gamma';
        emit('segmenting', 65, '降级方案完成（仅 head + torso）');
      }
    }

    // ========== Stage 4: Atlas 组装 ==========
    emit('assembling', 70, '正在组装纹理图集...');
    const { atlasBase64, atlasJson } = await assembleAtlas(parts, atlasTemplate);
    emit('assembling', 85, '图集组装完成');

    // Atlas 校验
    emit('validating', 88, '正在校验图集...');
    const atlasValidation = await validateAtlas(atlasBase64, atlasJson, atlasTemplate);
    if (!atlasValidation.valid) {
      console.error('[Pipeline] Atlas validation failed:', atlasValidation.errors);
      throw new Error(`Atlas 校验失败: ${atlasValidation.errors.join('; ')}`);
    }
    if (atlasValidation.warnings.length > 0) {
      console.warn('[Pipeline] Atlas warnings:', atlasValidation.warnings);
    }
    emit('validating', 92, '图集校验通过');

    // 生成缩略图
    emit('validating', 95, '生成缩略图...');
    const thumbnailBase64 = await generateThumbnail(stylizeResult.imageBase64, 128);

    // ========== 完成 ==========
    const result: PipelineResult = {
      atlasBase64,
      atlasJson,
      thumbnailBase64,
      metadata: {
        provider: stylizeResult.provider,
        styleId,
        latencyMs: performance.now() - startTime,
        segmentMethod,
        timestamp: Date.now(),
      },
    };

    emit('ready', 100, `生成完成 (${Math.round(result.metadata.latencyMs / 1000)}s)`);
    onStateChange({ status: 'ready', progress: 100, message: '完成', result });
    return result;

  } catch (err: any) {
    const errorMsg = err?.message || '未知错误';
    onStateChange({ status: 'error', progress: 0, message: errorMsg, error: errorMsg });
    throw err;
  }
}

// --- 辅助 ---

/** 最小化降级：从风格化图中粗暴提取 head + torso 区域 */
async function minimalFallback(
  stylizedBase64: string,
  template: AtlasTemplate,
): Promise<Map<string, string>> {
  const img = await loadImage(stylizedBase64);
  const parts = new Map<string, string>();

  // 只处理 head 和 torso，其他 slot 留空（使用 default skin 的）
  const headRegion = template.regions.find(r => r.name === 'head');
  const torsoRegion = template.regions.find(r => r.name === 'torso');

  if (headRegion) {
    // 假设头部在图片上方 1/3
    const canvas = document.createElement('canvas');
    canvas.width = headRegion.width;
    canvas.height = headRegion.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, img.width, img.height * 0.35, 0, 0, headRegion.width, headRegion.height);
    parts.set('head', canvas.toDataURL('image/png').split(',')[1]);
  }

  if (torsoRegion) {
    // 假设躯干在图片中间 1/3
    const canvas = document.createElement('canvas');
    canvas.width = torsoRegion.width;
    canvas.height = torsoRegion.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, img.height * 0.3, img.width, img.height * 0.35, 0, 0, torsoRegion.width, torsoRegion.height);
    parts.set('torso', canvas.toDataURL('image/png').split(',')[1]);
  }

  return parts;
}

async function generateThumbnail(base64: string, size: number): Promise<string> {
  const img = await loadImage(base64);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size);
  return canvas.toDataURL('image/png').split(',')[1];
}

function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64}`;
  });
}
```

---

## 5. 测试计划

### 5.1 测试素材准备

准备 10 张覆盖不同场景的照片：

| # | 类型 | 具体描述 | 预期难度 |
|---|------|----------|----------|
| P1 | 标准正面照 | 白背景证件照风格，全身 | 低 |
| P2 | 3/4 侧面 | 室内自然光，半身以上 | 低 |
| P3 | 全身照 | 户外站立，背景较复杂 | 中 |
| P4 | 坐姿照 | 只有上半身 | 中 |
| P5 | 强逆光 | 脸部偏暗，细节不清 | 高 |
| P6 | 多人照片 | 裁剪后只有一人，但可能有残留 | 高 |
| P7 | 戴帽子+眼镜 | 配饰遮挡面部，测试保留配饰 | 中 |
| P8 | 儿童 | 头身比例与成人不同 | 中 |
| P9 | 非真人 | 动漫头像，测试 AI 是否适应 | 高 |
| P10 | 宠物照片 | 故意的错误输入，测试校验 | 高 |

### 5.2 端到端测试矩阵

对每张照片 × 每种风格执行全管线，记录结果：

```
照片    风格     Stage2   Stage3        Stage4   换肤   总耗时   备注
        (风格化) (拆分方案/结果)  (组装)   (成功?)
─────────────────────────────────────────────────────────────────────
P1      kawaii   ___      Alpha/Beta/Gamma ___    □      ___s    ______
P1      pixel   ___      ___              ___    □      ___s    ______
P1      cyber   ___      ___              ___    □      ___s    ______
P2      kawaii   ___      ___              ___    □      ___s    ______
P2      pixel   ___      ___              ___    □      ___s    ______
...
```

### 5.3 分 Stage 调试流程

当端到端失败时，按以下顺序定位问题：

```
端到端失败
    │
    ├── Stage 2 输出是否合理？
    │   ├── 不是全身图 ──▶ 调整风格化 prompt
    │   ├── 风格不一致 ──▶ 更换 provider / 调整 prompt
    │   └── 正常 ──▶ 继续排查
    │
    ├── Stage 3 拆分是否正确？
    │   ├── 方案 Alpha 网格混乱 ──▶ 降级到 Beta
    │   ├── 方案 Beta bbox 偏差大 ──▶ 可视化 bbox 叠加到原图上排查
    │   ├── 部件缺失 ──▶ 检查 slot 名称映射
    │   └── 正常 ──▶ 继续排查
    │
    ├── Stage 4 组装是否正确？
    │   ├── region 坐标偏移 ──▶ 对比 atlas-template.json
    │   ├── 部件在图集中尺寸不对 ──▶ 检查裁剪缩放逻辑
    │   └── 正常 ──▶ 继续排查
    │
    └── Skin 替换是否正常？
        ├── 动画中断 ──▶ Demo 2 回归测试
        ├── 部件错位 ──▶ 对比新旧 atlas 的 region 坐标
        └── 显示异常 ──▶ 检查纹理格式（RGBA vs RGB）
```

---

## 6. 文件结构

```
src/skin-gen/
├── pipeline.ts                    # 管线编排器（本文件核心）
├── validators.ts                  # 输入校验
├── components/
│   ├── PhotoCropper.tsx           # 裁剪组件
│   ├── StyleSelector.tsx          # 风格选择
│   ├── GenerationProgress.tsx     # 生成进度 UI
│   └── SkinPreview.tsx            # 结果预览 + 应用按钮
├── ai/
│   ├── types.ts                   # AI Provider 接口
│   ├── openai-provider.ts         # GPT-4o 实现
│   ├── gemini-provider.ts         # Gemini 实现
│   ├── provider-factory.ts        # 工厂 + 容错
│   └── output-validator.ts        # 风格化输出校验
├── segment/
│   ├── alpha-direct-gen.ts        # 方案 Alpha: AI 直出网格
│   ├── beta-ai-segment.ts         # 方案 Beta: AI 语义分割
│   └── gamma-local-model.ts       # 方案 Gamma: 本地模型
├── atlas/
│   ├── assembler.ts               # Atlas 图集组装
│   ├── validator.ts               # Atlas 校验
│   └── template.json              # Demo 2 产出的 atlas 模板
└── debug/
    ├── SkinGenDebugPanel.tsx       # 调试面板（显示各 Stage 中间产物）
    └── bbox-visualizer.ts         # bbox 可视化叠加工具
```

---

## 7. 开发排期

| 天 | 任务 | 产出 | 前置 |
|----|------|------|------|
| D1 | Stage 1 裁剪组件 + Stage 2 风格化 Provider 实现（GPT-4o 优先）| 能上传照片→拿到卡通图 | AI API Key 就绪 |
| D2 | Stage 2 输出校验 + prompt 迭代（用 P1–P5 照片测试） | 风格化成功率 ≥80% | D1 |
| D3 | Stage 3 方案 Alpha 实现 + 测试 | 确定 Alpha 是否可用 | D2 |
| D4 | Stage 3 方案 Beta 实现 + 降级链路 | 拆分成功率 ≥60% | D3 |
| D5 | Stage 4 Atlas 组装 + 校验 | 能产出合规 atlas.png | D4 + Demo 2 产出 |
| D6 | 管线编排器 + 对接 Demo 2 的 skin-swap | 端到端跑通 | D5 |
| D7 | 全量测试（10 张照片 × 3 种风格）+ 修复 | 测试矩阵填写完成 | D6 |

---

## 8. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| AI 风格化输出不稳定（比例、姿态波动大） | 高 | 高 | 增加输出校验 + 自动重试（最多 3 次）；准备多套 prompt 变体 |
| 方案 Alpha 网格布局不可控 | 高 | 中 | 预期 Alpha 会失败，Beta 是真正的主方案；Alpha 定位为"如果碰巧能用就太好了" |
| Stage 3 拆分后部件在动画中露出接缝 | 中 | 高 | 加大羽化半径；在 Spine Editor 中调整 slot 层叠顺序让遮盖更自然 |
| GPT-4o 调用成本过高（大量调试消耗） | 中 | 中 | 调试阶段优先用 Gemini（成本低 5–10x）；GPT-4o 仅在 Gemini 效果不足时启用 |
| 全管线耗时超 25 秒 | 中 | 低 | 优化：Stage 2+3 如果都走 AI 调用，考虑并行化；atlas 组装用 OffscreenCanvas |
| 儿童/非常规照片风格化效果差 | 中 | 低 | 明确告知用户推荐的输入类型；非常规输入走降级路径，只替换 head+torso |

---

## 9. Demo 3 通过后的下一步

1. **Rust 化核心管线** — 将 Stage 1（预处理）和 Stage 4（atlas 组装）迁移到 Rust Backend，减少前端计算负担，也为离线缓存做准备

2. **接入 Tauri IPC** — generate_skin / get_cached_skins / delete_cached_skin 三个 Command 的实现

3. **缓存系统** — 本地持久化已生成的皮肤，photo hash + style 去重

4. **UI 打磨** — 从调试面板升级为正式的"角色外观"设置页，嵌入 DeskBuddy 设置面板

5. **Prompt 精调** — 用真实用户照片（征集内测）持续迭代 prompt，提升风格稳定性和跨照片一致性

6. **评估自托管 SD + LoRA** — 如果 API 调用成本在内测阶段验证后偏高，启动 LoRA 微调计划
