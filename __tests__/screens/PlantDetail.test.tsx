/**
 * PlantDetail screen tests (src/app/plant/[id].tsx).
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// Mock all dependencies BEFORE imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ja' } }),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'test-user' } }),
}));
jest.mock('@/hooks/usePlantDetail', () => ({
  usePlantDetail: () => ({
    plant: {
      id: 1,
      name_ja: 'サクラ',
      name_en: 'Cherry Blossom',
      name_latin: 'Prunus serrulata',
      rarity: 1,
      hanakotoba: '優しさ',
      flower_meaning: 'Kindness',
      color_meaning: 'Pink = Happiness',
      pixel_sprite_url: null,
      bloom_months: [3, 4],
      prefectures: ['東京', '大阪'],
      available_window: null,
    },
    discoveries: [],
    loading: false,
    error: null,
    updateNote: jest.fn(),
  }),
}));
jest.mock('@/hooks/useHerbarium', () => ({
  useHerbarium: () => ({ plants: [], collected: new Set([1]), loading: false }),
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('@/components/ShareSheet', () => ({
  ShareSheet: 'ShareSheet',
}));
jest.mock('@/components/HanakotobaFlipCard', () => ({
  HanakotobaFlipCard: 'HanakotobaFlipCard',
}));
jest.mock('@/components/SeasonPhaseIndicator', () => ({
  SeasonPhaseIndicator: 'SeasonPhaseIndicator',
}));
jest.mock('@/utils/plant-gradient', () => ({
  getPlantGradientColors: jest.fn(() => ['#e8f0e8', '#f5f4f1']),
}));
jest.mock('@/constants/plants', () => ({
  RARITY_LABELS: { 1: '★', 2: '★★', 3: '★★★ 限定' },
}));
jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', plantPrimary: '#9fb69f', text: '#3a3a3a',
    textSecondary: '#7a7a7a', border: '#e8e6e1', white: '#ffffff',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
    seasonal: { sakura: '#f5d5d0' },
    plantSecondary: '#c1e8d8',
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));

import React from 'react';
import PlantDetailScreen from '@/app/plant/[id]';

// ── shallowRender helper ──────────────────────────────────────────────────────
function shallowRender(element: any, depth = 10): any {
  if (element == null || typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') return element;
  if (Array.isArray(element)) return element.map(e => shallowRender(e, depth));
  if (!element.type) return element;
  if (typeof element.type === 'function' && depth > 0) {
    const output = element.type({ ...element.props });
    return shallowRender(output, depth - 1);
  }
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : element.type?.name ?? 'Unknown',
    props: { ...element.props, children: undefined },
    children: children != null ? (Array.isArray(children) ? children.map((c: any) => shallowRender(c, depth)) : shallowRender(children, depth)) : undefined,
  };
}

function renderToString(): string {
  const element = React.createElement(PlantDetailScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PlantDetailScreen', () => {
  it('renders plant name', () => {
    const output = renderToString();
    expect(output).toContain('サクラ');
  });

  it('renders hanakotoba flip card', () => {
    const output = renderToString();
    expect(output).toContain('HanakotobaFlipCard');
  });
});
