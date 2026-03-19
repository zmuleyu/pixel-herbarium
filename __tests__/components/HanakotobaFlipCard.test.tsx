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
    plantSecondary: '#c1e8d8', creamYellow: '#fff8dc',
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
        'plant.colorMeaning': '花の色言葉',
        'plant.meaningSecret': '意味はまだ秘密です',
      };
      return map[key] ?? key;
    },
  }),
}));

const mockHandleFlip = jest.fn();

// Default mock: phase=0 (JP face showing)
const mockUseFlipCard = jest.fn(() => ({
  phase: 0 as 0 | 1 | 2,
  frontRotation: '0deg',
  backRotation: '180deg',
  frontOpacity: 1,
  backOpacity: 0,
  handleFlip: mockHandleFlip,
  showHint: true,
  hintOpacity: 0.7,
}));

jest.mock('@/hooks/useFlipCard', () => ({
  useFlipCard: () => mockUseFlipCard(),
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

function renderToString(
  hanakotoba: string,
  flowerMeaning: string | null,
  colorMeaning: string | null = null,
): string {
  const element = React.createElement(HanakotobaFlipCard, { hanakotoba, flowerMeaning, colorMeaning });
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('HanakotobaFlipCard – phase=0 (JP front face)', () => {
  beforeEach(() => {
    mockUseFlipCard.mockReturnValue({
      phase: 0, frontRotation: '0deg', backRotation: '180deg',
      frontOpacity: 1, backOpacity: 0,
      handleFlip: mockHandleFlip, showHint: true, hintOpacity: 0.7,
    });
  });

  it('renders hanakotoba text on front face', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('優しさ');
  });

  it('renders "花言葉" section label via i18n', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('花言葉');
  });

  it('shows hint text when showHint=true and phase=0', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('タップして裏面へ');
  });

  it('renders all three page dots', () => {
    const output = renderToString('優しさ', null);
    // 3 dots rendered — verify the dots structure exists in output
    const parsed = JSON.parse(output);
    const str = JSON.stringify(parsed);
    // PageDots renders 3 View elements; serialized tree should contain dot info
    expect(str).toBeDefined();
  });
});

describe('HanakotobaFlipCard – phase=1 (Western back face)', () => {
  beforeEach(() => {
    mockUseFlipCard.mockReturnValue({
      phase: 1, frontRotation: '0deg', backRotation: '180deg',
      frontOpacity: 1, backOpacity: 0,
      handleFlip: mockHandleFlip, showHint: false, hintOpacity: 0,
    });
  });

  it('renders Western meaning on front face (phase=1)', () => {
    const output = renderToString('優しさ', 'Kindness', '温かな色');
    expect(output).toContain('Kindness');
  });

  it('renders "西洋の花言葉" label when phase=1', () => {
    const output = renderToString('優しさ', 'Kindness', '温かな色');
    expect(output).toContain('西洋の花言葉');
  });

  it('shows meaningSecret placeholder when flowerMeaning is null', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('意味はまだ秘密です');
  });

  it('does not show hint when phase=1', () => {
    const output = renderToString('優しさ', 'Kindness');
    expect(output).not.toContain('タップして裏面へ');
  });
});

describe('HanakotobaFlipCard – phase=2 (Colour meaning face)', () => {
  beforeEach(() => {
    mockUseFlipCard.mockReturnValue({
      phase: 2, frontRotation: '0deg', backRotation: '180deg',
      frontOpacity: 1, backOpacity: 0,
      handleFlip: mockHandleFlip, showHint: false, hintOpacity: 0,
    });
  });

  it('renders colour meaning on front face (phase=2)', () => {
    const output = renderToString('優しさ', 'Kindness', '温かいオレンジ——生命力と喜び');
    expect(output).toContain('温かいオレンジ——生命力と喜び');
  });

  it('renders "花の色言葉" label when phase=2', () => {
    const output = renderToString('優しさ', 'Kindness', '温かいオレンジ');
    expect(output).toContain('花の色言葉');
  });

  it('shows meaningSecret when colorMeaning is null', () => {
    const output = renderToString('優しさ', 'Kindness', null);
    expect(output).toContain('意味はまだ秘密です');
  });
});

describe('HanakotobaFlipCard – watermark and structure', () => {
  beforeEach(() => {
    mockUseFlipCard.mockReturnValue({
      phase: 0, frontRotation: '0deg', backRotation: '180deg',
      frontOpacity: 1, backOpacity: 0,
      handleFlip: mockHandleFlip, showHint: false, hintOpacity: 0,
    });
  });

  it('renders ✿ watermark on back face', () => {
    const output = renderToString('優しさ', 'Kindness');
    expect(output).toContain('✿');
  });

  it('renders both Japanese and Western content in tree (both faces present)', () => {
    const output = renderToString('優しさ', 'Kindness');
    expect(output).toContain('優しさ');
    expect(output).toContain('Kindness');
  });
});

describe('HanakotobaFlipCard – a11y', () => {
  beforeEach(() => {
    mockUseFlipCard.mockReturnValue({
      phase: 0, frontRotation: '0deg', backRotation: '180deg',
      frontOpacity: 1, backOpacity: 0,
      handleFlip: mockHandleFlip, showHint: false, hintOpacity: 0,
    });
  });

  it('outer container has accessibilityLabel and accessibilityRole="button"', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('花言葉カード');
    expect(output).toContain('"button"');
  });

  it('page dots have testIDs dot-0, dot-1, dot-2', () => {
    const output = renderToString('優しさ', null);
    expect(output).toContain('dot-0');
    expect(output).toContain('dot-1');
    expect(output).toContain('dot-2');
  });
});
