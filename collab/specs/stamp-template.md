# Stamp Variant Test Template

All 7 stamp variants follow the same test structure. Use this template, adjusting props per variant.

## Base Pattern

```typescript
/**
 * {StampName} component tests.
 * Uses shallowRender helper (ts-jest / node env, no fiber dispatcher).
 */

import React from 'react';

jest.mock('@/constants/theme', () => ({
  stamp: {
    opacity: { pixel: 0.93, seal: 0.90, minimal: 1 },
    sealDiameter: 72, sealBorder: 2.5, minimalBarWidth: 2.5,
    pixelBorder: 2, padding: 16,
    defaultPosition: 'bottom-right', defaultStyle: 'pixel',
    storageKey: 'stamp_style_preference',
    positionStorageKey: 'stamp_position_preference',
  },
}));

jest.mock('@/utils/stamp-colors', () => ({
  getStampColors: jest.fn(() => ({ brandDeep: '#c45070', brandMid: '#d46080' })),
}));

// For SVG-using variants (Medallion, Postcard, Relief, Window):
// jest.mock('react-native-svg') is handled by moduleNameMapper — no need to inline mock

import { {StampName} } from '@/components/stamps/{StampName}';

function shallowRender(element: any, depth = 15): any {
  if (element == null || typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') return element;
  if (Array.isArray(element)) return element.map(e => shallowRender(e, depth));
  if (!element.type) return element;
  if (typeof element.type === 'function' && depth > 0) {
    try {
      const output = element.type({ ...element.props });
      return shallowRender(output, depth - 1);
    } catch { return null; }
  }
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : (element.type?.name ?? 'Unknown'),
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

function renderToJson(props: Parameters<typeof {StampName}>[0]): string {
  const element = React.createElement({StampName}, props);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// Tests...
```

## Variant Props & Tests

### ClassicStamp
```typescript
const props = { spotName: '哲学の道', cityEn: 'KYOTO', date: new Date('2026-03-28'), themeColor: '#e8a5b0' };
// Tests: renders spotName, renders cityEn, renders formatted date, renders 'CLASSIC' or brand text
```

### MedallionStamp (uses SVG)
```typescript
const props = { spotName: '嵐山', seasonLabel: '桜の季節', themeColor: '#e8a5b0' };
// Tests: renders spotName, renders seasonLabel, contains Svg/Circle elements
```

### MinimalStamp
```typescript
const props = { spotName: '金閣寺', cityEn: 'KYOTO', date: new Date('2026-03-28'), accentColor: '#e8a5b0' };
// Note: uses accentColor not themeColor. Does NOT use getStampColors.
// Tests: renders spotName, renders cityEn, renders date
```

### PostcardStamp (uses SVG)
```typescript
const props = { spotName: '伏見稲荷', seasonLabel: '桜の季節', themeColor: '#e8a5b0' };
// Tests: renders spotName, renders seasonLabel, contains Svg elements
```

### ReliefStamp (uses SVG)
```typescript
const props = { spotName: '清水寺', seasonLabel: '桜の季節', themeColor: '#e8a5b0' };
// Tests: renders spotName, renders seasonLabel, contains Svg elements
```

### SealStamp
```typescript
const props = { spotName: '東大寺', seasonEmoji: '🌸', year: '2026', seasonLabel: '桜の季節', themeColor: '#e8a5b0' };
// Tests: renders spotName, renders year, renders seasonEmoji, renders seasonLabel
```

### WindowStamp (uses SVG)
```typescript
const props = { spotName: '銀閣寺', seasonLabel: '桜の季節', themeColor: '#e8a5b0' };
// Tests: renders spotName, renders seasonLabel, contains Svg elements
```

## Reference
See `__tests__/components/stamps/PixelStamp.test.tsx` for the proven working pattern.
