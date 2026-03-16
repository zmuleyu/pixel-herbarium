/**
 * HanakotobaFlipCard component tests.
 * Uses the same recursive shallowRender pattern from SharePoster.test.tsx.
 * useFlipCard is mocked directly; Animated/SecureStore/Haptics are handled
 * by the __mocks__/react-native.js mock.
 */

import React from 'react';

jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
    white: '#ffffff', border: '#e8e6e1', plantPrimary: '#9fb69f',
    creamYellow: '#fff8dc',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('1'),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'herbarium.hanakotoba': '花言葉',
        'plant.tapToFlip': 'タップして裏面へ',
        'plant.westernMeaning': '西洋の花言葉',
        'plant.meaningSecret': '意味はまだ秘密です',
      };
      return map[key] ?? key;
    },
  }),
}));

const mockHandleFlip = jest.fn();

jest.mock('@/hooks/useFlipCard', () => ({
  useFlipCard: () => ({
    isFlipped: false,
    frontRotation: '0deg',
    backRotation: '180deg',
    frontOpacity: 1,
    backOpacity: 0,
    handleFlip: mockHandleFlip,
    showHint: true,
    hintOpacity: 0.7,
  }),
}));

import { HanakotobaFlipCard } from '@/components/HanakotobaFlipCard';

// ── Recursive render helper (same pattern as SharePoster.test.tsx) ──────────

function shallowRender(element: any, depth = 10): any {
  if (element == null || typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
    return element;
  }
  if (Array.isArray(element)) {
    return element.map(e => shallowRender(e, depth));
  }
  if (!element.type) return element;

  if (typeof element.type === 'function' && depth > 0) {
    const output = element.type({ ...element.props });
    return shallowRender(output, depth - 1);
  }

  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : element.type?.name ?? 'Unknown',
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

function renderToString(hanakotoba: string, flowerMeaning: string | null): string {
  const element = React.createElement(HanakotobaFlipCard, { hanakotoba, flowerMeaning });
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('HanakotobaFlipCard – front face', () => {
  it('renders front face with hanakotoba text', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('優しさ');
  });

  it('renders section label "花言葉" via i18n', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('花言葉');
  });

  it('shows hint text when showHint=true', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('タップして裏面へ');
  });
});

describe('HanakotobaFlipCard – back face', () => {
  it('renders back face content with flowerMeaning', () => {
    const output = renderToString('優しさ', 'Kindness');
    expect(output).toContain('Kindness');
  });

  it('shows meaningSecret placeholder when flowerMeaning is null', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('意味はまだ秘密です');
  });

  it('shows watermark ✿ on back face', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('✿');
  });

  it('renders westernMeaning label on back face', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('西洋の花言葉');
  });
});
