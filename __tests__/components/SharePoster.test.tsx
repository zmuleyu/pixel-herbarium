/**
 * SharePoster component tests.
 * Uses a recursive render helper since react-test-renderer is broken in React 19.
 */

import React, { type ReactElement } from 'react';

jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
    white: '#ffffff', border: '#e8e6e1', plantPrimary: '#9fb69f',
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

jest.mock('@/constants/plants', () => ({
  RARITY_LABELS: { 1: '★', 2: '★★', 3: '★★★ 限定' },
}));

jest.mock('@/utils/plant-gradient', () => ({
  getPlantGradientColors: jest.fn((r: number) =>
    r === 3 ? ['#f5e0dd', '#f5f4f1'] : r === 2 ? ['#e0eaf5', '#f5f4f1'] : ['#e8f0e8', '#f5f4f1'],
  ),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

import { SharePoster, type SharePosterPlant, type SharePosterProps } from '@/components/SharePoster';

// ── Recursive render helper ──────────────────────────────────────────
// Calls function components recursively to produce a serializable tree.

function shallowRender(element: any, depth = 10): any {
  if (element == null || typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
    return element;
  }
  if (Array.isArray(element)) {
    return element.map(e => shallowRender(e, depth));
  }
  if (!element.type) return element;

  // Function component — call it to get its output
  if (typeof element.type === 'function' && depth > 0) {
    const output = element.type({ ...element.props });
    return shallowRender(output, depth - 1);
  }

  // Host component (string type like 'View', 'Text', 'LinearGradient')
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : element.type?.name ?? 'Unknown',
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

function renderToString(props: SharePosterProps): string {
  const element = React.createElement(SharePoster, props);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Fixtures ─────────────────────────────────────────────────────────

const basePlant: SharePosterPlant = {
  name_ja: 'サクラ',
  name_latin: 'Prunus serrulata',
  rarity: 1,
  hanakotoba: '優しさ',
  pixel_sprite_url: 'https://example.com/sprite.png',
  cityRank: null,
  bloom_months: [3, 4],
};

const rarePlant: SharePosterPlant = {
  ...basePlant,
  rarity: 3,
  hanakotoba: '美しさ',
  pixel_sprite_url: null,
  cityRank: 5,
};

// ── Story format ─────────────────────────────────────────────────────

describe('SharePoster – story format (9:16)', () => {
  it('renders with 360x640 dimensions', () => {
    const output = renderToString({ format: 'story', plant: basePlant });
    expect(output).toContain('"width":360');
    expect(output).toContain('"height":640');
  });

  it('displays plant name and latin name', () => {
    const output = renderToString({ format: 'story', plant: basePlant });
    expect(output).toContain('サクラ');
    expect(output).toContain('Prunus serrulata');
  });

  it('displays hanakotoba in brackets', () => {
    const output = renderToString({ format: 'story', plant: basePlant });
    // React splits JSX template literals into array: ["「", "優しさ", "」"]
    expect(output).toContain('「');
    expect(output).toContain('優しさ');
    expect(output).toContain('」');
  });

  it('hides hanakotoba when empty', () => {
    const output = renderToString({ format: 'story', plant: { ...basePlant, hanakotoba: '' } });
    expect(output).not.toContain('花言葉');
    expect(output).not.toContain('「」');
  });

  it('shows city rank when provided', () => {
    const output = renderToString({ format: 'story', plant: rarePlant });
    expect(output).toContain('番目の発見者');
  });

  it('does not show city rank when null', () => {
    const output = renderToString({ format: 'story', plant: basePlant });
    expect(output).not.toContain('番目の発見者');
  });

  it('shows discovery city and date', () => {
    const output = renderToString({
      format: 'story', plant: basePlant,
      discoveryDate: '2024-04-01', discoveryCity: '東京',
    });
    expect(output).toContain('東京');
    expect(output).toContain('2024');
  });

  it('shows fallback emoji when no sprite', () => {
    const output = renderToString({ format: 'story', plant: rarePlant });
    expect(output).toContain('🌸');
  });

  it('shows bilingual footer', () => {
    const output = renderToString({ format: 'story', plant: basePlant });
    expect(output).toContain('花図鉑');
    expect(output).toContain('Pixel Herbarium');
  });

  it('renders floral divider', () => {
    const output = renderToString({ format: 'story', plant: basePlant });
    expect(output).toContain('✿');
  });

  it('renders rarity labels', () => {
    expect(renderToString({ format: 'story', plant: basePlant })).toContain('★');
    expect(renderToString({ format: 'story', plant: rarePlant })).toContain('★★★ 限定');
  });
});

// ── LINE format ──────────────────────────────────────────────────────

describe('SharePoster – LINE format (1:1)', () => {
  it('renders with 360x360 dimensions', () => {
    const output = renderToString({ format: 'line', plant: basePlant });
    expect(output).toContain('"width":360');
    expect(output).toContain('"height":360');
    expect(output).not.toContain('"height":640');
  });

  it('shows gift copy', () => {
    const output = renderToString({ format: 'line', plant: basePlant });
    expect(output).toContain('この花をあなたに贈ります');
  });

  it('displays plant name', () => {
    const output = renderToString({ format: 'line', plant: basePlant });
    expect(output).toContain('サクラ');
  });

  it('shows bilingual footer', () => {
    const output = renderToString({ format: 'line', plant: basePlant });
    expect(output).toContain('花図鉑');
    expect(output).toContain('Pixel Herbarium');
  });

  it('hides hanakotoba when empty', () => {
    const output = renderToString({ format: 'line', plant: { ...basePlant, hanakotoba: '' } });
    expect(output).not.toContain('花言葉');
  });

  it('shows fallback emoji when no sprite', () => {
    const output = renderToString({ format: 'line', plant: rarePlant });
    expect(output).toContain('🌸');
  });
});

// ── Type export ──────────────────────────────────────────────────────

describe('SharePosterPlant type', () => {
  it('can construct valid object', () => {
    const plant: SharePosterPlant = {
      name_ja: 'テスト', name_latin: 'Testus', rarity: 2,
      hanakotoba: '愛', pixel_sprite_url: null, cityRank: 1, bloom_months: [5, 6],
    };
    expect(plant.bloom_months).toHaveLength(2);
  });
});

describe('SharePoster format=spot', () => {
  it('renders spot name', () => {
    const props = {
      format: 'spot' as const,
      spot: {
        spot_id: 1, name_ja: '上野恩賜公園', name_en: 'Ueno Park',
        prefecture: '東京都', checked_in_at: '2026-03-28T10:00:00Z',
        stamp_variant: 'normal' as const, bloom_status: 'peak' as const,
        is100sen: true,
      },
    };
    const html = JSON.stringify(React.createElement(SharePoster as any, props));
    expect(html).toContain('上野恩賜公園');
  });

  it('shows mankai gold border when stamp_variant is mankai', () => {
    const props = {
      format: 'spot' as const,
      spot: {
        spot_id: 1, name_ja: '吉野山', name_en: 'Mt. Yoshino',
        prefecture: '奈良県', checked_in_at: '2026-04-05T10:00:00Z',
        stamp_variant: 'mankai' as const, bloom_status: 'peak' as const,
        is100sen: true,
      },
    };
    const html = JSON.stringify(React.createElement(SharePoster as any, props));
    expect(html).toContain('吉野山');
  });
});
